import { useMemo } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { useDataStore } from '@/store/useDataStore';

export function useMissingPhotos() {
  const elements = useEditorStore((state) => state.elements);
  const rows = useDataStore((state) => state.rows);
  const uploadedPhotos = useDataStore((state) => state.uploadedPhotos);

  return useMemo(() => {
    const imageMappedColumns = elements
      .filter(el => el.type === 'IMAGE' && el.mappedColumn)
      .map(el => el.mappedColumn as string);

    if (imageMappedColumns.length === 0 || rows.length === 0) {
      return [];
    }

    const missing: { rowNumber: number; expectedName: string; column: string }[] = [];

    rows.forEach((row, index) => {
      imageMappedColumns.forEach(col => {
        const cellValue = row[col];
        if (cellValue) {
          const expectedName = String(cellValue).toLowerCase().trim();
          if (!uploadedPhotos[expectedName]) {
            missing.push({
              rowNumber: index + 1,
              expectedName: String(cellValue),
              column: col
            });
          }
        }
      });
    });

    return missing;
  }, [elements, rows, uploadedPhotos]);
}
