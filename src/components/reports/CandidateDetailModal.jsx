import React from 'react';
import { X } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import StatusBadge from '../ui/StatusBadge';
import { formatDuration, formatDateTime } from '../../utils/formatters';

export default function CandidateDetailModal({ isOpen, onClose, candidate }) {
  if (!isOpen || !candidate) return null;

  // Pie chart categories (filtered to positive counts)
  const pieData = [
    { name: 'Unique', value: candidate.unique, color: '#4F46E5' },
    { name: 'Exact Dup', value: candidate.exactDuplicate, color: '#EF4444' },
    { name: 'Near Dup', value: candidate.nearDuplicate, color: '#F59E0B' },
    { name: 'Repeated', value: candidate.repeatedContent, color: '#F97316' },
  ].filter(d => d.value > 0);

  const initials = candidate.candidateName
    ? candidate.candidateName.split(' ').map(n => n[0]).join('').toUpperCase()
    : '??';

  const getDupRateBadgeColor = (rate) => {
    if (rate === 0) return 'bg-green-50 text-green-700 border-green-200';
    if (rate <= 20) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  const exportCandidateJSON = () => {
    const jsonString = JSON.stringify(candidate, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voicecheck-candidate-${candidate.candidateId}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full font-bold flex items-center justify-center text-sm shadow-xs">
              {initials}
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">{candidate.candidateName}</h3>
              <p className="text-xs text-gray-400 font-mono font-semibold">{candidate.candidateId}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full border border-indigo-100">
                {candidate.totalUploads} uploads
              </span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getDupRateBadgeColor(candidate.duplicateRate)}`}>
                {candidate.duplicateRate}% dup rate
              </span>
            </div>
            <button 
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-150 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center shadow-2xs">
              <div className="text-lg font-bold text-gray-900">{candidate.totalUploads}</div>
              <div className="text-[10px] text-gray-400 uppercase font-bold mt-0.5">Total Uploads</div>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center shadow-2xs">
              <div className="text-lg font-bold text-green-600">{candidate.unique}</div>
              <div className="text-[10px] text-gray-400 uppercase font-bold mt-0.5">Unique</div>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center shadow-2xs">
              <div className="text-lg font-bold text-red-500">
                {candidate.totalUploads - candidate.unique}
              </div>
              <div className="text-[10px] text-gray-400 uppercase font-bold mt-0.5">Duplicates</div>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center shadow-2xs">
              <div className="text-lg font-bold text-gray-700">{candidate.totalMinutes}m</div>
              <div className="text-[10px] text-gray-400 uppercase font-bold mt-0.5">Total Min</div>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center shadow-2xs">
              <div className="text-lg font-bold text-green-600">{candidate.uniqueMinutes}m</div>
              <div className="text-[10px] text-gray-400 uppercase font-bold mt-0.5">Unique Min</div>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center shadow-2xs">
              <div className="text-lg font-bold text-red-500">{candidate.duplicateMinutes}m</div>
              <div className="text-[10px] text-gray-400 uppercase font-bold mt-0.5">Dup Min</div>
            </div>
          </div>

          {/* Donut & Legend */}
          <div className="bg-gray-50/50 border border-gray-150 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-around gap-4">
            <div className="relative w-40 h-40 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold text-gray-900">{candidate.duplicateRate}%</span>
                <span className="text-[10px] text-gray-400 uppercase font-bold">dup rate</span>
              </div>
            </div>

            <div className="space-y-2 w-full max-w-[200px]">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Breakdown</h4>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-gray-650">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#4F46E5]"></span>
                    <span>Unique</span>
                  </div>
                  <span className="font-bold font-mono">{candidate.unique}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-650">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></span>
                    <span>Exact Duplicate</span>
                  </div>
                  <span className="font-bold font-mono">{candidate.exactDuplicate}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-650">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>
                    <span>Near Duplicate</span>
                  </div>
                  <span className="font-bold font-mono">{candidate.nearDuplicate}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-650">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]"></span>
                    <span>Repeated Content</span>
                  </div>
                  <span className="font-bold font-mono">{candidate.repeatedContent}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recordings list */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-3">
              Recordings ({candidate.recordings.length})
            </h4>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {candidate.recordings.map((rec) => (
                <div 
                  key={rec.recordingId}
                  className="flex items-center justify-between bg-gray-50 border border-gray-100 hover:border-gray-200 rounded-lg px-4 py-2.5 transition-all shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-indigo-650 font-bold">{rec.recordingId}</span>
                    <StatusBadge status={rec.status} />
                  </div>
                  <div className="text-xs text-gray-500 font-semibold">
                    {formatDuration(rec.duration)}
                  </div>
                  <div className="text-xs text-gray-400 font-medium font-mono">
                    {formatDateTime(rec.uploadTime)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-600 font-semibold">
            Avg confidence: <span className="text-gray-900 font-bold">{(candidate.avgConfidence * 100).toFixed(0)}%</span>
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 hover:bg-gray-100 text-gray-750 font-semibold text-sm rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={exportCandidateJSON}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg transition-colors shadow-xs active:scale-95"
            >
              Export Candidate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
