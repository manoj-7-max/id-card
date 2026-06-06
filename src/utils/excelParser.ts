import * as XLSX from 'xlsx';

export const parseExcelFile = (file: File): Promise<{ columns: string[], rows: Record<string, unknown>[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Take the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
        
        if (rows.length === 0) {
          resolve({ columns: [], rows: [] });
          return;
        }

        // Extract headers from the first object
        const columns = Object.keys(rows[0]);

        resolve({ columns, rows });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);

    reader.readAsArrayBuffer(file);
  });
};
