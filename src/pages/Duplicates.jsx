import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecordingStore } from '../store/useRecordingStore';
import PageHeader from '../components/ui/PageHeader';
import StatusBadge from '../components/ui/StatusBadge';
import SideDrawer from '../components/ui/SideDrawer';
import ToastNotification from '../components/ui/ToastNotification';
import EmptyState from '../components/ui/EmptyState';
import { Copy, Sparkles, Trash2, Check, RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react';

export default function Duplicates() {
  const navigate = useNavigate();
  const { recordings, deleteRecording } = useRecordingStore();
  
  // Local UI States
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [isToastOpen, setIsToastOpen] = useState(false);

  // Filter only duplicates
  const duplicateRecordings = recordings.filter(
    rec => rec.status !== 'Unique' && rec.status !== 'Processing'
  );

  // Summary Metrics
  const exactCount = duplicateRecordings.filter(r => r.duplicateType === 'exact').length;
  const nearCount = duplicateRecordings.filter(r => r.duplicateType === 'near').length;
  const repeatedCount = duplicateRecordings.filter(r => r.duplicateType === 'repeated').length;

  const showToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setIsToastOpen(true);
  };

  const handleResolveAsUnique = (recordingId, e) => {
    e.stopPropagation();
    // In our local store mock state, let's update the recording in-place
    const rec = recordings.find(r => r.recordingId === recordingId);
    if (rec) {
      rec.status = 'Unique';
      rec.duplicateType = null;
      rec.matchedRecordingId = null;
      rec.similarityScore = null;
      showToast(`Resolved ${recordingId} as a Unique recording.`);
    }
  };

  const handleDeleteDuplicate = (recordingId, e) => {
    e.stopPropagation();
    deleteRecording(recordingId);
    showToast(`Deleted duplicate recording ${recordingId} from database.`, 'error');
  };

  const handleCompare = (rec, e) => {
    e.stopPropagation();
    const matchedRec = recordings.find(r => r.recordingId === rec.matchedRecordingId);
    setSelectedMatch({
      duplicate: rec,
      original: matchedRec || {
        recordingId: rec.matchedRecordingId,
        candidateName: 'Unknown Original',
        candidateId: 'N/A',
        uploadTime: new Date().toISOString(),
        duration: 0,
        fileSize: 0,
        confidenceScore: 0,
        transcriptText: 'No transcript text available'
      }
    });
    setIsDrawerOpen(true);
  };

  const getPercentageColor = (score) => {
    if (score >= 0.98) return 'text-red-600 bg-red-50 border-red-200';
    if (score >= 0.93) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-orange-600 bg-orange-50 border-orange-200';
  };

  return (
    <div className="space-y-lg animate-in fade-in duration-300">
      
      {/* Toast Notification */}
      <ToastNotification 
        message={toastMessage} 
        type={toastType} 
        isOpen={isToastOpen} 
        onClose={() => setIsToastOpen(false)} 
      />

      {/* Page Header */}
      <PageHeader 
        title="Duplicates Audit" 
        subtitle="Resolve exact audio duplicates, near recordings, or repeated content."
      />

      {/* Metrics Bar */}
      <div className="grid grid-cols-3 gap-md bg-surface-container-low/30 border border-outline-variant rounded-xl p-md shadow-xs">
        <div className="text-center">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Exact matches</p>
          <p className="font-display text-2xl font-bold text-red-600 mt-1">{exactCount}</p>
        </div>
        <div className="text-center border-x border-outline-variant">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Near duplicates</p>
          <p className="font-display text-2xl font-bold text-amber-600 mt-1">{nearCount}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Repeated content</p>
          <p className="font-display text-2xl font-bold text-orange-600 mt-1">{repeatedCount}</p>
        </div>
      </div>

      {/* Duplicates Listing */}
      {duplicateRecordings.length === 0 ? (
        <EmptyState 
          icon={Copy}
          title="All Clear: No Duplicates Detected"
          description="Your system voice catalog does not contain any duplicate or conflicting audio files. Excellent job!"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          {duplicateRecordings.map((rec) => {
            const originalRec = recordings.find(r => r.recordingId === rec.matchedRecordingId);
            const scorePercent = rec.similarityScore ? Math.round(rec.similarityScore * 100) : 0;
            
            return (
              <div 
                key={rec.recordingId}
                className="bg-white border border-outline-variant rounded-xl p-md flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="space-y-sm">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={rec.status} />
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getPercentageColor(rec.similarityScore)}`}>
                      {scorePercent}% Similarity
                    </span>
                  </div>

                  <div className="border-b border-outline-variant pb-md pt-1">
                    <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Conflicting File</h4>
                    <div className="flex justify-between items-center mt-1">
                      <div>
                        <p className="text-sm font-bold text-on-surface">{rec.candidateName}</p>
                        <p className="text-[11px] font-semibold text-primary">{rec.recordingId} • {rec.candidateId}</p>
                      </div>
                      <button 
                        onClick={() => navigate(`/transcripts/${rec.recordingId}`)}
                        className="text-xs text-primary font-bold hover:underline"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>

                  <div className="bg-surface-container-low/40 rounded-lg p-sm border border-outline-variant/60 flex items-center justify-between text-xs">
                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase">Conflicts With</p>
                      <p className="font-bold text-on-surface mt-0.5">
                        {originalRec ? originalRec.candidateName : 'Unknown Recording'}
                      </p>
                      <p className="text-[10px] font-semibold text-primary">
                        {rec.matchedRecordingId}
                      </p>
                    </div>
                    {originalRec && (
                      <button 
                        onClick={() => navigate(`/transcripts/${originalRec.recordingId}`)}
                        className="text-xs text-primary font-bold hover:underline"
                      >
                        Inspect
                      </button>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-lg border-t border-outline-variant/60 pt-md">
                  <button
                    onClick={(e) => handleCompare(rec, e)}
                    className="flex-1 px-3 py-2 border border-outline-variant text-on-surface hover:bg-surface-container font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw size={12} />
                    Compare Specs
                  </button>
                  <button
                    onClick={(e) => handleResolveAsUnique(rec.recordingId, e)}
                    className="px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
                    title="Mark as Unique"
                  >
                    <Check size={12} />
                    Resolve
                  </button>
                  <button
                    onClick={(e) => handleDeleteDuplicate(rec.recordingId, e)}
                    className="px-3 py-2 bg-red-50 text-red-700 hover:bg-red-100 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center"
                    title="Delete Duplicate"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Side-by-Side Comparison Drawer */}
      <SideDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Side-by-Side File Comparison"
      >
        {selectedMatch && (
          <div className="space-y-lg text-xs">
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 p-sm rounded-lg text-red-800 font-semibold">
              <AlertTriangle size={14} className="text-red-500" />
              <span>Similarity Score is {Math.round(selectedMatch.duplicate.similarityScore * 100)}%</span>
            </div>

            <div className="grid grid-cols-2 gap-sm border border-outline-variant rounded-lg overflow-hidden">
              {/* Conflicting Header */}
              <div className="bg-surface-container-low p-sm border-r border-outline-variant">
                <p className="font-bold text-[10px] uppercase text-on-surface-variant">Duplicate File</p>
                <p className="font-bold text-on-surface mt-1 text-sm">{selectedMatch.duplicate.candidateName}</p>
                <p className="font-mono text-primary font-semibold mt-0.5">{selectedMatch.duplicate.recordingId}</p>
              </div>
              {/* Original Header */}
              <div className="bg-surface-container-low p-sm">
                <p className="font-bold text-[10px] uppercase text-on-surface-variant">Matched Original</p>
                <p className="font-bold text-on-surface mt-1 text-sm">{selectedMatch.original.candidateName}</p>
                <p className="font-mono text-primary font-semibold mt-0.5">{selectedMatch.original.recordingId}</p>
              </div>

              {/* Data Rows */}
              <div className="p-sm border-t border-r border-outline-variant">
                <p className="font-semibold text-on-surface-variant">Confidence Score</p>
                <p className="font-bold text-on-surface mt-0.5">{Math.round(selectedMatch.duplicate.confidenceScore * 100)}%</p>
              </div>
              <div className="p-sm border-t border-outline-variant">
                <p className="font-semibold text-on-surface-variant">Confidence Score</p>
                <p className="font-bold text-on-surface mt-0.5">{Math.round(selectedMatch.original.confidenceScore * 100)}%</p>
              </div>

              <div className="p-sm border-t border-r border-outline-variant">
                <p className="font-semibold text-on-surface-variant">Duration</p>
                <p className="font-bold text-on-surface mt-0.5">
                  {Math.floor(selectedMatch.duplicate.duration / 60)}:{(selectedMatch.duplicate.duration % 60).toString().padStart(2, '0')}
                </p>
              </div>
              <div className="p-sm border-t border-outline-variant">
                <p className="font-semibold text-on-surface-variant">Duration</p>
                <p className="font-bold text-on-surface mt-0.5">
                  {Math.floor(selectedMatch.original.duration / 60)}:{(selectedMatch.original.duration % 60).toString().padStart(2, '0')}
                </p>
              </div>

              <div className="p-sm border-t border-r border-outline-variant">
                <p className="font-semibold text-on-surface-variant">Language</p>
                <p className="font-bold text-on-surface mt-0.5">{selectedMatch.duplicate.language}</p>
              </div>
              <div className="p-sm border-t border-outline-variant">
                <p className="font-semibold text-on-surface-variant">Language</p>
                <p className="font-bold text-on-surface mt-0.5">{selectedMatch.original.language}</p>
              </div>
            </div>

            {/* Transcript Comparison */}
            <div className="space-y-sm">
              <h4 className="font-bold text-[10px] uppercase text-on-surface-variant">Transcript Comparison</h4>
              <div className="space-y-xs">
                <div className="bg-surface-container-lowest p-sm border border-outline-variant rounded-lg">
                  <p className="font-bold text-primary mb-0.5">Duplicate Transcript Text:</p>
                  <p className="italic text-on-surface-variant leading-relaxed">"{selectedMatch.duplicate.transcriptText}"</p>
                </div>
                <div className="bg-surface-container-lowest p-sm border border-outline-variant rounded-lg">
                  <p className="font-bold text-primary mb-0.5">Original Transcript Text:</p>
                  <p className="italic text-on-surface-variant leading-relaxed">"{selectedMatch.original.transcriptText}"</p>
                </div>
              </div>
            </div>

            {/* Audio Metadata Hex values */}
            <div className="space-y-sm pt-sm border-t border-outline-variant/60">
              <h4 className="font-bold text-[10px] uppercase text-on-surface-variant">Audio Fingerprints</h4>
              <div className="font-mono text-[10px] space-y-1">
                <div>
                  <span className="font-bold">Duplicate Fingerprint:</span>
                  <p className="text-on-surface-variant break-all select-all p-1 bg-surface-container rounded-sm mt-0.5">
                    {selectedMatch.duplicate.audioFingerprint}
                  </p>
                </div>
                <div className="mt-2">
                  <span className="font-bold">Original Fingerprint:</span>
                  <p className="text-on-surface-variant break-all select-all p-1 bg-surface-container rounded-sm mt-0.5">
                    {selectedMatch.original.audioFingerprint}
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}
      </SideDrawer>

    </div>
  );
}
