import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TestList } from './components/TestList';
import { CalendarView } from './components/CalendarView';
import { KanbanView } from './components/KanbanView';
import { ArchiveView } from './components/ArchiveView';
import { NewClassModal } from './components/NewClassModal';
import { NewTestModal } from './components/NewTestModal';
import { TestDetailModal } from './components/TestDetailModal';
import { ClassDetailModal } from './components/ClassDetailModal';
import { ImportModal } from './components/ImportModal';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewClassModal, setShowNewClassModal] = useState(false);
  const [showNewTestModal, setShowNewTestModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleTestClick = (testId: string) => {
    setSelectedTestId(testId);
  };

  const handleClassClick = (classId: string) => {
    setSelectedClassId(classId);
  };

  const handleCloseTestDetail = () => {
    setSelectedTestId(null);
    handleRefresh();
  };

  const handleCloseClassDetail = () => {
    setSelectedClassId(null);
    handleRefresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <>
      <Layout
        currentView={currentView}
        onViewChange={setCurrentView}
        onNewClass={() => setShowNewClassModal(true)}
        onNewTest={() => setShowNewTestModal(true)}
        onImport={() => setShowImportModal(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      >
        {currentView === 'dashboard' && <Dashboard key={refreshKey} onTestClick={handleTestClick} onClassClick={handleClassClick} />}
        {currentView === 'tests' && <TestList key={refreshKey} searchQuery={searchQuery} onTestClick={handleTestClick} />}
        {currentView === 'calendar' && <CalendarView key={refreshKey} onTestClick={handleTestClick} />}
        {currentView === 'kanban' && <KanbanView key={refreshKey} onTestClick={handleTestClick} />}
        {currentView === 'archive' && <ArchiveView key={refreshKey} />}
      </Layout>

      <NewClassModal
        isOpen={showNewClassModal}
        onClose={() => setShowNewClassModal(false)}
        onSuccess={handleRefresh}
      />

      <NewTestModal
        isOpen={showNewTestModal}
        onClose={() => setShowNewTestModal(false)}
        onSuccess={handleRefresh}
      />

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={handleRefresh}
      />

      <TestDetailModal
        testId={selectedTestId}
        isOpen={selectedTestId !== null}
        onClose={handleCloseTestDetail}
        onRefresh={handleRefresh}
      />

      <ClassDetailModal
        classId={selectedClassId}
        isOpen={selectedClassId !== null}
        onClose={handleCloseClassDetail}
        onRefresh={handleRefresh}
      />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
