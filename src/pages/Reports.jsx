import React, { useState, useMemo } from 'react';
import { Filter, RefreshCw, Users, CalendarDays } from 'lucide-react';
import { useRecordingStore } from '../store/useRecordingStore';
import PageHeader from '../components/ui/PageHeader';
import CandidateReportTab from '../components/reports/CandidateReportTab';
import DayWiseReportTab from '../components/reports/DayWiseReportTab';
import ExportButton from '../components/reports/ExportButton';

export default function Reports() {
  const { recordings } = useRecordingStore();
  const [activeTab, setActiveTab] = useState('candidate');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeRange, setActiveRange] = useState('all');
  const [appliedRange, setAppliedRange] = useState({ from: '', to: '' });

  // Quick range selection handler
  const handleQuickRange = (range) => {
    setActiveRange(range);
    const today = new Date();
    const fmt = (d) => d.toISOString().split('T')[0];
    
    let fromVal = '';
    let toVal = '';
    
    if (range === 'today') {
      fromVal = fmt(today);
      toVal = fmt(today);
    } else if (range === '7days') {
      const from = new Date(today);
      from.setDate(from.getDate() - 6);
      fromVal = fmt(from);
      toVal = fmt(today);
    } else if (range === '30days') {
      const from = new Date(today);
      from.setDate(from.getDate() - 29);
      fromVal = fmt(from);
      toVal = fmt(today);
    } else {
      // 'all' clears the fields
      fromVal = '';
      toVal = '';
    }

    setDateFrom(fromVal);
    setDateTo(toVal);
    setAppliedRange({ from: fromVal, to: toVal });
  };

  // Date filtering helper
  const filterByDate = (recs, from, to) => {
    return recs.filter(r => {
      const t = new Date(r.uploadTime);
      const fromOk = !from || t >= new Date(from);
      const toOk = !to || t <= new Date(to + 'T23:59:59');
      return fromOk && toOk;
    });
  };

  // Candidate-wise aggregation
  const candidateData = useMemo(() => {
    const filtered = filterByDate(recordings, appliedRange.from, appliedRange.to);
    const grouped = {};

    filtered.forEach(r => {
      if (!grouped[r.candidateId]) {
        grouped[r.candidateId] = {
          candidateId: r.candidateId,
          candidateName: r.candidateName,
          totalUploads: 0,
          unique: 0,
          exactDuplicate: 0,
          nearDuplicate: 0,
          repeatedContent: 0,
          totalDuration: 0,
          uniqueDuration: 0,
          duplicateDuration: 0,
          avgConfidence: 0,
          confidenceScores: [],
          languages: {},
          recordings: []
        };
      }
      const c = grouped[r.candidateId];
      c.totalUploads++;
      c.totalDuration += r.duration;
      c.recordings.push(r);
      c.confidenceScores.push(r.confidenceScore);

      if (r.status === 'Unique') {
        c.unique++;
        c.uniqueDuration += r.duration;
      } else {
        c.duplicateDuration += r.duration
        if (r.duplicateType === 'exact') c.exactDuplicate++;
        else if (r.duplicateType === 'near') c.nearDuplicate++;
        else if (r.duplicateType === 'repeated') c.repeatedContent++;
      }
      c.languages[r.language] = (c.languages[r.language] || 0) + 1;
    });

    return Object.values(grouped).map(c => ({
      ...c,
      avgConfidence: c.confidenceScores.length
        ? (c.confidenceScores.reduce((a, b) => a + b, 0) /
           c.confidenceScores.length)
        : 0,
      totalMinutes: +(c.totalDuration / 60).toFixed(1),
      uniqueMinutes: +(c.uniqueDuration / 60).toFixed(1),
      duplicateMinutes: +(c.duplicateDuration / 60).toFixed(1),
      duplicateRate: c.totalUploads > 0
        ? +((c.totalUploads - c.unique) / c.totalUploads * 100).toFixed(1)
        : 0
    })).sort((a, b) => b.totalUploads - a.totalUploads);
  }, [recordings, appliedRange]);

  // Day-wise aggregation
  const dayWiseData = useMemo(() => {
    const filtered = filterByDate(recordings, appliedRange.from, appliedRange.to);
    const grouped = {};

    filtered.forEach(r => {
      const day = new Date(r.uploadTime)
        .toLocaleDateString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric'
        });
      if (!grouped[day]) {
        grouped[day] = {
          date: day,
          rawDate: new Date(r.uploadTime).toISOString().split('T')[0],
          totalUploads: 0,
          unique: 0,
          exactDuplicate: 0,
          nearDuplicate: 0,
          repeatedContent: 0,
          totalDuration: 0,
          candidates: new Set()
        };
      }
      const d = grouped[day];
      d.totalUploads++;
      d.totalDuration += r.duration;
      d.candidates.add(r.candidateId);
      if (r.status === 'Unique') d.unique++;
      else {
        if (r.duplicateType === 'exact') d.exactDuplicate++;
        else if (r.duplicateType === 'near') d.nearDuplicate++;
        else if (r.duplicateType === 'repeated') d.repeatedContent++;
      }
    });

    return Object.values(grouped)
      .map(d => ({
        ...d,
        candidateCount: d.candidates.size,
        totalMinutes: +(d.totalDuration / 60).toFixed(1),
        duplicates: d.exactDuplicate + d.nearDuplicate + d.repeatedContent,
        duplicateRate: d.totalUploads > 0
          ? +((d.totalUploads - d.unique) / d.totalUploads * 100).toFixed(1)
          : 0
      }))
      .sort((a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime());
  }, [recordings, appliedRange]);

  const handleApply = () => {
    setAppliedRange({ from: dateFrom, to: dateTo });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <PageHeader title="Reports" breadcrumb="Home > Reports" />

      {/* SECTION 1 — PAGE CONTROLS BAR */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap items-end gap-4 shadow-2xs">
        {/* Date fields */}
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">From</label>
            <input 
              type="date"
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setActiveRange(''); }}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-gray-750" 
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">To</label>
            <input 
              type="date"
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setActiveRange(''); }}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-gray-750" 
            />
          </div>
          <button
            onClick={handleApply}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all active:scale-95 shadow-xs"
          >
            <Filter size={14} />
            <span>Apply</span>
          </button>
        </div>

        {/* Quick range pills */}
        <div className="flex items-center gap-2 ml-0 sm:ml-2 flex-wrap">
          {[
            { id: 'today', label: 'Today' },
            { id: '7days', label: '7 days' },
            { id: '30days', label: '30 days' },
            { id: 'all', label: 'All time' }
          ].map(pill => (
            <button
              key={pill.id}
              onClick={() => handleQuickRange(pill.id)}
              className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition-all ${
                activeRange === pill.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        <div className="hidden md:block w-px h-8 bg-gray-200 mx-2 self-center"></div>

        {/* Right side controls */}
        <div className="ml-auto flex items-center gap-4 self-center sm:self-auto w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center text-xs text-gray-400 font-medium select-none">
            <RefreshCw size={12} className="text-gray-400 animate-spin-slow mr-1.5" />
            <span>Updated just now</span>
          </div>
          <ExportButton 
            activeTab={activeTab} 
            candidateData={candidateData} 
            dayWiseData={dayWiseData} 
          />
        </div>
      </div>

      {/* SECTION 2 — TAB NAVIGATION */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit border border-gray-200/40">
        <button
          onClick={() => setActiveTab('candidate')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'candidate'
              ? 'bg-white text-indigo-700 shadow-xs border border-gray-200/20'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users size={15} />
          <span>Candidate-wise</span>
        </button>
        <button
          onClick={() => setActiveTab('day')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'day'
              ? 'bg-white text-indigo-700 shadow-xs border border-gray-200/20'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <CalendarDays size={15} />
          <span>Day-wise</span>
        </button>
      </div>

      {/* SECTION 3 — TAB CONTENT */}
      <div className="transition-all duration-300">
        {activeTab === 'candidate' ? (
          <CandidateReportTab candidateData={candidateData} />
        ) : (
          <DayWiseReportTab dayWiseData={dayWiseData} />
        )}
      </div>
    </div>
  );
}
