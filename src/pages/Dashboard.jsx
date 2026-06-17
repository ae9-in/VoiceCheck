import { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Upload, CheckCircle2, Copy, Clock, ArrowRight, Eye, FileText, Play, Volume2, AlertTriangle, Globe, Activity } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useRecordingStore } from '../store/useRecordingStore'
import StatusBadge from '../components/ui/StatusBadge'
import SideDrawer from '../components/ui/SideDrawer'

export default function Dashboard() {
  const navigate = useNavigate();
  const { recordings } = useRecordingStore();

  // Selected recording for detail drawer
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Active chart period (7 days vs 30 days)
  const [activePeriod, setActivePeriod] = useState('7d');

  // Helper formats
  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0.0 MB';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const timeAgo = (isoString) => {
    if (!isoString) return '';
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} mins ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(',', '');
  };

  // 1. Compute Metric Card values
  const totalUploads = recordings.length;
  const uniqueCount = recordings.filter(r => r.status === 'Unique').length;
  const duplicateCount = recordings.filter(r => r.status !== 'Unique').length;
  const totalMinutes = Math.round(recordings.reduce((sum, r) => sum + r.duration, 0) / 60);

  // 2. Compute Daily Uploads Activity Data from actual recordings
  const uploadActivityData = useMemo(() => {
    const daysCount = activePeriod === '30d' ? 30 : 7;
    return Array.from({ length: daysCount }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (daysCount - 1 - i));
      const dateStr = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      
      const matches = recordings.filter(r => {
        const rDate = new Date(r.uploadTime);
        return (
          rDate.getDate() === date.getDate() &&
          rDate.getMonth() === date.getMonth() &&
          rDate.getFullYear() === date.getFullYear()
        );
      });

      const unique = matches.filter(r => r.status === 'Unique').length;
      const duplicate = matches.length - unique;

      return {
        date: dateStr,
        total: matches.length,
        unique,
        duplicate
      };
    });
  }, [recordings, activePeriod]);

  // 3. Compute Pie Data
  const statusData = useMemo(() => {
    const exactCount = recordings.filter(r => r.status === 'Exact Duplicate').length;
    const nearCount = recordings.filter(r => r.status === 'Near Duplicate').length;
    const repeatedCount = recordings.filter(r => r.status === 'Repeated Content').length;
    
    return [
      { name: 'Unique', value: uniqueCount, color: '#10B981' },
      { name: 'Exact Duplicate', value: exactCount, color: '#EF4444' },
      { name: 'Near Duplicate', value: nearCount, color: '#F59E0B' },
      { name: 'Repeated Content', value: repeatedCount, color: '#F97316' },
    ].filter(entry => entry.value > 0);
  }, [recordings, uniqueCount]);

  // 4. Recent 8 Uploads
  const recentRecordings = useMemo(() => {
    return [...recordings]
      .sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime))
      .slice(0, 8);
  }, [recordings]);

  // 5. Top Candidates
  const topCandidates = useMemo(() => {
    const counts = {};
    recordings.forEach(r => {
      counts[r.candidateName] = (counts[r.candidateName] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [recordings]);

  // 6. Quick Stats variables
  const avgDurationText = useMemo(() => {
    if (recordings.length === 0) return '0m 00s';
    const avg = recordings.reduce((sum, r) => sum + r.duration, 0) / recordings.length;
    const m = Math.floor(avg / 60);
    const s = Math.round(avg % 60);
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  }, [recordings]);

  const mostActiveCandidate = topCandidates[0]?.name || 'N/A';
  
  const todaysUploads = useMemo(() => {
    const todayStr = new Date().toDateString();
    return recordings.filter(r => new Date(r.uploadTime).toDateString() === todayStr).length;
  }, [recordings]);

  const duplicateRatePercent = recordings.length > 0
    ? ((duplicateCount / recordings.length) * 100).toFixed(1) + '%'
    : '0.0%';

  // Drawer toggle handlers
  const handleOpenDrawer = (rec, e) => {
    e.stopPropagation();
    setSelectedRecording(rec);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
  };

  // Waveform heights for drawer audio mockup
  const barHeights = [20, 45, 30, 60, 15, 40, 55, 35, 70, 25, 50, 65, 40, 30, 45, 20, 60, 15, 35, 55, 20, 45, 30, 60, 15, 40, 55, 35, 70, 25, 50, 65, 40, 30, 45, 20, 60, 15, 35, 55];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* SECTION 1 — METRIC CARDS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Uploads</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">{totalUploads}</h3>
              <span className="text-xs text-gray-400 mt-0.5">recordings</span>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-indigo-50">
              <Upload size={20} className="text-indigo-600" />
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium">Unique Recordings</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">{uniqueCount}</h3>
              <span className="text-xs text-gray-400 mt-0.5">verified</span>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-50">
              <CheckCircle2 size={20} className="text-green-600" />
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium">Duplicates Found</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">{duplicateCount}</h3>
              <span className="text-xs text-gray-400 mt-0.5">flagged</span>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-50">
              <Copy size={20} className="text-red-600" />
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Minutes</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">{totalMinutes}</h3>
              <span className="text-xs text-gray-400 mt-0.5">minutes</span>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-50">
              <Clock size={20} className="text-amber-600" />
            </div>
          </div>
        </div>

      </div>

      {/* SECTION 2 — CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Chart Card 1 — Upload Activity */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Upload Activity</h3>
              <p className="text-xs text-gray-400 mt-0.5">Last 7 days</p>
            </div>
            
            {/* Visual Pill toggle */}
            <div className="flex bg-gray-100 rounded-lg p-0.5 select-none">
              <button 
                onClick={() => setActivePeriod('7d')}
                className={`text-xs font-semibold py-1 px-3 rounded-md transition-all ${
                  activePeriod === '7d' 
                    ? 'bg-white text-gray-900 shadow-xs' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                7 days
              </button>
              <button 
                onClick={() => setActivePeriod('30d')}
                className={`text-xs font-semibold py-1 px-3 rounded-md transition-all ${
                  activePeriod === '30d' 
                    ? 'bg-white text-gray-900 shadow-xs' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                30 days
              </button>
            </div>
          </div>

          <div className="w-full">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={uploadActivityData} barSize={14} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={24} />
                <Tooltip 
                  contentStyle={{ 
                    background: '#fff', border: '1px solid #E5E7EB', 
                    borderRadius: '8px', fontSize: '12px' 
                  }} 
                  cursor={{ fill: '#F9FAFB' }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                <Bar dataKey="unique" name="Unique" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="duplicate" name="Duplicate" fill="#FCA5A5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart Card 2 — Donut Status Chart */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900">Recording Status</h3>
            <p className="text-xs text-gray-400 mt-0.5">All time breakdown</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie 
                    data={statusData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={50} 
                    outerRadius={75}
                    paddingAngle={3} 
                    dataKey="value"
                  >
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: '#fff', border: '1px solid #E5E7EB',
                      borderRadius: '8px', fontSize: '12px' 
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Absolute label in donut center */}
              <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-gray-900">{totalUploads}</span>
                <span className="text-[10px] text-gray-400 uppercase font-semibold">recordings</span>
              </div>
            </div>

            {/* Legend checklist */}
            <div className="flex-shrink-0 space-y-2 w-full sm:w-auto">
              {statusData.map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between gap-8 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-gray-600 font-medium">{entry.name}</span>
                  </div>
                  <div className="text-right font-semibold text-gray-900">
                    <span>{entry.value}</span>
                    <span className="text-[10px] text-gray-400 ml-1">
                      {totalUploads > 0 ? ((entry.value / totalUploads) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* SECTION 3 — RECENT UPLOADS TABLE */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Recent Uploads</h3>
          <Link 
            to="/recordings" 
            className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-semibold transition-colors"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {recentRecordings.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400">
              No voice recordings uploaded yet.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 bg-gray-50">Recording ID</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 bg-gray-50">Candidate</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 bg-gray-50">Upload Time</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 bg-gray-50">Transcribed By</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 bg-gray-50">Duration</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 bg-gray-50">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 bg-gray-50">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentRecordings.map((rec) => (
                  <tr 
                    key={rec.recordingId}
                    onClick={(e) => handleOpenDrawer(rec, e)}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5 text-sm font-mono text-indigo-600 font-semibold text-xs">
                      {rec.recordingId}
                    </td>
                    <td className="px-5 py-3.5 text-sm">
                      <div className="flex flex-col">
                        <span className="text-gray-900 font-semibold text-xs leading-normal">{rec.candidateName}</span>
                        <span className="text-gray-400 text-[10px] font-semibold mt-0.5">{rec.candidateId}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-700">{formatDate(rec.uploadTime)}</span>
                        <span className="text-[10px] text-gray-400 mt-0.5 font-medium">{timeAgo(rec.uploadTime)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm">
                      <div className="flex flex-col">
                        <span className="text-gray-900 font-semibold text-xs leading-normal">{rec.uploadedBy?.name || 'VoiceCheck Administrator'}</span>
                        <span className="text-gray-400 text-[10px] font-semibold mt-0.5">{rec.uploadedBy?.email || 'admin@voicecheck.com'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-700 font-medium">
                      {formatDuration(rec.duration)}
                    </td>
                    <td className="px-5 py-3.5 text-sm">
                      <StatusBadge status={rec.status} />
                    </td>
                    <td className="px-5 py-3.5 text-sm">
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={(e) => handleOpenDrawer(rec, e)}
                          className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
                          title="Open Drawer Detail"
                        >
                          <Eye size={15} />
                        </button>
                        <button 
                          onClick={() => navigate(`/transcripts/${rec.recordingId}`)}
                          className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
                          title="View Transcript"
                        >
                          <FileText size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* SECTION 4 — BOTTOM ROW (Candidate Summary Strip) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Top Candidates Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Top Candidates</h3>
          <div className="divide-y divide-gray-50">
            {topCandidates.length === 0 ? (
              <div className="py-4 text-center text-xs text-gray-400">No candidates available.</div>
            ) : (
              topCandidates.map((cand, idx) => {
                const initials = cand.name.split(' ').map(n => n[0]).join('');
                return (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center justify-center">
                        {initials}
                      </div>
                      <span className="text-xs font-semibold text-gray-700 ml-2.5">{cand.name}</span>
                    </div>
                    <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
                      {cand.count} {cand.count === 1 ? 'upload' : 'uploads'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Stats Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Stats</h3>
          <div className="space-y-3 pt-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Avg. recording duration</span>
              <span className="font-semibold text-gray-900">{avgDurationText}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Most active candidate</span>
              <span className="font-semibold text-gray-900">{mostActiveCandidate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Most common language</span>
              <span className="font-semibold text-gray-900">English</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Today's uploads</span>
              <span className="font-semibold text-gray-900">{todaysUploads}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Duplicate rate</span>
              <span className="font-semibold text-gray-900">{duplicateRatePercent}</span>
            </div>
          </div>
        </div>

      </div>

      {/* DETAILED RECORDING DRAWER */}
      {selectedRecording && (
        <SideDrawer
          isOpen={drawerOpen}
          onClose={handleCloseDrawer}
          title="Recording Details"
        >
          <div className="space-y-6">
            
            {/* Section 1: Header Info */}
            <div className="space-y-2">
              <p className="font-mono text-indigo-700 font-semibold text-lg">{selectedRecording.recordingId}</p>
              <StatusBadge status={selectedRecording.status} />
            </div>

            {/* Section 2: Candidate Card */}
            <div className="bg-gray-50 border border-gray-150 rounded-xl p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center justify-center">
                  {selectedRecording.candidateName.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="ml-2.5">
                  <p className="text-sm font-semibold text-gray-900 leading-none">{selectedRecording.candidateName}</p>
                  <p className="text-xs font-semibold text-primary mt-1 font-mono">{selectedRecording.candidateId}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200/60 text-xs leading-relaxed">
                <div>
                  <span className="text-gray-400 font-medium block">Upload Time</span>
                  <span className="text-gray-800 font-semibold mt-0.5 block">{formatDate(selectedRecording.uploadTime)}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Language</span>
                  <span className="text-gray-800 font-semibold mt-0.5 block">{selectedRecording.language}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Duration</span>
                  <span className="text-gray-800 font-semibold mt-0.5 block">{formatDuration(selectedRecording.duration)}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">File Size</span>
                  <span className="text-gray-800 font-semibold mt-0.5 block">{formatFileSize(selectedRecording.fileSize)}</span>
                </div>
              </div>
            </div>

            {/* Section 3: Audio Player Mockup */}
            <div className="bg-gray-900 rounded-xl p-4">
              <div className="h-10 flex items-end justify-between gap-[2px] w-full px-1">
                {barHeights.map((h, idx) => {
                  const isPlayed = idx < 24; // 60% played
                  return (
                    <div 
                      key={idx}
                      className={`flex-1 rounded-full`}
                      style={{ 
                        height: `${h}%`,
                        backgroundColor: isPlayed ? '#818CF8' : '#4B5563' // bg-indigo-400 vs bg-gray-600
                      }}
                    />
                  );
                })}
              </div>

              <div className="flex justify-between items-center mt-4 text-xs">
                <button className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white hover:bg-indigo-700 transition-colors">
                  <Play size={14} fill="currentColor" className="ml-0.5" />
                </button>
                <span className="text-gray-400 font-mono">
                  {formatDuration(Math.round(selectedRecording.duration * 0.6))} / {formatDuration(selectedRecording.duration)}
                </span>
                <Volume2 size={14} className="text-gray-500" />
              </div>
            </div>

            {/* Section 4: Duplicate Warning Box */}
            {selectedRecording.status !== 'Unique' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-1.5 text-amber-800 font-semibold text-sm">
                  <AlertTriangle size={16} className="text-amber-500" />
                  <span>Duplicate Detected</span>
                </div>
                <p className="text-amber-700 text-xs mt-1">Matched with: <span className="font-semibold">{selectedRecording.matchedRecordingId}</span></p>
                
                <div className="flex gap-2 mt-2">
                  <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-[10px] font-bold">
                    Similarity: {selectedRecording.similarityScore ? (selectedRecording.similarityScore * 100).toFixed(1) : 0}%
                  </span>
                  <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                    Type: {selectedRecording.duplicateType}
                  </span>
                </div>

                <button
                  onClick={() => {
                    handleCloseDrawer();
                    navigate('/duplicates');
                  }}
                  className="text-indigo-600 font-semibold text-xs mt-3 block hover:underline"
                >
                  View Duplicate Details →
                </button>
              </div>
            )}

            {/* Section 5: Transcript Preview */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Transcript Preview</label>
              <p className="text-xs text-gray-700 italic leading-relaxed">
                "{selectedRecording.transcriptText ? selectedRecording.transcriptText.slice(0, 150) : 'No transcript preview available'}..."
              </p>
              
              <button 
                onClick={() => {
                  handleCloseDrawer();
                  navigate(`/transcripts/${selectedRecording.recordingId}`);
                }}
                className="w-full text-center py-2.5 mt-2 border border-indigo-600 text-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-50 transition-colors"
              >
                View Full Transcript →
              </button>
            </div>

            {/* Section 6: Metadata Table */}
            <div className="border-t border-gray-150 pt-2 text-xs">
              <div className="flex justify-between py-2.5 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Recording ID</span>
                <span className="text-gray-900 font-bold font-mono">{selectedRecording.recordingId}</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-gray-50">
                <span className="text-gray-500 font-medium">File Hash</span>
                <span className="text-gray-400 font-semibold font-mono" title={selectedRecording.fileHash}>
                  {selectedRecording.fileHash ? selectedRecording.fileHash.slice(0, 16) : ''}...
                </span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Audio Fingerprint</span>
                <span className="text-gray-400 font-semibold font-mono" title={selectedRecording.audioFingerprint}>
                  {selectedRecording.audioFingerprint ? selectedRecording.audioFingerprint.slice(0, 16) : ''}...
                </span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Processed At</span>
                <span className="text-gray-900 font-semibold">{formatDate(selectedRecording.transcriptProcessedAt)}</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Transcribed By</span>
                <span className="text-gray-905 font-semibold">{selectedRecording.uploadedBy?.name || 'VoiceCheck Administrator'}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-gray-500 font-medium">Confidence Score</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{Math.round(selectedRecording.confidenceScore * 100)}%</span>
                  <div className="w-16 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: `${selectedRecording.confidenceScore * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </SideDrawer>
      )}

    </div>
  );
}
