import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

const SESSION_DURATION = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
const WARNING_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiration
const TOKEN_REFRESH_INTERVAL = 50 * 60 * 1000; // Refresh token every 50 minutes (before 1 hour expiry)

interface AuthContextType {
  accessToken: string | null;
  userEmail: string | null;
  isAuthenticated: boolean;
  sessionExpiresAt: number | null;
  timeRemaining: number | null;
  showExpirationWarning: boolean;
  setAccessToken: (token: string | null) => void;
  setRefreshToken: (token: string | null) => void;
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
  const [refreshToken, setRefreshTokenState] = useState<string | null>(() => {
    return sessionStorage.getItem('google_refresh_token');
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

  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken) return false;

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '',
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAccessTokenState(data.access_token);
        sessionStorage.setItem('google_access_token', data.access_token);
        console.log('Access token refreshed successfully');
        return true;
      } else {
        console.error('Token refresh failed');
        logout();
        return false;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      logout();
      return false;
    }
  }, [refreshToken]);

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

  const setRefreshToken = (token: string | null) => {
    setRefreshTokenState(token);
    if (token) {
      sessionStorage.setItem('google_refresh_token', token);
    } else {
      sessionStorage.removeItem('google_refresh_token');
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
    setRefreshToken(null);
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

  // Automatic token refresh
  useEffect(() => {
    if (!refreshToken || !accessToken) return;

    const refreshInterval = setInterval(() => {
      refreshAccessToken();
    }, TOKEN_REFRESH_INTERVAL);

    return () => clearInterval(refreshInterval);
  }, [refreshToken, accessToken, refreshAccessToken]);

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
        setRefreshToken,
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
