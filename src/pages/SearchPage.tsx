import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import PageHeader from '../components/ui/PageHeader';
import { useApp } from '../contexts/AppContext';
import { readField } from '../utils/fields';

export default function SearchPage() {
  const { state } = useApp();
  const [query, setQuery] = useState('');
  const mapping = state.activeTemplate?.columnMapping || state.columnMapping;
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return state.students.slice(0, 200);
    return state.students.filter((record) =>
      ['Name', 'StudentID', 'AdmissionNo', 'Class', 'Department'].some((field) =>
        readField(record, mapping, field).toLowerCase().includes(q)
      )
    ).slice(0, 500);
  }, [query, state.students, mapping]);

  return (
    <>
      <PageHeader title="Search Students" subtitle="Search by name, student ID, admission number, class, or department." />
      <div className="glass-card-static panel">
        <label className="search-box"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search records..." /></label>
      </div>
      <div className="table-container">
        <table className="table">
          <thead><tr><th>Student ID</th><th>Admission No</th><th>Name</th><th>Class</th><th>Department</th><th>Photo</th></tr></thead>
          <tbody>
            {results.map((record, index) => {
              const id = readField(record, mapping, 'StudentID');
              const adm = readField(record, mapping, 'AdmissionNo');
              return (
                <tr key={`${id}-${index}`}>
                  <td>{id}</td><td>{adm}</td><td>{readField(record, mapping, 'Name')}</td><td>{readField(record, mapping, 'Class')}</td><td>{readField(record, mapping, 'Department')}</td><td>{state.matchedPhotos.has(id) || state.matchedPhotos.has(adm) ? 'Matched' : 'Missing'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
