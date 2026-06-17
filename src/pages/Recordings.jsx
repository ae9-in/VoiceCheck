import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Filter, Eye, FileText, ExternalLink,
         ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, 
         ChevronRight, X, Play, Volume2, AlertTriangle, Mic } from 'lucide-react'
import { useRecordingStore } from '../store/useRecordingStore'
import StatusBadge from '../components/ui/StatusBadge'
import SideDrawer from '../components/ui/SideDrawer'
import EmptyState from '../components/ui/EmptyState'
import PageHeader from '../components/ui/PageHeader'

export default function Recordings() {
  const navigate = useNavigate();
  const { recordings, searchQuery, setSearchQuery, filterStatus, setFilterStatus } = useRecordingStore();

  // Local Filter States
  const [candidateFilter, setCandidateFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [userFilter, setUserFilter] = useState('all');

  // Sorting States
  const [sortField, setSortField] = useState('uploadTime');
  const [sortDir, setSortDir] = useState('desc');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const ROWS_PER_PAGE = 10;

  // Drawer States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState(null);

  // Reset to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, candidateFilter, dateFrom, dateTo, userFilter]);

  // Compute user transcription counts
  const userStats = useMemo(() => {
    const stats = {};
    recordings.forEach(rec => {
      const userId = rec.uploadedBy?.id || 'admin';
      const userName = rec.uploadedBy?.name || 'VoiceCheck Administrator';
      const userEmail = rec.uploadedBy?.email || 'admin@voicecheck.com';
      
      if (!stats[userId]) {
        stats[userId] = {
          id: userId,
          name: userName,
          email: userEmail,
          count: 0
        };
      }
      stats[userId].count++;
    });
    return Object.values(stats).sort((a, b) => b.count - a.count);
  }, [recordings]);

  // Format Helper functions
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

  // Determine active filters
  const isFilterActive = useMemo(() => {
    return searchQuery !== '' || filterStatus !== 'all' || candidateFilter !== '' || dateFrom !== '' || dateTo !== '' || userFilter !== 'all';
  }, [searchQuery, filterStatus, candidateFilter, dateFrom, dateTo, userFilter]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery !== '') count++;
    if (filterStatus !== 'all') count++;
    if (candidateFilter !== '') count++;
    if (dateFrom !== '') count++;
    if (dateTo !== '') count++;
    if (userFilter !== 'all') count++;
    return count;
  }, [searchQuery, filterStatus, candidateFilter, dateFrom, dateTo, userFilter]);

  // Clear all filters
  const handleClearAllFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setCandidateFilter('');
    setDateFrom('');
    setDateTo('');
    setUserFilter('all');
  };

  // Filter and Sort recordings list
  const filteredRecordings = useMemo(() => {
    return recordings
      .filter(r => {
        const matchesSearch = searchQuery === '' || 
          r.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.recordingId.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
        
        const matchesCandidate = candidateFilter === '' || 
          r.candidateId.toLowerCase().includes(candidateFilter.toLowerCase());
        
        const matchesDateFrom = !dateFrom || 
          new Date(r.uploadTime) >= new Date(dateFrom);
        
        const matchesDateTo = !dateTo || 
          new Date(r.uploadTime) <= new Date(dateTo + 'T23:59:59');
          
        const matchesUser = userFilter === 'all' || 
          (userFilter === 'admin' && !r.uploadedBy) ||
          r.uploadedBy?.id === userFilter;
          
        return matchesSearch && matchesStatus && matchesCandidate && 
               matchesDateFrom && matchesDateTo && matchesUser;
      })
      .sort((a, b) => {
        if (!sortField) return 0;
        const aVal = a[sortField];
        const bVal = b[sortField];
        
        if (typeof aVal === 'string') {
          return sortDir === 'asc' 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        
        return sortDir === 'asc' 
          ? (aVal > bVal ? 1 : -1) 
          : (aVal < bVal ? 1 : -1);
      });
  }, [recordings, searchQuery, filterStatus, candidateFilter, dateFrom, dateTo, userFilter, sortField, sortDir]);

  // Paginated recordings
  const totalPages = Math.ceil(filteredRecordings.length / ROWS_PER_PAGE) || 1;
  const paginatedRecordings = useMemo(() => {
    return filteredRecordings.slice(
      (currentPage - 1) * ROWS_PER_PAGE, 
      currentPage * ROWS_PER_PAGE
    );
  }, [filteredRecordings, currentPage]);

  const handlePageChange = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  };

  // Sort Toggle Handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ChevronsUpDown size={12} className="text-gray-300 group-hover:text-gray-400" />;
    }
    return sortDir === 'asc' 
      ? <ChevronUp size={12} className="text-indigo-500" />
      : <ChevronDown size={12} className="text-indigo-500" />;
  };

  // Drawer action triggers
  const handleRowClick = (rec) => {
    setSelectedRecording(rec);
    setDrawerOpen(true);
  };

  // Ellipsis Pagination numbers calculator
  const getPageNumbers = () => {
    const pages = [];
    const range = 2; // Pages surrounding current
    
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - range && i <= currentPage + range)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  };

  // Waveform heights for drawer audio mockup
  const barHeights = [20, 45, 30, 60, 15, 40, 55, 35, 70, 25, 50, 65, 40, 30, 45, 20, 60, 15, 35, 55, 20, 45, 30, 60, 15, 40, 55, 35, 70, 25, 50, 65, 40, 30, 45, 20, 60, 15, 35, 55];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      
      {/* TOP BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
        <PageHeader title="Recordings" breadcrumb="Home > Recordings" />
        <button 
          onClick={() => navigate('/upload')}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-lg rounded-lg text-xs transition-all shadow-md active:scale-95 self-start sm:self-auto"
        >
          <Plus size={14} />
          Upload New
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center gap-3 shadow-xs">
        
        {/* Left Filters */}
        <div className="flex-1 flex flex-wrap items-center gap-3">
          {/* Search input */}
          <div className="relative min-w-[220px] flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or ID..."
              className="w-full bg-white border border-gray-300 rounded-lg py-2 pl-9 pr-4 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Status select filter */}
          <div className="min-w-[160px] flex-1 sm:flex-none">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="Unique">Unique</option>
              <option value="Exact Duplicate">Exact Duplicate</option>
              <option value="Near Duplicate">Near Duplicate</option>
              <option value="Repeated Content">Repeated Content</option>
              <option value="Processing">Processing</option>
            </select>
          </div>

          {/* Date range picker */}
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 flex-1 sm:flex-none">
            <input 
              type="date" 
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg py-2 px-2 text-xs outline-none" 
            />
            <span>to</span>
            <input 
              type="date" 
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg py-2 px-2 text-xs outline-none" 
            />
          </div>

          {/* Candidate ID input */}
          <div className="min-w-[160px] flex-1 sm:flex-none">
            <input 
              type="text"
              value={candidateFilter}
              onChange={(e) => setCandidateFilter(e.target.value)}
              placeholder="Filter by candidate ID..."
              className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {/* User select filter with counts */}
          <div className="min-w-[180px] flex-1 sm:flex-none">
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Transcribers</option>
              {userStats.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.count} {u.count === 1 ? 'transcription' : 'transcriptions'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Active badges */}
        {isFilterActive && (
          <div className="flex items-center gap-2 self-end lg:self-auto">
            <span className="bg-indigo-50 text-indigo-700 text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 font-bold">
              <Filter size={12} />
              {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'} active
            </span>
            <button 
              onClick={handleClearAllFilters}
              className="text-xs text-gray-500 hover:text-gray-700 font-semibold underline"
            >
              Clear all
            </button>
          </div>
        )}

      </div>

      {/* RECORDINGS TABLE CARD */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs flex flex-col">
        
        {filteredRecordings.length === 0 ? (
          // Empty State view
          <div className="min-h-[300px] flex items-center justify-center p-6 bg-white">
            {isFilterActive ? (
              <EmptyState 
                icon={Search}
                title="No recordings match your filters"
                description="Try adjusting your search criteria, altering the date ranges, or clearing the filters to see all records."
                actionText="Clear all filters"
                onAction={handleClearAllFilters}
              />
            ) : (
              <EmptyState 
                icon={Mic}
                title="No recordings yet"
                description="Upload your first audio recording to get started with compliance voice auditing."
                actionText="Upload Recording"
                onAction={() => navigate('/upload')}
              />
            )}
          </div>
        ) : (
          <>
            {/* Table count row */}
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 text-sm text-gray-500 font-medium">
              Showing {paginatedRecordings.length} of {filteredRecordings.length} recordings
            </div>

            {/* Table element */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1050px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[48px]">#</th>
                    
                    <th 
                      onClick={() => handleSort('recordingId')}
                      className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[160px] cursor-pointer select-none group"
                    >
                      <div className="flex items-center gap-1">
                        Recording ID
                        {renderSortIcon('recordingId')}
                      </div>
                    </th>

                    <th 
                      onClick={() => handleSort('candidateName')}
                      className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[180px] cursor-pointer select-none group"
                    >
                      <div className="flex items-center gap-1">
                        Candidate
                        {renderSortIcon('candidateName')}
                      </div>
                    </th>

                    <th 
                      onClick={() => handleSort('uploadTime')}
                      className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[160px] cursor-pointer select-none group"
                    >
                      <div className="flex items-center gap-1">
                        Upload Date
                        {renderSortIcon('uploadTime')}
                      </div>
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[150px]">
                      Transcribed By
                    </th>

                    <th 
                      onClick={() => handleSort('duration')}
                      className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[100px] cursor-pointer select-none group"
                    >
                      <div className="flex items-center gap-1">
                        Duration
                        {renderSortIcon('duration')}
                      </div>
                    </th>

                    <th 
                      onClick={() => handleSort('fileSize')}
                      className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[100px] cursor-pointer select-none group"
                    >
                      <div className="flex items-center gap-1">
                        File Size
                        {renderSortIcon('fileSize')}
                      </div>
                    </th>

                    <th 
                      onClick={() => handleSort('status')}
                      className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[140px] cursor-pointer select-none group"
                    >
                      <div className="flex items-center gap-1">
                        Status
                        {renderSortIcon('status')}
                      </div>
                    </th>

                    <th 
                      onClick={() => handleSort('matchedRecordingId')}
                      className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[140px] cursor-pointer select-none group"
                    >
                      <div className="flex items-center gap-1">
                        Duplicate Match
                        {renderSortIcon('matchedRecordingId')}
                      </div>
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[80px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedRecordings.map((rec, index) => {
                    const rowNumber = (currentPage - 1) * ROWS_PER_PAGE + index + 1;
                    return (
                      <tr 
                        key={rec.recordingId}
                        onClick={() => handleRowClick(rec)}
                        className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                      >
                        <td className="px-5 py-3.5 text-xs text-gray-400 font-medium">{rowNumber}</td>
                        <td className="px-5 py-3.5 text-xs font-mono text-indigo-600 font-bold">{rec.recordingId}</td>
                        <td className="px-5 py-3.5 text-sm">
                          <div className="flex flex-col">
                            <span className="text-gray-900 font-semibold text-xs leading-normal">{rec.candidateName}</span>
                            <span className="text-gray-400 text-[10px] font-semibold mt-0.5">{rec.candidateId}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm">
                          <div className="flex flex-col text-xs font-medium text-gray-600">
                            <span className="font-semibold text-gray-700">{formatDate(rec.uploadTime)}</span>
                            <span className="text-gray-400 text-[10px] mt-0.5">{timeAgo(rec.uploadTime)}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm">
                          <div className="flex flex-col">
                            <span className="text-gray-900 font-semibold text-xs leading-normal">{rec.uploadedBy?.name || 'VoiceCheck Administrator'}</span>
                            <span className="text-gray-400 text-[10px] font-semibold mt-0.5">{rec.uploadedBy?.email || 'admin@voicecheck.com'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-700 font-semibold">{formatDuration(rec.duration)}</td>
                        <td className="px-5 py-3.5 text-sm text-gray-750 font-medium">{formatFileSize(rec.fileSize)}</td>
                        <td className="px-5 py-3.5 text-sm">
                          <StatusBadge status={rec.status} />
                        </td>
                        <td className="px-5 py-3.5 text-sm">
                          {rec.matchedRecordingId ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('/duplicates');
                              }}
                              className="font-mono text-xs text-indigo-500 hover:text-indigo-600 font-semibold hover:underline flex items-center gap-1"
                            >
                              {rec.matchedRecordingId}
                              <ExternalLink size={11} />
                            </button>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-sm">
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={() => handleRowClick(rec)}
                              className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
                              title="Quick Details"
                            >
                              <Eye size={15} />
                            </button>
                            <button 
                              onClick={() => navigate(`/transcripts/${rec.recordingId}`)}
                              className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
                              title="View full transcript"
                            >
                              <FileText size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* PAGINATION SECTION */}
            <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between">
              <span className="text-sm text-gray-500 font-semibold">
                Page {currentPage} of {totalPages}
              </span>

              {/* Page buttons */}
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
                      className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all ${
                        currentPage === page
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              {/* Prev / Next navigators */}
              <div className="flex gap-1">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-500"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-500"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}

      </div>

      {/* DETAIL SIDE DRAWER */}
      {selectedRecording && (
        <SideDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title="Recording Details"
        >
          <div className="space-y-6">
            
            {/* Section 1: Header */}
            <div className="space-y-2">
              <p className="font-mono text-indigo-700 font-semibold text-lg">{selectedRecording.recordingId}</p>
              <StatusBadge status={selectedRecording.status} />
            </div>

            {/* Section 2: Candidate Info */}
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
                        backgroundColor: isPlayed ? '#818CF8' : '#4B5563'
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
                    setDrawerOpen(false);
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
                  setDrawerOpen(false);
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
