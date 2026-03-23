import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  accessToken: string | null;
  userEmail: string | null;
  isAuthenticated: boolean;
  setAccessToken: (token: string | null) => void;
  setUserEmail: (email: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [accessToken, setAccessTokenState] = useState<string | null>(() => {
    return sessionStorage.getItem('google_access_token');
  });
  const [userEmail, setUserEmailState] = useState<string | null>(() => {
    return sessionStorage.getItem('user_email');
  });

  const setAccessToken = (token: string | null) => {
    setAccessTokenState(token);
    if (token) {
      sessionStorage.setItem('google_access_token', token);
    } else {
      sessionStorage.removeItem('google_access_token');
    }
  };

  const setUserEmail = (email: string | null) => {
    setUserEmailState(email);
    if (email) {
      sessionStorage.setItem('user_email', email);
    } else {
      sessionStorage.removeItem('user_email');
    }
  };

  const logout = () => {
    setAccessToken(null);
    setUserEmail(null);
    sessionStorage.clear();
  };

  const isAuthenticated = !!accessToken;

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        userEmail,
        isAuthenticated,
        setAccessToken,
        setUserEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
