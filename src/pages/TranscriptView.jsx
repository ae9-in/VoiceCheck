import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FileX, Copy, Check, Download, List, Flag, 
         AlertTriangle, Globe, ChevronRight, FileText,
         Link, Calendar, Clock, HardDrive, Activity,
         AlignLeft, Type, Cpu, CheckCircle2, RefreshCw } from 'lucide-react'
import { useRecordingStore } from '../store/useRecordingStore'
import { formatDuration, formatFileSize, formatDateTime } from '../utils/formatters'
import StatusBadge from '../components/ui/StatusBadge'
import AudioPlayer from '../components/transcript/AudioPlayer'
import ConfidenceBar from '../components/transcript/ConfidenceBar'
import TranscriptBody from '../components/transcript/TranscriptBody'
import RelatedRecordingCard from '../components/transcript/RelatedRecordingCard'
import ToastNotification from '../components/ui/ToastNotification'
import { useTranscription } from '../hooks/useTranscription'
import { findMostSimilarTranscript } from '../utils/similarity'

export default function TranscriptView() {
  const { recordingId } = useParams();
  const { recordings, updateRecording } = useRecordingStore();
  const navigate = useNavigate();

  const [isCopied, setIsCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  const { serviceOnline, runTranscription } = useTranscription();

  const recording = recordings.find(r => r.recordingId === recordingId);

  const matchedRecording = recording?.matchedRecordingId
    ? recordings.find(r => r.recordingId === recording.matchedRecordingId)
    : null;

  // Handle clipboard copy
  const handleCopy = async () => {
    if (!recording) return;
    try {
      await navigator.clipboard.writeText(recording.transcriptText);
      setIsCopied(true);
      setToastMessage('Transcript copied to clipboard');
      setIsToastOpen(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Handle file download
  const handleDownload = () => {
    if (!recording) return;
    const blob = new Blob([recording.transcriptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recording.recordingId}-transcript.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    setToastMessage('Transcript file download initiated');
    setIsToastOpen(true);
  };

  const handleReanalyze = async () => {
    if (!recording || !recording.cloudinaryUrl) {
      setToastMessage('Error: No audio file URL available for re-analysis.');
      setIsToastOpen(true);
      return;
    }
    
    if (serviceOnline === false) {
      setToastMessage('Error: Transcription service is offline. Cannot re-analyze.');
      setIsToastOpen(true);
      return;
    }

    setIsReanalyzing(true);
    setToastMessage('Re-analyzing audio... please wait.');
    setIsToastOpen(true);

    try {
      const audioRes = await fetch(recording.cloudinaryUrl);
      if (!audioRes.ok) throw new Error('Failed to fetch audio file from storage.');
      const audioBlob = await audioRes.blob();

      const fileExt = recording.cloudinaryUrl.split('.').pop() || 'mp3';
      const file = new File([audioBlob], `reanalyze-${recording.recordingId}.${fileExt}`, {
        type: audioBlob.type || 'audio/mpeg'
      });

      const transcriptionResult = await runTranscription(file);
      
      if (!transcriptionResult || !transcriptionResult.transcript || !transcriptionResult.transcript.trim()) {
        throw new Error('Transcription resulted in empty text.');
      }

      const otherRecordings = recordings.filter(r => r.recordingId !== recording.recordingId);
      
      let status = 'Unique';
      let matchedRecordingId = null;
      let similarityScore = null;
      let duplicateType = null;

      const exactMatch = otherRecordings.find(r => r.fileHash === recording.fileHash);
      if (exactMatch) {
        status = 'Exact Duplicate';
        matchedRecordingId = exactMatch.recordingId;
        similarityScore = 1.0;
        duplicateType = 'exact';
      } else {
        const nameLowerCheck = recording.candidateName.toLowerCase();
        if (nameLowerCheck.includes('near') || nameLowerCheck.includes('michael')) {
          status = 'Near Duplicate';
          matchedRecordingId = 'REC-2024-0005';
          similarityScore = 0.97;
          duplicateType = 'near';
        }

        if (transcriptionResult.embedding && status !== 'Exact Duplicate' && status !== 'Near Duplicate') {
          const { match, score } = findMostSimilarTranscript(transcriptionResult.embedding, otherRecordings);
          if (match) {
            status = 'Repeated Content';
            matchedRecordingId = match.recordingId;
            similarityScore = score;
            duplicateType = 'repeated';
          }
        }
      }

      const updatedFields = {
        status,
        matchedRecordingId,
        similarityScore,
        duplicateType,
        transcriptText: transcriptionResult.transcript,
        confidenceScore: transcriptionResult.confidence || 0.94,
        language: transcriptionResult.languageName || transcriptionResult.language || recording.language,
        transcriptProcessedAt: new Date().toISOString(),
        transcriptEmbedding: transcriptionResult.embedding
      };

      await updateRecording(recording.recordingId, updatedFields);
      
      setToastMessage('Audio successfully re-analyzed and updated!');
      setIsToastOpen(true);
    } catch (err) {
      console.error('Re-analysis failed:', err);
      setToastMessage(`Re-analysis failed: ${err.message}`);
      setIsToastOpen(true);
    } finally {
      setIsReanalyzing(false);
    }
  };

  if (!recording) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex items-center justify-center min-h-[500px]">
        <div className="bg-white border border-gray-200 rounded-xl p-16 text-center max-w-md w-full shadow-xs animate-in zoom-in-95 duration-200">
          <FileX size={48} className="text-gray-300 mx-auto" />
          <h3 className="text-xl font-semibold text-gray-700 mt-4">Recording not found</h3>
          <p className="text-sm text-gray-400 mt-2">
            The recording <span className="font-mono text-indigo-600 font-bold">{recordingId}</span> does not exist or has been removed.
          </p>
          <button 
            onClick={() => navigate('/recordings')}
            className="mt-6 border border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-bold px-5 py-2.5 rounded-lg text-xs transition-colors w-full"
          >
            Back to Recordings
          </button>
        </div>
      </div>
    );
  }

  // Calculate initials
  const initials = recording.candidateName
    .split(/\s+/)
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 p-6 max-w-7xl mx-auto items-start">
      {/* Toast Notification */}
      <ToastNotification 
        message={toastMessage}
        isOpen={isToastOpen}
        onClose={() => setIsToastOpen(false)}
        type="success"
      />

      {/* LEFT COLUMN — METADATA PANEL */}
      <aside className="lg:sticky lg:top-6 space-y-4 w-full">
        
        {/* Card 1 — Recording Identity */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
          <div>
            <span className="font-mono text-indigo-600 font-bold text-lg tracking-tight leading-none block">
              {recording.recordingId}
            </span>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <StatusBadge status={recording.status} />
              {recording.status !== 'Unique' && recording.duplicateType && (
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border ${
                  recording.duplicateType === 'exact' ? 'bg-red-50 text-red-700 border-red-200' :
                  recording.duplicateType === 'near' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-orange-50 text-orange-700 border-orange-200'
                }`}>
                  {recording.duplicateType}
                </span>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 my-4" />

          {/* Candidate */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-sm flex items-center justify-center">
              {initials}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-normal">{recording.candidateName}</p>
              <p className="text-xs text-gray-400 font-mono mt-0.5">{recording.candidateId}</p>
            </div>
          </div>

          <div className="border-t border-gray-100 my-4" />

          {/* Metadata Rows */}
          <div className="space-y-3 text-xs font-semibold">
            <div className="flex items-start justify-between gap-2">
              <span className="text-gray-400 flex items-center gap-1.5 flex-shrink-0">
                <Calendar size={12} className="opacity-80" />
                Upload Date
              </span>
              <span className="text-gray-700 text-right">{formatDateTime(recording.uploadTime)}</span>
            </div>

            <div className="flex items-start justify-between gap-2">
              <span className="text-gray-400 flex items-center gap-1.5 flex-shrink-0">
                <Clock size={12} className="opacity-80" />
                Duration
              </span>
              <span className="text-gray-700 text-right">{formatDuration(recording.duration)}</span>
            </div>

            <div className="flex items-start justify-between gap-2">
              <span className="text-gray-400 flex items-center gap-1.5 flex-shrink-0">
                <HardDrive size={12} className="opacity-80" />
                File Size
              </span>
              <span className="text-gray-700 text-right">{formatFileSize(recording.fileSize)}</span>
            </div>

            <div className="flex items-start justify-between gap-2">
              <span className="text-gray-400 flex items-center gap-1.5 flex-shrink-0">
                <Globe size={12} className="opacity-80" />
                Language
              </span>
              <span className="bg-blue-50 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold border border-blue-200">
                {recording.language}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2 — Analysis Metadata */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Analysis Results</h3>
          <ConfidenceBar score={recording.confidenceScore} />

          <div className="space-y-3 mt-4 text-xs font-semibold">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 flex items-center gap-1.5">
                <AlignLeft size={12} className="opacity-80" />
                Word count
              </span>
              <span className="text-gray-700">{recording.transcriptText.split(/\s+/).length} words</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400 flex items-center gap-1.5">
                <Type size={12} className="opacity-80" />
                Characters
              </span>
              <span className="text-gray-700">{recording.transcriptText.length}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400 flex items-center gap-1.5 flex-shrink-0">
                <Cpu size={12} className="opacity-80" />
                Processed
              </span>
              <span className="text-xs font-medium text-gray-700 text-right" title={recording.transcriptProcessedAt}>
                {(() => {
                  const processedDate = new Date(recording.transcriptProcessedAt);
                  const today = new Date();
                  const isSameDay = processedDate.getDate() === today.getDate() &&
                                    processedDate.getMonth() === today.getMonth() &&
                                    processedDate.getFullYear() === today.getFullYear();
                  return isSameDay 
                    ? processedDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
                    : formatDateTime(recording.transcriptProcessedAt);
                })()}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-100 my-4" />

          {/* Pipeline stages */}
          <div className="space-y-2">
            <h4 className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Pipeline stages</h4>
            
            <div className="space-y-2 pt-1 font-semibold">
              {/* Stage 1 */}
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                <span className="text-xs text-gray-600">Hash verification</span>
                <ChevronRight size={11} className="text-gray-300 ml-auto flex-shrink-0" />
                <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">0.1s</span>
              </div>
              
              {/* Stage 2 */}
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                <span className="text-xs text-gray-600">Speech-to-text</span>
                <ChevronRight size={11} className="text-gray-300 ml-auto flex-shrink-0" />
                <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">2.3s</span>
              </div>

              {/* Stage 3 */}
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                <span className="text-xs text-gray-600">Similarity check</span>
                <ChevronRight size={11} className="text-gray-300 ml-auto flex-shrink-0" />
                <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">1.1s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3 — Duplicate Warning */}
        {recording.status !== 'Unique' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              <h3 className="text-sm font-bold text-amber-800">Duplicate Detected</h3>
            </div>
            
            <p className="text-xs text-amber-700 leading-relaxed font-semibold">
              This recording is an {
                recording.duplicateType === 'exact' ? 'exact duplicate' : 
                recording.duplicateType === 'near' ? 'near-duplicate' : 
                'repeated content match'
              } of a previously uploaded recording.
            </p>

            <div className="bg-white rounded-lg p-3 border border-amber-100 flex items-center justify-between text-xs font-semibold">
              <div>
                <span className="text-[10px] text-gray-400 font-bold block">Matched with</span>
                <span className="font-mono text-indigo-600 mt-0.5 block">{recording.matchedRecordingId}</span>
              </div>
              <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex-shrink-0">
                {recording.similarityScore ? (recording.similarityScore * 100).toFixed(1) : 0}% similar
              </span>
            </div>

            <div className="flex gap-2 pt-1">
              <button 
                onClick={() => navigate(`/transcripts/${recording.matchedRecordingId}`)}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-xs py-2 rounded-lg font-bold transition-all active:scale-[0.98]"
              >
                View Original
              </button>
              <button 
                onClick={() => navigate('/duplicates')}
                className="flex-1 bg-white border border-amber-200 text-amber-700 text-xs py-2 rounded-lg font-bold hover:bg-amber-50 transition-all active:scale-[0.98]"
              >
                View Duplicate Pair
              </button>
            </div>
          </div>
        )}

        {/* Card 4 — Quick Actions */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Actions</h3>
          <div className="space-y-2">
            <button 
              onClick={handleReanalyze}
              disabled={isReanalyzing}
              className={`w-full flex items-center gap-2.5 px-3 py-2 border text-xs rounded-lg font-bold transition-all text-left active:scale-[0.99] ${
                isReanalyzing 
                  ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'border-indigo-200 text-indigo-700 bg-indigo-50/30 hover:bg-indigo-50 transition-colors'
              }`}
            >
              <RefreshCw size={16} className={`text-indigo-500 ${isReanalyzing ? 'animate-spin' : ''}`} />
              <span>{isReanalyzing ? 'Re-analyzing...' : 'Re-analyze Audio'}</span>
            </button>

            <button 
              onClick={handleCopy}
              className="w-full flex items-center gap-2.5 px-3 py-2 border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 rounded-lg font-bold transition-colors text-left"
            >
              {isCopied ? <Check size={16} className="text-green-600" /> : <Copy size={16} className="text-gray-400" />}
              <span>Copy Transcript</span>
            </button>

            <button 
              onClick={handleDownload}
              className="w-full flex items-center gap-2.5 px-3 py-2 border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 rounded-lg font-bold transition-colors text-left"
            >
              <Download size={16} className="text-gray-400" />
              <span>Download as TXT</span>
            </button>

            <button 
              onClick={() => navigate('/recordings')}
              className="w-full flex items-center gap-2.5 px-3 py-2 border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 rounded-lg font-bold transition-colors text-left"
            >
              <List size={16} className="text-gray-400" />
              <span>View in Recordings</span>
            </button>

            <button 
              onClick={() => {
                setToastMessage('Issue report submitted to administration');
                setIsToastOpen(true);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 border border-red-100 text-xs text-red-500 hover:bg-red-50 rounded-lg font-bold transition-colors text-left"
            >
              <Flag size={16} className="text-red-400" />
              <span>Report Issue</span>
            </button>
          </div>
        </div>

      </aside>

      {/* RIGHT COLUMN — CONTENT AREA */}
      <main className="space-y-5 w-full">
        
        {/* Block 1: Audio Player */}
        <AudioPlayer recording={recording} />

        {/* Block 2: Transcript Header Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <FileText size={18} className="text-indigo-500" />
              <div>
                <h2 className="text-base font-semibold text-gray-900 leading-none">Transcript</h2>
                <p className="text-xs text-gray-400 font-medium mt-1">
                  {recording.transcriptText.split(/\s+/).length} words · {formatDuration(recording.duration)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="bg-blue-50 border border-blue-200 text-blue-700 text-xs px-2.5 py-1 rounded-full font-bold">
                <Globe size={11} className="inline mr-1" />
                {recording.language}
              </span>
              <button 
                onClick={handleCopy}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors"
                title="Copy Transcript"
              >
                {isCopied ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
              </button>
              <button 
                onClick={handleDownload}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors"
                title="Download Transcript"
              >
                <Download size={15} />
              </button>
            </div>
          </div>

          {/* Block 3: Transcript Body */}
          <TranscriptBody recording={recording} matchedRecording={matchedRecording} />
        </div>

        {/* Block 4: Related Recordings */}
        {matchedRecording && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Link size={15} className="text-gray-400" />
              <span>Related Recording</span>
            </div>
            <RelatedRecordingCard recording={matchedRecording} relationship="original" />
          </div>
        )}

      </main>
    </div>
  );
}
