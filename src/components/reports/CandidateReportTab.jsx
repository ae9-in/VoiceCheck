import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Eye, BarChart2, Star, Users, 
  Upload, CheckCircle2, Copy, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import ReportMetricCard from './ReportMetricCard';
import CandidateDetailModal from './CandidateDetailModal';
import StatusBadge from '../ui/StatusBadge';
import { formatDuration } from '../../utils/formatters';

export default function CandidateReportTab({ candidateData = [] }) {
  // States
  const [chartType, setChartType] = useState('bar');
  const [tableSearch, setTableSearch] = useState('');
  const [sortMode, setSortMode] = useState('Most Uploads');
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCandidate, setModalCandidate] = useState(null);

  const ROWS_PER_PAGE = 8;

  // Reset page on search or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [tableSearch, sortMode]);

  // Aggregate stats across filtered candidate period
  const totals = useMemo(() => {
    const totalCandidates = candidateData.length;
    const totalUploads = candidateData.reduce((s, c) => s + c.totalUploads, 0);
    const totalUnique = candidateData.reduce((s, c) => s + c.unique, 0);
    const totalDuplicates = totalUploads - totalUnique;
    const totalMinutes = candidateData.reduce((s, c) => s + c.totalMinutes, 0);
    const totalUniqueMinutes = candidateData.reduce((s, c) => s + c.uniqueMinutes, 0);
    const totalDupMinutes = candidateData.reduce((s, c) => s + c.duplicateMinutes, 0);
    
    // exact, near, repeated sums for table footer
    const totalExact = candidateData.reduce((s, c) => s + c.exactDuplicate, 0);
    const totalNear = candidateData.reduce((s, c) => s + c.nearDuplicate, 0);
    const totalRepeated = candidateData.reduce((s, c) => s + c.repeatedContent, 0);

    const avgDuplicateRate = candidateData.length
      ? +(candidateData.reduce((s, c) => s + c.duplicateRate, 0) / candidateData.length).toFixed(1)
      : 0;

    const avgConfidenceSum = candidateData.reduce((s, c) => s + c.avgConfidence, 0);
    const avgConfidence = candidateData.length
      ? avgConfidenceSum / candidateData.length
      : 0;

    return {
      totalCandidates,
      totalUploads,
      totalUnique,
      totalDuplicates,
      totalMinutes,
      totalUniqueMinutes,
      totalDupMinutes,
      totalExact,
      totalNear,
      totalRepeated,
      avgDuplicateRate,
      avgConfidence
    };
  }, [candidateData]);

  // Transform names for chart labels
  const chartData = useMemo(() => {
    return candidateData.map(c => ({
      ...c,
      shortName: c.candidateName ? c.candidateName.split(' ')[0] : 'Unknown'
    }));
  }, [candidateData]);

  // Filter and Sort Table Data
  const processedTableData = useMemo(() => {
    return candidateData
      .filter(c => {
        const query = tableSearch.toLowerCase();
        return (
          c.candidateName.toLowerCase().includes(query) ||
          c.candidateId.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        if (sortMode === 'Most Uploads') {
          return b.totalUploads - a.totalUploads;
        }
        if (sortMode === 'Most Duplicates') {
          const aDups = a.totalUploads - a.unique;
          const bDups = b.totalUploads - b.unique;
          // fall back to rate if duplicates count is same
          if (aDups === bDups) return b.duplicateRate - a.duplicateRate;
          return bDups - aDups;
        }
        if (sortMode === 'Alphabetical') {
          return a.candidateName.localeCompare(b.candidateName);
        }
        if (sortMode === 'Least Unique') {
          return a.unique - b.unique;
        }
        return 0;
      });
  }, [candidateData, tableSearch, sortMode]);

  // Pagination calculations
  const totalPages = Math.ceil(processedTableData.length / ROWS_PER_PAGE) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return processedTableData.slice(start, start + ROWS_PER_PAGE);
  }, [processedTableData, currentPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const range = 2;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - range && i <= currentPage + range)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  };

  const getDupRateBadgeColor = (rate) => {
    if (rate === 0) return 'bg-green-100 text-green-700';
    if (rate <= 20) return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  };

  const scrollToChart = () => {
    const chartCard = document.getElementById('candidate-chart-card');
    if (chartCard) {
      chartCard.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const openCandidateModal = (cand) => {
    setModalCandidate(cand);
    setModalOpen(true);
  };

  const uniquePercent = totals.totalUploads > 0
    ? ((totals.totalUnique / totals.totalUploads) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ReportMetricCard
          title="Total Candidates"
          value={totals.totalCandidates}
          icon={Users}
          color="indigo"
          sublabel="active in period"
        />
        <ReportMetricCard
          title="Total Uploads"
          value={totals.totalUploads}
          icon={Upload}
          color="blue"
          sublabel="recordings"
        />
        <ReportMetricCard
          title="Unique Recordings"
          value={totals.totalUnique}
          icon={CheckCircle2}
          color="green"
          sublabel={`${uniquePercent}% of total`}
        />
        <ReportMetricCard
          title="Avg Duplicate Rate"
          value={`${totals.avgDuplicateRate}%`}
          icon={Copy}
          color="red"
          sublabel="per candidate"
        />
      </div>

      {/* Chart */}
      <div id="candidate-chart-card" className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Uploads by Candidate</h3>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">Unique vs duplicate breakdown</p>
          </div>
          <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5 border border-gray-200/50">
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                chartType === 'bar'
                  ? 'bg-white text-gray-800 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Bar
            </button>
            <button
              onClick={() => setChartType('horizontal')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                chartType === 'horizontal'
                  ? 'bg-white text-gray-800 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Horizontal
            </button>
          </div>
        </div>

        <div style={{ height: 280 }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart
                data={chartData}
                barSize={16}
                barGap={2}
                margin={{ top: 5, right: 10, bottom: 20, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis 
                  dataKey="shortName" 
                  tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#9CA3AF', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  width={24}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: '#fff', 
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px', 
                    fontSize: '12px', 
                    padding: '8px 12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'
                  }} 
                />
                <Legend 
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', paddingTop: '12px', fontWeight: 500 }}
                />
                <Bar 
                  dataKey="unique" 
                  name="Unique" 
                  fill="#4F46E5" 
                  radius={[4, 4, 0, 0]} 
                />
                <Bar 
                  dataKey="exactDuplicate" 
                  name="Exact Dup" 
                  fill="#EF4444" 
                  radius={[4, 4, 0, 0]} 
                  stackId="dup" 
                />
                <Bar 
                  dataKey="nearDuplicate" 
                  name="Near Dup" 
                  fill="#F59E0B" 
                  radius={[0, 0, 0, 0]} 
                  stackId="dup" 
                />
                <Bar 
                  dataKey="repeatedContent" 
                  name="Repeated" 
                  fill="#F97316" 
                  radius={[4, 4, 0, 0]} 
                  stackId="dup" 
                />
              </BarChart>
            ) : (
              <BarChart
                data={chartData}
                layout="vertical"
                barSize={14}
                margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                <XAxis 
                  type="number"
                  tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  type="category" 
                  dataKey="shortName" 
                  tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 600 }} 
                  width={55}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: '#fff', 
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px', 
                    fontSize: '12px', 
                    padding: '8px 12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'
                  }} 
                />
                <Legend 
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', paddingTop: '12px', fontWeight: 500 }}
                />
                <Bar 
                  dataKey="unique" 
                  name="Unique" 
                  fill="#4F46E5" 
                  radius={[0, 4, 4, 0]} 
                />
                <Bar 
                  dataKey="exactDuplicate" 
                  name="Exact Dup" 
                  fill="#EF4444" 
                  radius={[0, 4, 4, 0]} 
                  stackId="dup" 
                />
                <Bar 
                  dataKey="nearDuplicate" 
                  name="Near Dup" 
                  fill="#F59E0B" 
                  radius={[0, 0, 0, 0]} 
                  stackId="dup" 
                />
                <Bar 
                  dataKey="repeatedContent" 
                  name="Repeated" 
                  fill="#F97316" 
                  radius={[0, 4, 4, 0]} 
                  stackId="dup" 
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs flex flex-col">
        {/* Table Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50/50">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Search candidates..."
              className="w-full bg-white border border-gray-300 rounded-lg py-2 pl-9 pr-4 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Sort by</span>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg py-1.5 px-3 text-xs font-bold text-gray-750 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="Most Uploads">Most Uploads</option>
              <option value="Most Duplicates">Most Duplicates</option>
              <option value="Alphabetical">Alphabetical</option>
              <option value="Least Unique">Least Unique</option>
            </select>
          </div>
        </div>

        {/* Table Markup */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3 text-left whitespace-nowrap">Candidate</th>
                <th className="text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3 text-left whitespace-nowrap">Total Uploads</th>
                <th className="text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3 text-left whitespace-nowrap">Unique</th>
                <th className="text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3 text-left whitespace-nowrap">Duplicates</th>
                <th className="text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3 text-left whitespace-nowrap">Minutes Spoken</th>
                <th className="text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3 text-left whitespace-nowrap">Dup Rate</th>
                <th className="text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3 text-left whitespace-nowrap">Avg Confidence</th>
                <th className="text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3 text-left whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-55">
              {paginatedData.map((cand) => {
                const dupCount = cand.totalUploads - cand.unique;
                const uniqueRatio = cand.totalUploads > 0 ? (cand.unique / cand.totalUploads) * 100 : 0;
                
                const initials = cand.candidateName
                  ? cand.candidateName.split(' ').map(n => n[0]).join('').toUpperCase()
                  : '??';

                return (
                  <tr 
                    key={cand.candidateId} 
                    className="hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center justify-center border border-indigo-100 shadow-2xs">
                          {initials}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{cand.candidateName}</div>
                          <div className="text-xs text-gray-400 font-mono font-semibold">{cand.candidateId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-gray-905">
                      {cand.totalUploads}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-green-600 font-mono">{cand.unique}</span>
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200/40">
                          <div 
                            className="bg-green-500 h-full rounded-full" 
                            style={{ width: `${uniqueRatio}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {dupCount > 0 ? (
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-red-655 font-mono">{dupCount}</span>
                          <span className="text-[10px] text-gray-400 font-semibold tracking-wide">
                            E:{cand.exactDuplicate} N:{cand.nearDuplicate} R:{cand.repeatedContent}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col text-sm text-gray-700">
                        <span className="font-semibold">{cand.totalMinutes} min total</span>
                        <span className="text-xs text-gray-400 font-medium">{cand.uniqueMinutes} min unique</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getDupRateBadgeColor(cand.duplicateRate)}`}>
                        {cand.duplicateRate}%
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center">
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star 
                              key={idx} 
                              size={12} 
                              className={idx < Math.round(cand.avgConfidence * 5) ? "text-amber-400 fill-amber-400" : "text-gray-200"} 
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500 font-semibold ml-1.5">
                          {(cand.avgConfidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openCandidateModal(cand)}
                          className="p-1.5 rounded-lg hover:bg-gray-150 text-gray-400 hover:text-gray-600 transition-colors shadow-2xs"
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={scrollToChart}
                          className="p-1.5 rounded-lg hover:bg-gray-150 text-gray-400 hover:text-gray-600 transition-colors shadow-2xs"
                          title="Focus Chart"
                        >
                          <BarChart2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Totals Footer */}
            {processedTableData.length > 0 && (
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr className="font-bold text-gray-900 text-sm">
                  <td className="px-5 py-3.5 uppercase font-bold text-xs tracking-wider text-gray-500">TOTAL</td>
                  <td className="px-5 py-3.5 font-mono">{totals.totalUploads}</td>
                  <td className="px-5 py-3.5 text-green-600 font-mono">{totals.totalUnique}</td>
                  <td className="px-5 py-3.5 text-red-500 font-mono">
                    {totals.totalDuplicates > 0 ? (
                      <div className="flex flex-col">
                        <span>{totals.totalDuplicates}</span>
                        <span className="text-[10px] text-gray-400 font-semibold tracking-wide">
                          E:{totals.totalExact} N:{totals.totalNear} R:{totals.totalRepeated}
                        </span>
                      </div>
                    ) : (
                      '0'
                    )}
                  </td>
                  <td className="px-5 py-3.5 font-mono">{totals.totalMinutes.toFixed(1)} min</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getDupRateBadgeColor(parseFloat(((totals.totalDuplicates / totals.totalUploads) * 100).toFixed(1) || 0))}`}>
                      {totals.totalUploads > 0 ? (((totals.totalDuplicates / totals.totalUploads) * 100).toFixed(1)) : '0.0'}%
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono">
                    {(totals.avgConfidence * 100).toFixed(0)}%
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between bg-white">
            <span className="text-xs text-gray-550 font-bold">
              Showing Page {currentPage} of {totalPages}
            </span>

            {/* Numbers */}
            <div className="flex items-center gap-1">
              {getPageNumbers().map((page, idx) => {
                if (page === '...') {
                  return (
                    <span key={`el-${idx}`} className="px-2 py-1 text-gray-400 text-sm select-none">
                      ...
                    </span>
                  );
                }
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                      currentPage === page
                        ? 'bg-indigo-600 text-white font-bold shadow-xs'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            {/* Navigators */}
            <div className="flex gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-500 transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-500 transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <CandidateDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        candidate={modalCandidate}
      />
    </div>
  );
}
