import React, { useEffect } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import Sidebar from './components/layout/Sidebar';
import ToastContainer from './components/common/ToastContainer';

/* ─── Pages (lazy-loaded would be better but keep simple for Electron) ─── */
import DashboardPage from './pages/DashboardPage';
import ImportPage from './pages/ImportPage';
import PhotosPage from './pages/PhotosPage';
import DesignerPage from './pages/DesignerPage';
import TemplatesPage from './pages/TemplatesPage';
import PreviewPage from './pages/PreviewPage';
import ExportPage from './pages/ExportPage';
import SearchPage from './pages/SearchPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

import type { PageId, AppSettings } from './types';
import { ensureSampleTemplate } from './services/templateService';

/* ─── Page Router ─── */
function PageRouter() {
  const { state } = useApp();

  const pages: Record<PageId, React.ReactNode> = {
    dashboard: <DashboardPage />,
    import: <ImportPage />,
    photos: <PhotosPage />,
    designer: <DesignerPage />,
    templates: <TemplatesPage />,
    preview: <PreviewPage />,
    export: <ExportPage />,
    search: <SearchPage />,
    reports: <ReportsPage />,
    settings: <SettingsPage />,
  };

  return <>{pages[state.currentPage] ?? <DashboardPage />}</>;
}

/* ─── App Shell ─── */
function AppShell() {
  const { state, dispatch } = useApp();

  /* Load persisted settings on mount */
  useEffect(() => {
    try {
      const text = localStorage.getItem('settings');
      if (text) {
        const saved: AppSettings = JSON.parse(text);
        dispatch({ type: 'SET_SETTINGS', payload: saved });
      }
    } catch {
      // Silently use defaults
    }
  }, [dispatch]);

  /* Load persisted templates on mount */
  useEffect(() => {
    (async () => {
      try {
        const text = localStorage.getItem('templates');
        const templates = text ? JSON.parse(text) : [];
        const readyTemplates = await ensureSampleTemplate(templates);
        dispatch({ type: 'SET_TEMPLATES', payload: readyTemplates });
        dispatch({ type: 'SET_ACTIVE_TEMPLATE', payload: readyTemplates[0] });
      } catch {
        const readyTemplates = await ensureSampleTemplate([]);
        dispatch({ type: 'SET_TEMPLATES', payload: readyTemplates });
        dispatch({ type: 'SET_ACTIVE_TEMPLATE', payload: readyTemplates[0] });
      }
    })();
  }, [dispatch]);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className={`app-main ${state.sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="app-content">
          <PageRouter />
        </div>
      </main>
      <ToastContainer />
    </div>
  );
}

/* ─── Root App ─── */
export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
