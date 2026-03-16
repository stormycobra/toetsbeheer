import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Calendar,
  LayoutGrid,
  Archive,
  GraduationCap,
  Search,
  Upload,
  PlusCircle,
  Plus,
  LogOut,
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
  onNewClass: () => void;
  onNewTest: () => void;
  onImport: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function Layout({
  children,
  currentView,
  onViewChange,
  onNewClass,
  onNewTest,
  onImport,
  searchQuery,
  onSearchChange,
}: LayoutProps) {
  const { user, signOut } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tests', label: 'Toetsenlijst', icon: FileText },
    { id: 'calendar', label: 'Kalender', icon: Calendar },
    { id: 'kanban', label: 'Kanban', icon: LayoutGrid },
    { id: 'archive', label: 'Archief', icon: Archive },
  ];

  return (
    <div className="h-screen flex bg-gray-50">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="bg-sky-600 p-2 rounded-lg">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900">Toetsen</span>
          </div>
          <span className="text-xs text-gray-500 ml-11">Preview</span>
        </div>

        <nav className="flex-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition ${
                  isActive
                    ? 'bg-sky-50 text-sky-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-200">
          <div className="px-3 py-2 mb-2">
            <div className="text-xs font-medium text-gray-500 mb-1">Lokaal Gebruiker</div>
            <div className="text-sm text-gray-700 truncate">{user?.email}</div>
            <div className="text-xs text-gray-500">Lokale sessie</div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Uitloggen</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Toetsbeheer</h1>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Zoek toets, vak of klas..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none w-64"
                />
              </div>

              <button
                onClick={onImport}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                <Upload className="w-4 h-4" />
                <span>Importeer</span>
              </button>

              <button
                onClick={onNewClass}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Nieuwe Klas</span>
              </button>

              <button
                onClick={onNewTest}
                className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Nieuwe Toets</span>
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
