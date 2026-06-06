import { FileSpreadsheet, Wand2 } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../hooks/useToast';
import { autoDetectColumnMapping, parseCsvFile, parseExcelFile } from '../services/excelService';
import { STANDARD_FIELDS } from '../types';

export default function ImportPage() {
  const { state, dispatch } = useApp();
  const toast = useToast();

  const importFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv, .xlsx, .xls';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const isCsv = file.name.toLowerCase().endsWith('.csv');
        const parsed = isCsv
          ? parseCsvFile((await file.text()) || '')
          : parseExcelFile((await file.arrayBuffer()) as ArrayBuffer);
        const mapping = autoDetectColumnMapping(parsed.columns);
        dispatch({ type: 'SET_COLUMNS', payload: parsed.columns });
        dispatch({ type: 'SET_STUDENTS', payload: parsed.records });
        dispatch({ type: 'SET_COLUMN_MAPPING', payload: mapping });
        dispatch({ type: 'UPDATE_ACTIVE_TEMPLATE', payload: { columnMapping: mapping } });
        toast.success(`Imported ${parsed.records.length} records.`);
      } catch (error) {
        toast.error(`Import failed: ${String(error)}`);
      }
    };
    input.click();
  };

  const updateMapping = (field: string, column: string) => {
    const next = { ...state.columnMapping, [field]: column };
    dispatch({ type: 'SET_COLUMN_MAPPING', payload: next });
    dispatch({ type: 'UPDATE_ACTIVE_TEMPLATE', payload: { columnMapping: next } });
  };

  return (
    <>
      <PageHeader title="Excel Import" subtitle="Read XLSX, XLS, and CSV files locally with automatic column detection." />
      <div className="grid-2">
        <button className="dropzone" onClick={importFile}>
          <span className="dropzone-icon"><FileSpreadsheet size={30} /></span>
          <span className="dropzone-title">Choose Excel or CSV file</span>
          <span className="dropzone-subtitle">Columns are mapped to placeholders like {'{{Name}}'} and {'{{StudentID}}'}.</span>
        </button>
        <div className="glass-card-static panel">
          <h2>Column mapping</h2>
          <p className="muted">Adjust mappings when your spreadsheet uses different headers.</p>
          <div className="mapping-list">
            {STANDARD_FIELDS.map((field) => (
              <label className="input-group" key={field}>
                <span className="input-label">{field}</span>
                <select className="select" value={state.columnMapping[field] || ''} onChange={(event) => updateMapping(field, event.target.value)}>
                  <option value="">Not mapped</option>
                  {state.columns.map((column) => <option key={column} value={column}>{column}</option>)}
                </select>
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="glass-card-static panel table-panel">
        <div className="flex justify-between items-center">
          <h2>Imported records</h2>
          <span className="badge badge-accent"><Wand2 size={12} /> {state.columns.length} columns</span>
        </div>
        <div className="table-container">
          <table className="table">
            <thead><tr>{state.columns.slice(0, 8).map((column) => <th key={column}>{column}</th>)}</tr></thead>
            <tbody>
              {state.students.slice(0, 100).map((student, index) => (
                <tr key={index}>{state.columns.slice(0, 8).map((column) => <td key={column}>{student[column]}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
