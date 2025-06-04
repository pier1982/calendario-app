import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

// Context per l'autenticazione
const AuthContext = createContext({});

// Hook per usare il context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve essere usato dentro AuthProvider');
  }
  return context;
};

// Provider per l'autenticazione
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Effetto per monitorare lo stato di autenticazione
  useEffect(() => {
    // Ottieni la sessione corrente
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadUserProfile(session.user.id);
        }
      } catch (error) {
        console.error('Errore nel recupero della sessione:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Ascolta i cambiamenti di autenticazione
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Carica il profilo utente dal database
  const loadUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      setUserProfile(data);
    } catch (error) {
      console.error('Errore nel caricamento del profilo:', error);
      setError(error.message);
    }
  };

  // Funzione di login
  const signIn = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Errore nel login:', error);
      setError(error.message);
      return { data: null, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Funzione di registrazione
  const signUp = async (email, password, userData = {}) => {
    try {
      setError(null);
      setLoading(true);
      
      // Se l'utente si registra come admin, deve essere confermato
      let finalRole = userData.role || 'visualizzatore';
      if (userData.role === 'admin') {
        finalRole = 'pending_admin'; // Stato temporaneo in attesa di conferma
        
        // Invia email di notifica all'admin principale
        try {
          await fetch('/api/notify-admin', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              newUserEmail: email,
              newUserName: userData.full_name || email,
              adminEmail: 'gigliottipierluigi@gmail.com'
            })
          });
        } catch (notifyError) {
          console.warn('Errore nell\'invio della notifica admin:', notifyError);
          // Non bloccare la registrazione se la notifica fallisce
        }
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });

      if (error) throw error;

      // Se la registrazione è riuscita, crea il profilo utente
      if (data.user) {
        await createUserProfile(data.user.id, {
          email: data.user.email,
          full_name: userData.full_name || '',
          role: finalRole,
          ...userData
        });
      }

      return { data, error: null };
    } catch (error) {
      console.error('Errore nella registrazione:', error);
      setError(error.message);
      return { data: null, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Crea profilo utente nel database
  const createUserProfile = async (userId, profileData) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          ...profileData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      setUserProfile(data);
      return data;
    } catch (error) {
      console.error('Errore nella creazione del profilo:', error);
      throw error;
    }
  };

  // Funzione di logout
  const signOut = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Errore nel logout:', error);
      setError(error.message);
    }
  };

  // Aggiorna profilo utente
  const updateProfile = async (updates) => {
    try {
      setError(null);
      
      if (!user) throw new Error('Utente non autenticato');

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setUserProfile(data);
      return data;
    } catch (error) {
      console.error('Errore nell\'aggiornamento del profilo:', error);
      setError(error.message);
      throw error;
    }
  };

  // Funzioni di utilità per i permessi
  const hasRole = (role) => {
    return userProfile?.role === role;
  };

  const hasPermission = (permission) => {
    if (!userProfile) return false;
    
    const rolePermissions = {
      admin: ['read', 'write', 'delete', 'manage_users', 'manage_settings', 'hide_features'],
      operatore: ['read', 'write'],
      visualizzatore: ['read'],
      pending_admin: ['read'] // Admin in attesa di conferma ha solo permessi di lettura
    };

    return rolePermissions[userProfile.role]?.includes(permission) || false;
  };

  const canModifyAssignments = () => {
    return hasPermission('write');
  };

  const canManageUsers = () => {
    return hasPermission('manage_users');
  };

  const canManageSettings = () => {
    return hasPermission('manage_settings');
  };

  const canHideFeatures = () => {
    return hasPermission('hide_features');
  };

  const isPendingAdmin = () => {
    return userProfile?.role === 'pending_admin';
  };

  // Funzione per approvare un admin
  const approveAdmin = async (userId) => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ role: 'admin' })
        .eq('user_id', userId);
      
      if (error) throw error;
      
      // Ricarica il profilo se è l'utente corrente
      if (user?.id === userId) {
        await loadUserProfile(userId);
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Errore nell\'approvazione admin:', error);
      setError(error.message);
      return { data: null, error: error.message };
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Errore nel reset password:', error);
      setError(error.message);
      return { data: null, error: error.message };
    }
  };

  // Update password
  const updatePassword = async (newPassword) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Errore nell\'aggiornamento password:', error);
      setError(error.message);
      return { data: null, error: error.message };
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    updateProfile,
    resetPassword,
    updatePassword,
    hasRole,
    hasPermission,
    canModifyAssignments,
    canManageUsers,
    canManageSettings,
    canHideFeatures,
    isPendingAdmin,
    approveAdmin,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;