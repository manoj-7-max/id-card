import { Camera, FileWarning } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../hooks/useToast';
import { matchPhotos } from '../services/photoService';

export default function PhotosPage() {
  const { state, dispatch } = useApp();
  const toast = useToast();

  const selectFolder = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true;
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (!files.length) return;
      const folder = files[0].webkitRelativePath.split('/')[0] || 'Selected Folder';
      const summary = matchPhotos(state.students, state.columnMapping, files);
      dispatch({ type: 'SET_PHOTO_FOLDER', payload: folder });
      dispatch({ type: 'SET_PHOTO_FILES', payload: summary.supportedFiles });
      dispatch({ type: 'SET_MATCHED_PHOTOS', payload: summary.matched });
      dispatch({ type: 'SET_MISSING_PHOTOS', payload: summary.missing });
      toast.success(`Matched ${summary.matched.size} photos.`);
    };
    input.click();
  };

  const exportMissing = () => {
    import('file-saver').then(({ saveAs }) => {
      const csv = ['RecordKey', ...state.missingPhotos.map((item) => `"${item}"`)].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      saveAs(blob, 'missing-photos.csv');
      toast.success('Missing photo report saved.');
    });
  };

  return (
    <>
      <PageHeader title="Photo Folder Import" subtitle="Match local JPG, JPEG, and PNG files named by StudentID or AdmissionNo." />
      <div className="grid-2">
        <button className="dropzone" onClick={selectFolder}>
          <span className="dropzone-icon"><Camera size={30} /></span>
          <span className="dropzone-title">Choose photo folder</span>
          <span className="dropzone-subtitle">Examples: ST001.jpg, ADM102.png, EMP-44.jpeg.</span>
        </button>
        <div className="glass-card-static panel">
          <h2>Match summary</h2>
          <div className="summary-list">
            <span>Total records <strong>{state.students.length}</strong></span>
            <span>Supported photos <strong>{state.photoFiles.length}</strong></span>
            <span>Matched photos <strong>{state.matchedPhotos.size}</strong></span>
            <span>Missing photos <strong>{state.missingPhotos.length}</strong></span>
          </div>
          <p className="muted truncate">{state.photoFolder || 'No folder selected'}</p>
        </div>
      </div>
      <div className="glass-card-static panel">
        <div className="flex justify-between items-center">
          <h2><FileWarning size={18} /> Unmatched records</h2>
          <button className="btn btn-secondary" onClick={exportMissing}>Export CSV</button>
        </div>
        <div className="chip-list">
          {state.missingPhotos.slice(0, 250).map((item) => <span className="chip warning" key={item}>{item}</span>)}
          {!state.missingPhotos.length ? <span className="muted">No missing photos after matching.</span> : null}
        </div>
      </div>
    </>
  );
}
