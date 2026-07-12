import React, { createContext, useContext, useEffect, useState } from 'react';
import { setToken, getToken } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem('transitops_user');
    if (cached && getToken()) {
      setUser(JSON.parse(cached));
    }
    setReady(true);
  }, []);

  function loginSuccess({ token, user }) {
    setToken(token);
    localStorage.setItem('transitops_user', JSON.stringify(user));
    setUser(user);
  }

  function logout() {
    setToken(null);
    localStorage.removeItem('transitops_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, ready, loginSuccess, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
