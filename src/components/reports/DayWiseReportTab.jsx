import React, { useState, useMemo, useEffect } from 'react';
import { 
  Upload, Calendar, TrendingUp, Activity, Users, 
  ChevronLeft, ChevronRight 
} from 'lucide-react';
import { 
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer 
} from 'recharts';
import ReportMetricCard from './ReportMetricCard';

export default function DayWiseReportTab({ dayWiseData = [] }) {
  const [lineType, setLineType] = useState('area');
  const [showHighlight, setShowHighlight] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const ROWS_PER_PAGE = 14;

  // Reset page when dataset updates
  useEffect(() => {
    setCurrentPage(1);
  }, [dayWiseData]);

  // Compute metrics from dayWiseData
  const metrics = useMemo(() => {
    if (!dayWiseData || dayWiseData.length === 0) {
      return {
        dateRangeLabel: '—',
        totalUploads: 0,
        peakDay: null,
        avgPerDay: '0.0',
        totalUnique: 0,
        totalExact: 0,
        totalNear: 0,
        totalRepeated: 0,
        totalMinutes: 0
      };
    }

    const totalUploads = dayWiseData.reduce((s, d) => s + d.totalUploads, 0);
    const totalUnique = dayWiseData.reduce((s, d) => s + d.unique, 0);
    const totalExact = dayWiseData.reduce((s, d) => s + d.exactDuplicate, 0);
    const totalNear = dayWiseData.reduce((s, d) => s + d.nearDuplicate, 0);
    const totalRepeated = dayWiseData.reduce((s, d) => s + d.repeatedContent, 0);
    const totalMinutes = dayWiseData.reduce((s, d) => s + d.totalMinutes, 0);

    const sortedByUploads = [...dayWiseData].sort((a, b) => b.totalUploads - a.totalUploads);
    const peakDay = sortedByUploads[0];

    const avgPerDay = (totalUploads / dayWiseData.length).toFixed(1);

    const start = dayWiseData[0].date;
    const end = dayWiseData[dayWiseData.length - 1].date;
    const dateRangeLabel = `${start} - ${end}`;

    return {
      dateRangeLabel,
      totalUploads,
      peakDay,
      avgPerDay,
      totalUnique,
      totalExact,
      totalNear,
      totalRepeated,
      totalMinutes
    };
  }, [dayWiseData]);

  // Max uploads in dataset to scale the mini progress bar
  const maxUploads = useMemo(() => {
    if (!dayWiseData || dayWiseData.length === 0) return 1;
    return Math.max(...dayWiseData.map(d => d.totalUploads)) || 1;
  }, [dayWiseData]);

  // Pagination
  const totalPages = Math.ceil(dayWiseData.length / ROWS_PER_PAGE) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return dayWiseData.slice(start, start + ROWS_PER_PAGE);
  }, [dayWiseData, currentPage]);

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

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ReportMetricCard
          title="Date Range"
          value={dayWiseData.length + ' days'}
          icon={Calendar}
          color="indigo"
          sublabel={metrics.dateRangeLabel}
        />
        <ReportMetricCard
          title="Total Uploads"
          value={metrics.totalUploads}
          icon={Upload}
          color="blue"
          sublabel="in selected period"
        />
        <ReportMetricCard
          title="Peak Day"
          value={metrics.peakDay?.totalUploads || 0}
          icon={TrendingUp}
          color="green"
          sublabel={metrics.peakDay?.date || '—'}
        />
        <ReportMetricCard
          title="Avg per Day"
          value={metrics.avgPerDay}
          icon={Activity}
          color="amber"
          sublabel="uploads/day"
        />
      </div>

      {/* Chart Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Daily Upload Trend</h3>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">Total uploads vs unique recordings over time</p>
          </div>
          <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5 border border-gray-200/50">
            {['line', 'area', 'bar'].map((type) => (
              <button
                key={type}
                onClick={() => setLineType(type)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all capitalize ${
                  lineType === type
                    ? 'bg-white text-gray-800 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div style={{ height: 280 }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            {lineType === 'area' ? (
              <AreaChart data={dayWiseData} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorUnique" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 600 }}
                  axisLine={false} 
                  tickLine={false}
                  interval="preserveStartEnd"
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
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'
                  }} 
                />
                <Legend 
                  iconType="circle" 
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', paddingTop: '12px', fontWeight: 550 }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="totalUploads" 
                  name="Total" 
                  stroke="#4F46E5" 
                  strokeWidth={2}
                  fill="url(#colorTotal)" 
                  dot={false}
                  activeDot={{ r: 4 }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="unique"
                  name="Unique" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  fill="url(#colorUnique)" 
                  dot={false}
                  activeDot={{ r: 4 }} 
                />
              </AreaChart>
            ) : lineType === 'line' ? (
              <LineChart data={dayWiseData} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 600 }}
                  axisLine={false} 
                  tickLine={false}
                  interval="preserveStartEnd"
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
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'
                  }} 
                />
                <Legend 
                  iconType="circle" 
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', paddingTop: '12px', fontWeight: 550 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="totalUploads" 
                  name="Total" 
                  stroke="#4F46E5" 
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="unique"
                  name="Unique" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }} 
                />
              </LineChart>
            ) : (
              <BarChart data={dayWiseData} barSize={12} barGap={1} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 600 }}
                  axisLine={false} 
                  tickLine={false}
                  interval="preserveStartEnd"
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
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'
                  }} 
                />
                <Legend 
                  iconType="circle" 
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', paddingTop: '12px', fontWeight: 550 }} 
                />
                <Bar dataKey="unique" name="Unique" fill="#4F46E5" radius={[3, 3, 0, 0]} />
                <Bar dataKey="duplicates" name="Duplicates" fill="#FCA5A5" radius={[3, 3, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs flex flex-col">
        {/* Table Controls */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/50">
          <span className="text-sm text-gray-550 font-bold">
            Showing {dayWiseData.length} days
          </span>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-600 font-semibold">Highlight high-duplicate days</span>
            <button
              onClick={() => setShowHighlight(!showHighlight)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                showHighlight ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showHighlight ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Table Markup */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3 text-left whitespace-nowrap">Date</th>
                <th className="text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3 text-left whitespace-nowrap">Total Uploads</th>
                <th className="text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3 text-left whitespace-nowrap">Unique</th>
                <th className="text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3 text-left whitespace-nowrap">Exact Dup</th>
                <th className="text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3 text-left whitespace-nowrap">Near Dup</th>
                <th className="text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3 text-left whitespace-nowrap">Repeated</th>
                <th className="text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3 text-left whitespace-nowrap">Total Minutes</th>
                <th className="text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3 text-left whitespace-nowrap">Dup Rate</th>
                <th className="text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3 text-left whitespace-nowrap">Candidates</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedData.map((d) => {
                const weekday = new Date(d.rawDate).toLocaleDateString('en-GB', { weekday: 'long' });
                const widthPercent = (d.totalUploads / maxUploads) * 100;
                
                // Determine highlight style
                let rowBgStyle = 'hover:bg-gray-50';
                if (showHighlight) {
                  if (d.duplicateRate > 20) {
                    rowBgStyle = 'bg-red-50 hover:bg-red-100/70 text-red-900 border-red-100/80';
                  } else if (d.duplicateRate > 10) {
                    rowBgStyle = 'bg-amber-50 hover:bg-amber-100/70 text-amber-900 border-amber-105';
                  }
                }

                return (
                  <tr 
                    key={d.date} 
                    className={`transition-colors border-b border-gray-50 last:border-0 ${rowBgStyle}`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900">{d.date}</span>
                        <span className="text-xs text-gray-400 font-semibold">{weekday}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 font-mono">{d.totalUploads}</span>
                        <div className="w-full max-w-[60px] h-1 bg-gray-100 rounded-full mt-1 border border-gray-250/20 overflow-hidden">
                          <div 
                            className="bg-indigo-400 h-full rounded-full" 
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-green-600 font-bold font-mono">
                      {d.unique}
                    </td>
                    <td className="px-5 py-3.5">
                      {d.exactDuplicate > 0 ? (
                        <span className="text-sm text-red-600 font-bold font-mono">{d.exactDuplicate}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {d.nearDuplicate > 0 ? (
                        <span className="text-sm text-amber-600 font-bold font-mono">{d.nearDuplicate}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {d.repeatedContent > 0 ? (
                        <span className="text-sm text-orange-600 font-bold font-mono">{d.repeatedContent}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-700 font-semibold font-mono">
                      {d.totalMinutes.toFixed(1)} min
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getDupRateBadgeColor(d.duplicateRate)}`}>
                        {d.duplicateRate}%
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-650 font-semibold">
                      <div className="flex items-center gap-1">
                        <Users size={12} className="text-gray-400" />
                        <span>{d.candidateCount} active</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Totals Footer */}
            {dayWiseData.length > 0 && (
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr className="font-bold text-gray-900 text-sm">
                  <td className="px-5 py-3.5 uppercase font-bold text-xs tracking-wider text-gray-500">TOTAL</td>
                  <td className="px-5 py-3.5 font-mono">{metrics.totalUploads}</td>
                  <td className="px-5 py-3.5 text-green-600 font-mono">{metrics.totalUnique}</td>
                  <td className="px-5 py-3.5 text-red-500 font-mono">
                    {metrics.totalExact > 0 ? metrics.totalExact : '0'}
                  </td>
                  <td className="px-5 py-3.5 text-amber-600 font-mono">
                    {metrics.totalNear > 0 ? metrics.totalNear : '0'}
                  </td>
                  <td className="px-5 py-3.5 text-orange-600 font-mono">
                    {metrics.totalRepeated > 0 ? metrics.totalRepeated : '0'}
                  </td>
                  <td className="px-5 py-3.5 font-mono">{metrics.totalMinutes.toFixed(1)} min</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getDupRateBadgeColor(parseFloat(((metrics.totalUploads - metrics.totalUnique) / metrics.totalUploads * 100).toFixed(1) || 0))}`}>
                      {metrics.totalUploads > 0 ? (((metrics.totalUploads - metrics.totalUnique) / metrics.totalUploads * 100).toFixed(1)) : '0.0'}%
                    </span>
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
    </div>
  );
}
