"use client";

import React, { useRef, useState } from 'react';
import { useDataStore } from '@/store/useDataStore';
import { parseExcelFile } from '@/utils/excelParser';
import { X, Upload, FileSpreadsheet, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ImportModal() {
  const { isImportModalOpen, setImportModalOpen, columns, rows, fileName, setImportData, clearData } = useDataStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  if (!isImportModalOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const { columns, rows } = await parseExcelFile(file);
        setImportData(columns, rows, file.name);
        setCurrentPage(1);
      } catch (err) {
        console.error("Failed to parse file", err);
        alert("Failed to parse file. Please ensure it is a valid Excel or CSV file.");
      }
    }
  };

  const totalPages = Math.ceil(rows.length / rowsPerPage);
  const paginatedRows = rows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="text-green-600" />
            Import Data
          </h2>
          <button onClick={() => setImportModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-auto flex flex-col gap-6">
          
          {/* Upload Section */}
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-8 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
            <Upload size={32} className="text-gray-400 mb-3" />
            <p className="font-medium text-gray-700">Click to upload or drag and drop</p>
            <p className="text-sm text-gray-500 mt-1">Supports .xls, .xlsx, .csv</p>
          </div>

          {/* Data Preview */}
          {rows.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center bg-blue-50 text-blue-800 p-4 rounded-lg">
                <span className="font-medium">File: {fileName}</span>
                <span className="text-sm">Detected {columns.length} columns and {rows.length} rows. Ready for mapping.</span>
                <button onClick={clearData} className="text-sm text-red-600 font-semibold hover:underline">Clear Data</button>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-x-auto shadow-sm">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 w-16 text-center">#</th>
                      {columns.map(col => (
                        <th key={col} className="px-6 py-3">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map((row, index) => (
                      <tr key={index} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-6 py-3 text-center text-gray-400">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                        {columns.map(col => (
                          <td key={col} className="px-6 py-3 text-gray-700 truncate max-w-[200px]" title={String(row[col] ?? '')}>{String(row[col] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <span className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, rows.length)} of {rows.length} rows
                </span>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center text-gray-600"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center text-gray-600"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
