import { FolderOpen, Save } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../hooks/useToast';
import type { AppSettings } from '../types';

export default function SettingsPage() {
  const { state, dispatch } = useApp();
  const toast = useToast();

  const patch = (next: Partial<AppSettings>) => {
    dispatch({ type: 'SET_SETTINGS', payload: { ...state.settings, ...next } });
  };

  const save = () => {
    localStorage.setItem('settings', JSON.stringify(state.settings));
    toast.success('Settings saved locally.');
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Local preferences, default export behavior, theme, language, and auto-save." actions={<button className="btn btn-primary" onClick={save}><Save size={16} /> Save Settings</button>} />
      <div className="grid-2">
        <div className="glass-card-static panel">
          <h2>Export defaults</h2>
          <label className="input-group"><span className="input-label">Default export folder</span><div className="inline-input"><input className="input" value={state.settings.defaultExportFolder} onChange={(event) => patch({ defaultExportFolder: event.target.value })} /></div></label>
          <label className="input-group"><span className="input-label">PDF layout</span><select className="select" value={state.settings.pdfLayout} onChange={(event) => patch({ pdfLayout: event.target.value as AppSettings['pdfLayout'] })}><option value="single">Single card per page</option><option value="a4-2">A4 2 cards</option><option value="a4-3">A4 3 cards</option><option value="a4-6">A4 6 cards</option><option value="a4-8">A4 8 cards</option></select></label>
          <label className="input-group"><span className="input-label">Export DPI</span><input className="input" type="number" value={state.settings.exportDpi} onChange={(event) => patch({ exportDpi: Number(event.target.value) })} /></label>
        </div>
        <div className="glass-card-static panel">
          <h2>Application</h2>
          <label className="input-group"><span className="input-label">Theme</span><select className="select" value={state.settings.theme} onChange={(event) => patch({ theme: event.target.value as AppSettings['theme'] })}><option value="dark">Dark</option><option value="light">Light</option></select></label>
          <label className="input-group"><span className="input-label">Language</span><select className="select" value={state.settings.language} onChange={(event) => patch({ language: event.target.value as AppSettings['language'] })}><option value="en">English</option><option value="ta">Tamil</option></select></label>
          <label className="toggle-line"><input type="checkbox" checked={state.settings.autoSave} onChange={(event) => patch({ autoSave: event.target.checked })} /> Auto-save templates and settings</label>
          <label className="input-group"><span className="input-label">Auto-save interval minutes</span><input className="input" type="number" value={state.settings.autoSaveInterval} onChange={(event) => patch({ autoSaveInterval: Number(event.target.value) })} /></label>
        </div>
      </div>
    </>
  );
}
