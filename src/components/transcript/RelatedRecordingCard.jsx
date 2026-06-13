import { useNavigate } from 'react-router-dom'
import { FileCheck, FileMinus, ArrowRight } from 'lucide-react'
import { formatDuration, formatDateTime } from '../../utils/formatters'

export default function RelatedRecordingCard({ recording, relationship = 'original' }) {
  const navigate = useNavigate();

  if (!recording) return null;

  const handleViewTranscript = (e) => {
    e.stopPropagation();
    navigate(`/transcripts/${recording.recordingId}`);
  };

  return (
    <div 
      onClick={handleViewTranscript}
      className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer w-full"
    >
      {/* Left Icon Badge */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
        relationship === 'original' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
      }`}>
        {relationship === 'original' ? <FileCheck size={20} /> : <FileMinus size={20} />}
      </div>

      {/* Center Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-indigo-600 font-semibold">{recording.recordingId}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            relationship === 'original' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {relationship === 'original' ? 'Original' : 'Matched'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500 font-medium">
          <span className="text-gray-700 font-semibold">{recording.candidateName}</span>
          <span className="text-gray-300 select-none">·</span>
          <span>{formatDuration(recording.duration)}</span>
          <span className="text-gray-300 select-none">·</span>
          <span>{formatDateTime(recording.uploadTime)}</span>
        </div>

        <div className="mt-1.5 text-xs text-gray-400 italic truncate max-w-lg block">
          "{recording.transcriptText ? recording.transcriptText.slice(0, 80) : ''}..."
        </div>
      </div>

      {/* Right Link Button */}
      <div className="flex-shrink-0">
        <button 
          onClick={handleViewTranscript}
          className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-bold border border-indigo-100 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
        >
          View Transcript
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}
