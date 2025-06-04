import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider.jsx';
import { supabase } from '../lib/supabase.js';

const UserManagement = ({ onClose }) => {
  const { userProfile, canManageUsers } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  // Verifica permessi
  if (!canManageUsers()) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
          <h2 className="text-xl font-semibold text-red-600 mb-4">❌ Accesso Negato</h2>
          <p className="text-gray-600 mb-4">
            Non hai i permessi necessari per gestire gli utenti.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
          >
            Chiudi
          </button>
        </div>
      </div>
    );
  }

  // Carica utenti
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Errore nel caricamento utenti:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Aggiorna ruolo utente
  const updateUserRole = async (userId, newRole) => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('user_profiles')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      // Aggiorna la lista locale
      setUsers(prev => prev.map(user => 
        user.user_id === userId ? { ...user, role: newRole } : user
      ));

      setEditingUser(null);
    } catch (err) {
      console.error('Errore nell\'aggiornamento ruolo:', err);
      setError(err.message);
    }
  };

  // Elimina utente (solo admin)
  const deleteUser = async (userId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo utente? Questa azione non può essere annullata.')) {
      return;
    }

    try {
      setError(null);

      // Elimina il profilo utente
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', userId);

      if (profileError) throw profileError;

      // Rimuovi dalla lista locale
      setUsers(prev => prev.filter(user => user.user_id !== userId));
    } catch (err) {
      console.error('Errore nell\'eliminazione utente:', err);
      setError(err.message);
    }
  };

  // Filtra utenti
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // Icone per i ruoli
  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return '👑';
      case 'operatore': return '✏️';
      case 'visualizzatore': return '👁️';
      default: return '❓';
    }
  };

  // Colori per i ruoli
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'operatore': return 'bg-blue-100 text-blue-800';
      case 'visualizzatore': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-800">
            👥 Gestione Utenti
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Filtri */}
        <div className="p-6 border-b bg-gray-50 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Ricerca */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="🔍 Cerca per nome o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filtro ruolo */}
            <div className="sm:w-48">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tutti i ruoli</option>
                <option value="admin">👑 Admin</option>
                <option value="operatore">✏️ Operatori</option>
                <option value="visualizzatore">👁️ Visualizzatori</option>
              </select>
            </div>
          </div>

          {/* Statistiche */}
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Totale: {users.length}
            </span>
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
              Admin: {users.filter(u => u.role === 'admin').length}
            </span>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Operatori: {users.filter(u => u.role === 'operatore').length}
            </span>
            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
              Visualizzatori: {users.filter(u => u.role === 'visualizzatore').length}
            </span>
          </div>
        </div>

        {/* Contenuto */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
              ❌ {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Caricamento utenti...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || filterRole !== 'all' ? (
                <>🔍 Nessun utente trovato con i filtri applicati</>
              ) : (
                <>👥 Nessun utente registrato</>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div
                  key={user.user_id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getRoleIcon(user.role)}</span>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {user.full_name || 'Nome non specificato'}
                          </h3>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                        <span>•</span>
                        <span>Registrato: {new Date(user.created_at).toLocaleDateString('it-IT')}</span>
                        {user.updated_at !== user.created_at && (
                          <>
                            <span>•</span>
                            <span>Aggiornato: {new Date(user.updated_at).toLocaleDateString('it-IT')}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Azioni */}
                    <div className="flex items-center gap-2">
                      {editingUser === user.user_id ? (
                        <div className="flex items-center gap-2">
                          <select
                            defaultValue={user.role}
                            onChange={(e) => updateUserRole(user.user_id, e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="visualizzatore">👁️ Visualizzatore</option>
                            <option value="operatore">✏️ Operatore</option>
                            <option value="admin">👑 Admin</option>
                          </select>
                          <button
                            onClick={() => setEditingUser(null)}
                            className="px-2 py-1 text-gray-500 hover:text-gray-700 text-sm"
                          >
                            ❌
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Non permettere di modificare se stesso */}
                          {user.user_id !== userProfile?.user_id && (
                            <>
                              <button
                                onClick={() => setEditingUser(user.user_id)}
                                className="px-3 py-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                                title="Modifica ruolo"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => deleteUser(user.user_id)}
                                className="px-3 py-1 text-red-600 hover:text-red-800 text-sm font-medium"
                                title="Elimina utente"
                              >
                                🗑️
                              </button>
                            </>
                          )}
                          {user.user_id === userProfile?.user_id && (
                            <span className="px-3 py-1 text-green-600 text-sm font-medium">
                              👤 Tu
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            💡 <strong>Suggerimento:</strong> Gli admin possono gestire tutti gli utenti, gli operatori possono modificare i turni.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;