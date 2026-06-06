import { Download, FileArchive, FileText } from 'lucide-react';
import { useState } from 'react';
import PageHeader from '../components/ui/PageHeader';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../hooks/useToast';
import { exportImages, exportPdf, type BatchProgress } from '../services/exportService';
import type { ExportOptions } from '../types';

const defaultOptions: ExportOptions = {
  format: 'pdf',
  pdfLayout: 'a4-8',
  quality: 0.92,
  dpi: 300,
  includeFront: true,
  includeBack: true,
  outputFolder: '',
  fileNaming: 'studentId',
  zipExport: true,
};

export default function ExportPage() {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const [options, setOptions] = useState<ExportOptions>({ ...defaultOptions, pdfLayout: state.settings.pdfLayout, dpi: state.settings.exportDpi });
  const [progress, setProgress] = useState<BatchProgress | null>(null);

  const canExport = Boolean(state.activeTemplate && state.students.length);

  const runExport = async () => {
    if (!state.activeTemplate) return;
    dispatch({ type: 'SET_IS_GENERATING', payload: true });
    try {
      const report =
        options.format === 'pdf'
          ? await exportPdf(state.activeTemplate, state.students, state.matchedPhotos, options, setProgress)
          : await exportImages(state.activeTemplate, state.students, state.matchedPhotos, options, setProgress);
      dispatch({ type: 'SET_GENERATION_REPORT', payload: report });
      toast.success(`Generated ${report.generatedCards} cards.`);
    } catch (error) {
      toast.error(`Export failed: ${String(error)}`);
    } finally {
      dispatch({ type: 'SET_IS_GENERATING', payload: false });
    }
  };

  return (
    <>
      <PageHeader
        title="Generate & Export"
        subtitle="Batch process 10, 100, 1000, 5000+ records locally with PDF or image ZIP output."
        actions={<button className="btn btn-primary" disabled={!canExport || state.isGenerating} onClick={runExport}><Download size={16} /> Generate Cards</button>}
      />
      <div className="grid-2">
        <div className="glass-card-static panel">
          <h2>Export format</h2>
          <div className="option-grid">
            <button className={`option-card ${options.format === 'pdf' ? 'active' : ''}`} onClick={() => setOptions({ ...options, format: 'pdf' })}><FileText /> PDF</button>
            <button className={`option-card ${options.format === 'png' ? 'active' : ''}`} onClick={() => setOptions({ ...options, format: 'png' })}><FileArchive /> PNG ZIP</button>
            <button className={`option-card ${options.format === 'jpeg' ? 'active' : ''}`} onClick={() => setOptions({ ...options, format: 'jpeg' })}><FileArchive /> JPEG ZIP</button>
          </div>
          <label className="input-group"><span className="input-label">PDF layout</span><select className="select" value={options.pdfLayout} onChange={(e) => setOptions({ ...options, pdfLayout: e.target.value as ExportOptions['pdfLayout'] })}><option value="single">Single card per page</option><option value="a4-2">A4 - 2 cards per row</option><option value="a4-3">A4 - 3 cards per row</option><option value="a4-6">A4 - 6 cards per page</option><option value="a4-8">A4 - 8 cards per page</option></select></label>
          <label className="input-group"><span className="input-label">File naming</span><select className="select" value={options.fileNaming} onChange={(e) => setOptions({ ...options, fileNaming: e.target.value as ExportOptions['fileNaming'] })}><option value="studentId">StudentID</option><option value="admissionNo">AdmissionNo</option><option value="name">Name</option><option value="index">Index</option></select></label>
          <div className="toggle-row"><label><input type="checkbox" checked={options.includeFront} onChange={(e) => setOptions({ ...options, includeFront: e.target.checked })} /> Front Design</label><label><input type="checkbox" checked={options.includeBack} onChange={(e) => setOptions({ ...options, includeBack: e.target.checked })} /> Back Design</label></div>
        </div>
        <div className="glass-card-static panel">
          <h2>Batch progress</h2>
          <div className="summary-list">
            <span>Records <strong>{state.students.length}</strong></span>
            <span>DPI target <strong>{options.dpi}</strong></span>
            <span>Cards generated <strong>{progress?.completed || 0}</strong></span>
            <span>ETA <strong>{progress ? `${progress.estimatedSeconds}s` : '-'}</strong></span>
          </div>
          <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${progress?.percent || 0}%` }} /></div>
          {state.generationReport ? <p className="muted">{state.generationReport.generatedCards} generated, {state.generationReport.failedCards} failed.</p> : null}
        </div>
      </div>
    </>
  );
}
