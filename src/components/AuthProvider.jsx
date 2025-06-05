import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

  // Carica il profilo utente dal database
  const loadUserProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Errore nel caricamento del profilo:', error);
      throw error;
    }
  }, []);

  // Crea un nuovo profilo utente
  const createUserProfile = useCallback(async (user, additionalData = {}) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          email: user.email,
          role: additionalData.role || 'operatore',
          ...additionalData
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Errore nella creazione del profilo:', error);
      throw error;
    }
  }, []);

  // Effetto per monitorare lo stato di autenticazione
  useEffect(() => {
    // Ottieni la sessione corrente
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        setUser(session?.user ?? null);
        
        if (session?.user) {
          try {
            const profile = await loadUserProfile(session.user.id);
            
            // Se l'utente non ha un profilo e l'email è confermata, crea il profilo
            if (!profile && session.user.email_confirmed_at) {
              try {
                const newProfile = await createUserProfile(session.user, { role: 'operatore' });
                setUserProfile(newProfile);
              } catch (error) {
                console.error('Errore nella creazione automatica del profilo:', error);
                setUserProfile(null);
              }
            } else {
              setUserProfile(profile);
            }
          } catch (error) {
            console.error('Errore nel caricamento del profilo:', error);
            setUserProfile(null);
          }
        } else {
          setUserProfile(null);
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
        setUser(session?.user ?? null);
        
        if (session?.user) {
          try {
            // Carica profilo direttamente senza usare le funzioni callback
            const { data: profile, error } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .single();
            
            // Se l'utente non ha un profilo e l'email è confermata, crea il profilo
            if ((!profile || error?.code === 'PGRST116') && session.user.email_confirmed_at) {
              try {
                const { data: newProfile, error: createError } = await supabase
                  .from('user_profiles')
                  .insert({
                    user_id: session.user.id,
                    email: session.user.email,
                    role: 'operatore'
                  })
                  .select()
                  .single();
                  
                if (createError) throw createError;
                setUserProfile(newProfile);
              } catch (error) {
                console.error('Errore nella creazione automatica del profilo:', error);
                setUserProfile(null);
              }
            } else if (profile && !error) {
              setUserProfile(profile);
            } else {
              setUserProfile(null);
            }
          } catch (error) {
            console.error('Errore nel caricamento del profilo:', error);
            setUserProfile(null);
          }
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

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

  // Funzione di registrazione con creazione automatica del profilo
  const signUp = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) throw error;
      
      // Se la registrazione è avvenuta con successo e l'utente è confermato,
      // crea automaticamente il profilo utente
      if (data.user && !data.user.email_confirmed_at) {
        // L'utente deve confermare l'email prima che il profilo venga creato
        console.log('Utente registrato. Conferma email richiesta.');
      } else if (data.user) {
        // Crea il profilo utente automaticamente
        await createUserProfile(data.user, { role: 'operatore' });
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