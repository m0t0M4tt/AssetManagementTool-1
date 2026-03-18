import { useState } from 'react';
import Sidebar, { PageType } from './components/Sidebar';
import Dashboard from './components/Dashboard';
import UserDirectory from './components/UserDirectory';
import Devices from './components/Devices';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');

  function renderPage() {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'directory':
        return <UserDirectory />;
      case 'devices':
        return <Devices />;
      default:
        return <Dashboard />;
    }
  }

  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="flex-1 overflow-y-auto p-8">{renderPage()}</main>
    </div>
  );
}

export default App;
