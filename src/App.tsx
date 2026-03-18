import { useState } from 'react';
import Sidebar, { PageType } from './components/Sidebar';
import Dashboard from './components/Dashboard';
import UserDirectory from './components/UserDirectory';
import UserDetail from './components/UserDetail';
import Devices from './components/Devices';
import Provisioning from './components/Provisioning';
import ImportData from './components/ImportData';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  function handleSelectUser(userId: string) {
    setSelectedUserId(userId);
  }

  function handleBackToDirectory() {
    setSelectedUserId(null);
  }

  function handleNavigate(page: PageType) {
    setCurrentPage(page);
    setSelectedUserId(null);
  }

  function renderPage() {
    if (selectedUserId) {
      return <UserDetail userId={selectedUserId} onBack={handleBackToDirectory} />;
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'directory':
        return <UserDirectory onSelectUser={handleSelectUser} />;
      case 'devices':
        return <Devices />;
      case 'provisioning':
        return <Provisioning />;
      case 'import':
        return <ImportData />;
      default:
        return <Dashboard />;
    }
  }

  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />
      <main className="flex-1 overflow-y-auto">{renderPage()}</main>
    </div>
  );
}

export default App;
