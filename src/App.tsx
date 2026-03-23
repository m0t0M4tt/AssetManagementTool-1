import { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar, { PageType } from './components/Sidebar';
import Dashboard from './components/Dashboard';
import UserDirectory from './components/UserDirectory';
import Devices from './components/Devices';
import { Login } from './components/Login';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname + window.location.search);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname + window.location.search);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (!isAuthenticated) {
    return <Login />;
  }

  const pathname = window.location.pathname;

  if (pathname === '/' || pathname === '/login') {
    window.history.replaceState({}, '', '/dashboard');
    setCurrentPath('/dashboard');
  }

  let currentPage: PageType = 'dashboard';
  if (pathname === '/dashboard') {
    currentPage = 'dashboard';
  } else if (pathname === '/directory') {
    currentPage = 'directory';
  } else if (pathname === '/devices') {
    currentPage = 'devices';
  }

  function renderPage() {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'directory':
        return <UserDirectory />;
      case 'devices':
        return <Devices key={currentPath} />;
      default:
        return <Dashboard />;
    }
  }

  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar currentPage={currentPage} onNavigate={(page) => {
        const path = page === 'dashboard' ? '/dashboard' : `/${page}`;
        window.history.pushState({}, '', path);
        setCurrentPath(path);
      }} />
      <main className="flex-1 overflow-y-auto p-8">{renderPage()}</main>
    </div>
  );
}

function App() {
  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Configuration Error</h1>
          <p className="text-slate-700">
            Missing VITE_GOOGLE_CLIENT_ID in environment variables.
          </p>
        </div>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
