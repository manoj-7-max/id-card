import { Download } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../hooks/useToast';
import { reportToCsv } from '../services/exportService';

export default function ReportsPage() {
  const { state } = useApp();
  const toast = useToast();
  const report = state.generationReport || {
    totalRecords: state.students.length,
    matchedPhotos: state.matchedPhotos.size,
    missingPhotos: state.missingPhotos.length,
    generatedCards: 0,
    failedCards: 0,
    startTime: '',
    endTime: '',
    duration: 0,
    errors: [],
  };

  const exportCsv = () => {
    import('file-saver').then(({ saveAs }) => {
      const csv = reportToCsv(report, state.missingPhotos);
      const blob = new Blob([csv], { type: 'text/csv' });
      saveAs(blob, 'id-card-report.csv');
      toast.success('Report exported.');
    });
  };

  return (
    <>
      <PageHeader title="Reports" subtitle="Local production summaries and unmatched photo reports." actions={<button className="btn btn-primary" onClick={exportCsv}><Download size={16} /> Export CSV</button>} />
      <section className="dashboard-grid">
        <div className="stat-card"><div className="stat-card-value">{report.totalRecords}</div><div className="stat-card-label">Total Students</div></div>
        <div className="stat-card"><div className="stat-card-value">{report.matchedPhotos}</div><div className="stat-card-label">Matched Photos</div></div>
        <div className="stat-card"><div className="stat-card-value">{report.missingPhotos}</div><div className="stat-card-label">Missing Photos</div></div>
        <div className="stat-card"><div className="stat-card-value">{report.generatedCards}</div><div className="stat-card-label">Generated Cards</div></div>
      </section>
      <div className="glass-card-static panel">
        <h2>Errors</h2>
        <div className="chip-list">{report.errors.length ? report.errors.map((error) => <span className="chip error" key={error}>{error}</span>) : <span className="muted">No generation errors recorded.</span>}</div>
      </div>
    </>
  );
}
