import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const SESSION_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
const WARNING_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiration

interface AuthContextType {
  accessToken: string | null;
  userEmail: string | null;
  isAuthenticated: boolean;
  sessionExpiresAt: number | null;
  timeRemaining: number | null;
  showExpirationWarning: boolean;
  setAccessToken: (token: string | null) => void;
  setUserEmail: (email: string | null) => void;
  logout: () => void;
  extendSession: () => void;
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
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(() => {
    const stored = sessionStorage.getItem('session_expires_at');
    return stored ? parseInt(stored, 10) : null;
  });
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showExpirationWarning, setShowExpirationWarning] = useState(false);

  const setAccessToken = (token: string | null) => {
    setAccessTokenState(token);
    if (token) {
      sessionStorage.setItem('google_access_token', token);
      const expiresAt = Date.now() + SESSION_DURATION;
      setSessionExpiresAt(expiresAt);
      sessionStorage.setItem('session_expires_at', expiresAt.toString());
    } else {
      sessionStorage.removeItem('google_access_token');
      sessionStorage.removeItem('session_expires_at');
      setSessionExpiresAt(null);
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
    setShowExpirationWarning(false);
  };

  const extendSession = () => {
    if (accessToken) {
      const expiresAt = Date.now() + SESSION_DURATION;
      setSessionExpiresAt(expiresAt);
      sessionStorage.setItem('session_expires_at', expiresAt.toString());
      setShowExpirationWarning(false);
    }
  };

  // Update time remaining every second
  useEffect(() => {
    if (!sessionExpiresAt) {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const remaining = sessionExpiresAt - Date.now();

      if (remaining <= 0) {
        logout();
        return;
      }

      setTimeRemaining(remaining);

      // Show warning if within threshold
      if (remaining <= WARNING_THRESHOLD && !showExpirationWarning) {
        setShowExpirationWarning(true);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [sessionExpiresAt, showExpirationWarning]);

  const isAuthenticated = !!accessToken;

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        userEmail,
        isAuthenticated,
        sessionExpiresAt,
        timeRemaining,
        showExpirationWarning,
        setAccessToken,
        setUserEmail,
        logout,
        extendSession,
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
