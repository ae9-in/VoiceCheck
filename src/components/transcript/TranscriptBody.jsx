import { useState, useMemo } from 'react'
import { Search, X, Zap } from 'lucide-react'

const stopWords = new Set([
  'that','this','with','from','have','they','will','been','were','their',
  'there','about','which','would','could','about','their','there','would'
]);

export default function TranscriptBody({ recording, matchedRecording }) {
  const [showHighlights, setShowHighlights] = useState(true);
  const [fontSize, setFontSize] = useState('base');
  const [searchTerm, setSearchTerm] = useState('');

  // Escape regex characters
  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // Build sharedWords set from matched original
  const sharedWords = useMemo(() => {
    if (!matchedRecording) return new Set();
    const rawWords = matchedRecording.transcriptText
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/);
      
    return new Set(
      rawWords
        .filter(w => w.length > 4)
        .filter(w => !stopWords.has(w))
    );
  }, [matchedRecording]);

  // Compute search match count
  const matchCount = useMemo(() => {
    if (!searchTerm || !recording.transcriptText) return 0;
    const regex = new RegExp(escapeRegExp(searchTerm), 'gi');
    const matches = recording.transcriptText.match(regex);
    return matches ? matches.length : 0;
  }, [searchTerm, recording.transcriptText]);

  // Highlight helper for shared duplicate words
  const highlightSharedWords = (text, keyPrefix = 'word') => {
    if (!matchedRecording || !showHighlights || sharedWords.size === 0) {
      return text;
    }

    const tokens = text.split(/(\s+)/);
    const highlightClass = 
      recording.duplicateType === 'exact' ? 'bg-red-100 text-red-900 border-b-2 border-red-300' :
      recording.duplicateType === 'near' ? 'bg-amber-100 text-amber-900 border-b-2 border-amber-300' :
      recording.duplicateType === 'repeated' ? 'bg-orange-100 text-orange-900 border-b-2 border-orange-300' :
      'bg-indigo-100 text-indigo-900 border-b-2 border-indigo-300';

    return tokens.map((token, idx) => {
      const clean = token.toLowerCase().replace(/[^a-z]/g, '');
      if (sharedWords.has(clean)) {
        return (
          <mark 
            key={`${keyPrefix}-${idx}`} 
            className={`${highlightClass} rounded-sm px-0.5 cursor-help not-italic`}
            title="Also appears in matched recording"
          >
            {token}
          </mark>
        );
      }
      return token;
    });
  };

  // Main sentence renderer applying both search and duplicate highlights
  const renderSentence = (sentence, sIdx) => {
    if (!searchTerm) {
      return highlightSharedWords(sentence, `sentence-${sIdx}`);
    }

    const searchRegex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
    const parts = sentence.split(searchRegex);

    return parts.map((part, index) => {
      if (part.toLowerCase() === searchTerm.toLowerCase()) {
        return (
          <mark key={`search-${index}`} className="bg-yellow-300 text-yellow-900 rounded px-0.5 font-medium">
            {part}
          </mark>
        );
      }
      return highlightSharedWords(part, `s-${sIdx}-part-${index}`);
    });
  };

  // Get color for duplicate legend
  const getLegendColor = () => {
    if (recording.duplicateType === 'exact') return 'bg-red-300';
    if (recording.duplicateType === 'near') return 'bg-amber-300';
    return 'bg-orange-300';
  };

  // Split transcript into sentences
  const sentences = useMemo(() => {
    const text = recording.transcriptText || '';
    return text
      .split(/(?<=[.!?])\s+/)
      .filter(s => s.trim().length > 0);
  }, [recording.transcriptText]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs flex flex-col">
      {/* Toolbar */}
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-3 flex-wrap">
        
        {/* Highlight switch */}
        {matchedRecording && (
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
            <div 
              onClick={() => setShowHighlights(!showHighlights)}
              className={`w-8 h-4 rounded-full cursor-pointer transition-colors relative flex items-center ${
                showHighlights ? 'bg-indigo-500' : 'bg-gray-300'
              }`}
            >
              <div className={`w-3 h-3 bg-white rounded-full shadow absolute transition-transform duration-200 ${
                showHighlights ? 'translate-x-4' : 'translate-x-0.5'
              }`} />
            </div>
            <span className="text-xs text-gray-600 font-semibold select-none">Show highlights</span>
          </div>
        )}

        {/* Font selectors */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
          <button 
            onClick={() => setFontSize('sm')}
            className={`px-2.5 py-0.5 rounded text-[10px] transition-all font-semibold ${
              fontSize === 'sm' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            A-
          </button>
          <button 
            onClick={() => setFontSize('base')}
            className={`px-2.5 py-0.5 rounded text-xs transition-all font-semibold ${
              fontSize === 'base' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            A
          </button>
          <button 
            onClick={() => setFontSize('lg')}
            className={`px-2.5 py-0.5 rounded text-sm transition-all font-semibold ${
              fontSize === 'lg' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            A+
          </button>
        </div>

        {/* Search tool */}
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Find in transcript..."
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 pr-7 py-1.5 text-xs border border-gray-200 rounded-lg w-44 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-medium text-gray-700" 
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={12} />
              </button>
            )}
          </div>
          {searchTerm && (
            <span className="text-[11px] text-gray-400 font-bold ml-1">
              {matchCount} {matchCount === 1 ? 'match' : 'matches'}
            </span>
          )}
        </div>
      </div>

      {/* Transcript Text Area */}
      <div className={`p-6 space-y-4 leading-[1.9] text-gray-800 font-medium ${
        fontSize === 'sm' ? 'text-sm' :
        fontSize === 'lg' ? 'text-lg' : 'text-base'
      }`}>
        {recording.transcriptStatus === 'skipped' ? (
          <p className="text-gray-400 italic">
            Transcription was not run for this recording (service unavailable at upload time)
          </p>
        ) : recording.transcriptStatus === 'failed' ? (
          <p className="text-amber-600 font-medium italic">
            Transcription failed for this recording — audio may be silent, corrupted, or unsupported
          </p>
        ) : !recording.transcriptText || recording.transcriptText.trim() === '' ? (
          <p className="text-gray-400 italic">
            No transcript available
          </p>
        ) : (
          sentences.map((sentence, i) => (
            <p key={i} className="relative pl-8 group">
              <span className="absolute left-0 text-[10px] text-gray-300 font-mono mt-1.5 group-hover:text-gray-400 transition-colors select-none font-bold">
                {i + 1}
              </span>
              {renderSentence(sentence, i)}
            </p>
          ))
        )}
      </div>

      {/* Footer bar */}
      <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50 text-xs">
        <div className="flex items-center text-gray-400 font-semibold">
          <Zap size={11} className="inline mr-1 text-amber-400 fill-amber-400" />
          <span>Auto-generated transcript</span>
        </div>

        <div className="flex items-center gap-4 text-gray-500">
          {matchedRecording && showHighlights && (
            <div className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm ${getLegendColor()}`} />
              <span className="text-xs font-semibold">Shared with matched recording</span>
            </div>
          )}
          {searchTerm && (
            <span className="font-semibold text-indigo-600">Searching: {matchCount} results</span>
          )}
        </div>
      </div>
    </div>
  );
}
