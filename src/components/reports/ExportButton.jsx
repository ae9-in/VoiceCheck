import React, { useState, useEffect, useRef } from 'react';
import { Download, FileSpreadsheet, FileJson, Printer } from 'lucide-react';

export default function ExportButton({ activeTab, candidateData = [], dayWiseData = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const exportCSV = () => {
    const data = activeTab === 'candidate' ? candidateData : dayWiseData;
    
    const headers = activeTab === 'candidate'
      ? [
          'Candidate ID',
          'Candidate Name',
          'Total Uploads',
          'Unique',
          'Exact Duplicate',
          'Near Duplicate',
          'Repeated Content',
          'Total Minutes',
          'Duplicate Rate %',
          'Avg Confidence %'
        ]
      : [
          'Date',
          'Total Uploads',
          'Unique',
          'Exact Duplicate',
          'Near Duplicate',
          'Repeated Content',
          'Total Minutes',
          'Duplicate Rate %',
          'Active Candidates'
        ];
    
    const rows = activeTab === 'candidate'
      ? data.map(c => [
          c.candidateId,
          c.candidateName,
          c.totalUploads,
          c.unique,
          c.exactDuplicate,
          c.nearDuplicate,
          c.repeatedContent,
          c.totalMinutes,
          c.duplicateRate,
          (c.avgConfidence * 100).toFixed(0)
        ])
      : data.map(d => [
          d.date,
          d.totalUploads,
          d.unique,
          d.exactDuplicate,
          d.nearDuplicate,
          d.repeatedContent,
          d.totalMinutes,
          d.duplicateRate,
          d.candidateCount
        ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voicecheck-${activeTab}-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  const exportJSON = () => {
    const data = activeTab === 'candidate' ? candidateData : dayWiseData;
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voicecheck-${activeTab}-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  const printReport = () => {
    window.print();
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white border border-gray-200 text-gray-750 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 font-semibold transition-colors shadow-xs"
      >
        <Download size={15} className="text-gray-500" />
        <span>Export</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-2 w-52 animate-in fade-in slide-in-from-top-2 duration-150">
          <button
            onClick={exportCSV}
            className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer text-left font-medium transition-colors"
          >
            <FileSpreadsheet size={14} className="mr-2.5 text-emerald-600" />
            <span>Export as CSV</span>
          </button>
          <button
            onClick={exportJSON}
            className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer text-left font-medium transition-colors"
          >
            <FileJson size={14} className="mr-2.5 text-indigo-600" />
            <span>Export as JSON</span>
          </button>
          <button
            onClick={printReport}
            className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer text-left font-medium transition-colors"
          >
            <Printer size={14} className="mr-2.5 text-gray-655" />
            <span>Print Report</span>
          </button>
        </div>
      )}
    </div>
  );
}
