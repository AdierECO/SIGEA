// contextos/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Usuario } from '../types';
import { api } from '../services/api'; // Importar tu servicio API

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  login: (token: string, usuario: Usuario) => void;
  logout: () => Promise<void>; 
  updateUsuario: (updatedData: Partial<Usuario>) => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUsuario(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  const login = (newToken: string, newUsuario: Usuario) => {
    setToken(newToken);
    setUsuario(newUsuario);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUsuario));
  };

  const logout = async () => {
    try {
      // Solo limpiar nombre/apellidos si es usuario OPERATIVO
      if (usuario?.rol === 'OPERATIVO' && usuario?.id) {
        try {
          // Intentar actualizar la BD para limpiar nombre y apellidos
          await api.put(`/usuarios/${usuario.id}`, {
            nombre: '',
            apellidos: ''
          });
        } catch (error) {
          console.error('Error al limpiar nombre/apellidos en BD:', error);
          // No detener el logout si falla la actualización
        }
      }
    } catch (error) {
      console.error('Error en proceso de logout:', error);
    } finally {
      // Siempre limpiar el contexto y localStorage
      setToken(null);
      setUsuario(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  };

  const updateUsuario = (updatedData: Partial<Usuario>) => {
    if (!usuario) return;

    const updatedUsuario = {
      ...usuario,
      ...updatedData
    };

    setUsuario(updatedUsuario);
    localStorage.setItem('user', JSON.stringify(updatedUsuario));
  };

  const isAuthenticated = !loading && !!token && !!usuario;

  return (
    <AuthContext.Provider value={{ 
      usuario, 
      token, 
      login, 
      logout, 
      updateUsuario,
      isAuthenticated, 
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};