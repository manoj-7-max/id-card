import { Camera, Download, FileSpreadsheet, LayoutTemplate, Palette, Search } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import PageHeader from '../components/ui/PageHeader';
import { sampleTemplate } from '../templates/sampleTemplate';

export default function DashboardPage() {
  const { state, dispatch } = useApp();
  const completion = [
    state.students.length > 0,
    state.photoFiles.length > 0,
    Boolean(state.activeTemplate),
    Boolean(state.generationReport),
  ].filter(Boolean).length * 25;

  const actions = [
    { page: 'import', icon: <FileSpreadsheet />, title: 'Upload Excel/CSV', text: 'Import XLSX, XLS, or CSV student data.' },
    { page: 'photos', icon: <Camera />, title: 'Upload Photo Folder', text: 'Match JPG, JPEG, and PNG photos by ID.' },
    { page: 'designer', icon: <Palette />, title: 'Template Manager', text: 'Design front and back card layouts.' },
    { page: 'export', icon: <Download />, title: 'Export PDF', text: 'Create print-ready PDFs or image ZIPs.' },
    { page: 'search', icon: <Search />, title: 'Search', text: 'Find students by name, ID, class, or department.' },
    { page: 'templates', icon: <LayoutTemplate />, title: 'Sample Template', text: 'Start from a CR80 school ID card.' },
  ] as const;

  return (
    <>
      <PageHeader
        title="ID Card Generator Pro"
        subtitle="Offline bulk ID card generation for schools, offices, and staff teams."
        actions={<button className="btn btn-primary" onClick={() => dispatch({ type: 'SET_ACTIVE_TEMPLATE', payload: state.activeTemplate || sampleTemplate })}>Use Sample Template</button>}
      />
      <section className="dashboard-grid">
        <div className="stat-card"><div className="stat-card-value">{state.students.length}</div><div className="stat-card-label">Total records</div></div>
        <div className="stat-card"><div className="stat-card-value">{state.matchedPhotos.size}</div><div className="stat-card-label">Matched photos</div></div>
        <div className="stat-card"><div className="stat-card-value">{state.missingPhotos.length}</div><div className="stat-card-label">Missing photos</div></div>
        <div className="stat-card"><div className="stat-card-value">{state.generationReport?.generatedCards || 0}</div><div className="stat-card-label">Generated cards</div></div>
      </section>
      <section className="glass-card-static workflow-panel">
        <div className="flex justify-between items-center">
          <div><h2>Production workflow</h2><p className="muted">Import records, match photos, choose a template, preview, then export locally.</p></div>
          <span className="badge badge-info">{completion}% ready</span>
        </div>
        <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${completion}%` }} /></div>
      </section>
      <section className="action-grid">
        {actions.map((action) => (
          <button key={action.title} className="action-card glass-card" onClick={() => dispatch({ type: 'SET_CURRENT_PAGE', payload: action.page })}>
            <span className="action-icon">{action.icon}</span>
            <strong>{action.title}</strong>
            <span>{action.text}</span>
          </button>
        ))}
      </section>
    </>
  );
}
