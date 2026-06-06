import React from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Camera,
  Palette,
  LayoutTemplate,
  Eye,
  Download,
  Search,
  BarChart3,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useTranslation } from '../../hooks/useTranslation';
import type { PageId } from '../../types';
import styles from './Sidebar.module.css';

interface NavItem {
  id: PageId;
  labelKey: string;
  icon: React.ReactNode;
  badge?: number;
  section?: string;
}

export default function Sidebar() {
  const { state, dispatch } = useApp();
  const { t } = useTranslation();

  const navItems: NavItem[] = [
    { id: 'dashboard', labelKey: 'nav.dashboard', icon: <LayoutDashboard size={20} />, section: 'main' },
    { id: 'import', labelKey: 'nav.import', icon: <FileSpreadsheet size={20} />, section: 'data', badge: state.students.length || undefined },
    { id: 'photos', labelKey: 'nav.photos', icon: <Camera size={20} />, section: 'data' },
    { id: 'designer', labelKey: 'nav.designer', icon: <Palette size={20} />, section: 'design' },
    { id: 'templates', labelKey: 'nav.templates', icon: <LayoutTemplate size={20} />, section: 'design', badge: state.templates.length || undefined },
    { id: 'preview', labelKey: 'nav.preview', icon: <Eye size={20} />, section: 'output' },
    { id: 'export', labelKey: 'nav.export', icon: <Download size={20} />, section: 'output' },
    { id: 'search', labelKey: 'nav.search', icon: <Search size={20} />, section: 'tools' },
    { id: 'reports', labelKey: 'nav.reports', icon: <BarChart3 size={20} />, section: 'tools' },
    { id: 'settings', labelKey: 'nav.settings', icon: <Settings size={20} />, section: 'tools' },
  ];

  const sectionLabels: Record<string, string> = {
    main: '',
    data: 'DATA',
    design: 'DESIGN',
    output: 'OUTPUT',
    tools: 'TOOLS',
  };

  const navigate = (pageId: PageId) => {
    dispatch({ type: 'SET_CURRENT_PAGE', payload: pageId });
  };

  const toggleSidebar = () => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  };

  let lastSection = '';

  return (
    <aside className={`${styles.sidebar} ${state.sidebarCollapsed ? styles.collapsed : ''}`}>
      {/* Logo */}
      <div className={styles.logoArea}>
        <div className={styles.logoIcon}>
          <CreditCard size={20} />
        </div>
        <div className={styles.logoText}>
          <span className={styles.logoTitle}>ID Card Gen</span>
          <span className={styles.logoSubtitle}>Pro Edition</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        {navItems.map((item) => {
          const showSection = item.section && item.section !== lastSection && item.section !== 'main';
          if (item.section) lastSection = item.section;

          return (
            <React.Fragment key={item.id}>
              {showSection && (
                <div className={styles.navSectionTitle}>
                  {sectionLabels[item.section!]}
                </div>
              )}
              <button
                className={`${styles.navItem} ${state.currentPage === item.id ? styles.active : ''}`}
                onClick={() => navigate(item.id)}
                title={state.sidebarCollapsed ? t(item.labelKey) : undefined}
              >
                <span className={styles.navItemIcon}>{item.icon}</span>
                <span className={styles.navItemLabel}>{t(item.labelKey)}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={styles.navItemBadge}>{item.badge}</span>
                )}
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={styles.footer}>
        <button className={styles.collapseBtn} onClick={toggleSidebar}>
          {state.sidebarCollapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
          <span className={styles.collapseBtnLabel}>Collapse</span>
        </button>
      </div>
    </aside>
  );
}
