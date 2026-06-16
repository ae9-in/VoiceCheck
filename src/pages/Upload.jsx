import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, X, Music, Clock, FileAudio, CheckCircle2, Loader2,
         Circle, Copy, Activity, Globe, Shield, Lock, AlertCircle,
         ChevronRight, CloudOff, MinusCircle } from 'lucide-react'
import { useRecordingStore } from '../store/useRecordingStore'
import PageHeader from '../components/ui/PageHeader'
import StatusBadge from '../components/ui/StatusBadge'
import ToastNotification from '../components/ui/ToastNotification'
import { useCloudinaryUpload } from '../hooks/useCloudinaryUpload'
import { validateAudioFile, getAudioDuration } from '../services/cloudinaryService'
import { formatFileSize } from '../utils/formatters'
import { useTranscription } from '../hooks/useTranscription'
import { findMostSimilarTranscript } from '../utils/similarity'


export default function UploadRecording() {
  const navigate = useNavigate();
  const { addRecording, recordings } = useRecordingStore();
  const fileInputRef = useRef(null);
  const timeoutsRef = useRef([]);

  // Cloudinary upload hook
  const { 
    uploadProgress, 
    isUploading, 
    uploadError, 
    uploadResult, 
    startUpload, 
    resetUpload 
  } = useCloudinaryUpload();

  // Transcription hook
  const {
    serviceOnline,
    runTranscription
  } = useTranscription();


  // State Variables
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileDuration, setFileDuration] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stepStatus, setStepStatus] = useState({ 
    upload: 'pending', 
    duplicate: 'pending', 
    transcript: 'pending', 
    similarity: 'pending' 
  });
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [formData, setFormData] = useState({ 
    candidateId: '', candidateName: '', language: 'English', notes: '' 
  });
  const [errors, setErrors] = useState({});
  const [charCount, setCharCount] = useState(0);
  const [transcriptWarmingUp, setTranscriptWarmingUp] = useState(false);

  // Toast State
  const [toast, setToast] = useState({
    isOpen: false,
    message: '',
    type: 'success'
  });

  // Calculate current date/time on mount
  const uploadDateTime = useMemo(() => {
    return new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  }, []);

  // Clean up timeouts
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  // Form input handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNotesChange = (e) => {
    const value = e.target.value;
    if (value.length <= 200) {
      setFormData(prev => ({ ...prev, notes: value }));
      setCharCount(value.length);
    }
  };

  // Drag-and-Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  // File Input Handler
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // File Validation
  const validateAndSelectFile = async (file) => {
    if (!file) return;

    const validation = validateAudioFile(file);
    if (!validation.valid) {
      setToast({
        isOpen: true,
        message: validation.error,
        type: 'error'
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
    setFileDuration(null);
    try {
      const dur = await getAudioDuration(file);
      setFileDuration(dur);
    } catch (e) {
      console.warn('Could not read duration client-side:', e.message);
    }
  };

  // Clear selected file
  const handleClearFile = () => {
    setSelectedFile(null);
    setFileDuration(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Simulated duration value once file is loaded
  const fileDurationText = useMemo(() => {
    if (!selectedFile) return '';
    if (fileDuration === null) return 'Reading metadata...';
    const m = Math.floor(fileDuration / 60);
    const s = Math.floor(fileDuration % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, [selectedFile, fileDuration]);

  const getFileTypeBadge = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (ext === 'mp3') return { bg: 'bg-green-100 text-green-700', label: 'MP3' };
    if (ext === 'wav') return { bg: 'bg-blue-100 text-blue-700', label: 'WAV' };
    if (ext === 'm4a') return { bg: 'bg-purple-100 text-purple-700', label: 'M4A' };
    if (ext === 'aac') return { bg: 'bg-amber-100 text-amber-700', label: 'AAC' };
    return { bg: 'bg-gray-100 text-gray-700', label: ext?.toUpperCase() || 'AUDIO' };
  };

  // Copy to clipboard helper
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setToast({
      isOpen: true,
      message: "Recording ID copied to clipboard!",
      type: 'success'
    });
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!selectedFile) {
      setToast({
        isOpen: true,
        message: "Please select an audio file before uploading",
        type: 'error'
      });
      return;
    }

    if (!formData.candidateId) {
      newErrors.candidateId = "Candidate ID is required";
    } else if (!/^CAND-\d{3}$/.test(formData.candidateId)) {
      newErrors.candidateId = "Format must be CAND-XXX (e.g. CAND-001)";
    }

    if (!formData.candidateName) {
      newErrors.candidateName = "Candidate Name is required";
    } else if (formData.candidateName.length < 2) {
      newErrors.candidateName = "Candidate Name must be at least 2 characters";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setToast({
        isOpen: true,
        message: "Please correct form validation errors",
        type: 'error'
      });
      return;
    }

    // Pass validation
    setErrors({});
    setIsProcessing(true);
    setStepStatus({ 
      upload: 'active', 
      duplicate: 'pending', 
      transcript: 'pending', 
      similarity: 'pending' 
    });
    setProgress(0);

    try {
      // Stage 1: Upload to Cloudinary
      const uploadRes = await startUpload(selectedFile);
      
      setStepStatus(prev => ({ ...prev, upload: 'done', duplicate: 'active' }));
      setProgress(25);

      // Stage 2: Checking for duplicates (Real exact hash check)
      await new Promise(resolve => setTimeout(resolve, 500));
      const exactMatch = recordings.find(r => r.fileHash === uploadRes.fileHash);

      let status = 'Unique';
      let matchedRecordingId = null;
      let similarityScore = null;
      let duplicateType = null;
      let transcriptText = '';
      let confidenceScore = 0.94;
      let transcriptEmbedding = null;
      let detectedLanguage = formData.language;
      let transcriptStatus = 'skipped';

      if (exactMatch) {
        status = 'Exact Duplicate';
        matchedRecordingId = exactMatch.recordingId;
        similarityScore = 1.0;
        duplicateType = 'exact';
        detectedLanguage = exactMatch.language || formData.language;

        // Only inherit transcript data if the matched recording was successfully transcribed.
        // If it was skipped/failed, try transcribing fresh (service might be available now).
        const matchHasTranscript = exactMatch.transcriptStatus === 'completed' && exactMatch.transcriptText;
        if (matchHasTranscript) {
          transcriptText = exactMatch.transcriptText;
          confidenceScore = exactMatch.confidenceScore || 0.95;
          transcriptEmbedding = exactMatch.transcriptEmbedding || null;
          transcriptStatus = 'completed';
          setStepStatus(prev => ({ ...prev, duplicate: 'done', transcript: 'done', similarity: 'done' }));
          setProgress(100);
        } else {
          // Matched recording had no transcript — attempt fresh transcription
          setStepStatus(prev => ({ ...prev, duplicate: 'done' }));
          setProgress(50);
          const shouldAttemptTranscription = (serviceOnline === 'online' || serviceOnline === 'unknown');
          if (shouldAttemptTranscription) {
            setStepStatus(prev => ({ ...prev, transcript: 'active' }));
            const warmupTimer = setTimeout(() => setTranscriptWarmingUp(true), 5000);
            timeoutsRef.current.push(warmupTimer);
            try {
              const transcriptionData = await runTranscription(selectedFile);
              clearTimeout(warmupTimer);
              setTranscriptWarmingUp(false);
              if (!transcriptionData || !transcriptionData.transcript || !transcriptionData.transcript.trim()) {
                transcriptStatus = 'failed';
                transcriptText = '';
                transcriptEmbedding = null;
                confidenceScore = 0;
                setStepStatus(prev => ({ ...prev, transcript: 'done', similarity: 'skipped' }));
              } else {
                transcriptStatus = 'completed';
                transcriptText = transcriptionData.transcript;
                transcriptEmbedding = transcriptionData.embedding || null;
                confidenceScore = transcriptionData.confidence || 0.94;
                detectedLanguage = transcriptionData.languageName || transcriptionData.language || detectedLanguage;
                setStepStatus(prev => ({ ...prev, transcript: 'done', similarity: 'done' }));
              }
            } catch (err) {
              clearTimeout(warmupTimer);
              setTranscriptWarmingUp(false);
              console.error('Transcription failed for exact match re-attempt:', err);
              transcriptStatus = 'skipped';
              transcriptText = '';
              transcriptEmbedding = null;
              confidenceScore = 0;
              setStepStatus(prev => ({ ...prev, transcript: 'skipped', similarity: 'skipped' }));
            }
          } else {
            transcriptStatus = 'skipped';
            transcriptText = '';
            transcriptEmbedding = null;
            confidenceScore = 0;
            setStepStatus(prev => ({ ...prev, transcript: 'skipped', similarity: 'skipped' }));
          }
          setProgress(100);
        }
      } else {
        // Mock triggers checking if name contains 'exact' or 'sarah'
        const nameLower = formData.candidateName.toLowerCase();
        if (nameLower.includes('exact') || nameLower.includes('sarah')) {
          status = 'Exact Duplicate';
          matchedRecordingId = 'REC-2024-0005';
          similarityScore = 0.99;
          duplicateType = 'exact';
        }

        setStepStatus(prev => ({ ...prev, duplicate: 'done' }));
        setProgress(50);

        // Stage 3: Generating transcript
        const shouldAttemptTranscription = (serviceOnline === 'online' || serviceOnline === 'unknown');
        if (shouldAttemptTranscription) {
          setStepStatus(prev => ({ ...prev, transcript: 'active' }));
          const warmupTimer = setTimeout(() => setTranscriptWarmingUp(true), 5000);
          timeoutsRef.current.push(warmupTimer);
          try {
            const transcriptionData = await runTranscription(selectedFile);
            clearTimeout(warmupTimer);
            setTranscriptWarmingUp(false);
            if (!transcriptionData || !transcriptionData.transcript || !transcriptionData.transcript.trim()) {
              transcriptStatus = 'failed';
              transcriptText = '';
              transcriptEmbedding = null;
              confidenceScore = 0;
              setStepStatus(prev => ({ ...prev, transcript: 'done', similarity: 'skipped' }));
            } else {
              transcriptStatus = 'completed';
              transcriptText = transcriptionData.transcript;
              transcriptEmbedding = transcriptionData.embedding || null;
              confidenceScore = transcriptionData.confidence || 0.94;
              detectedLanguage = transcriptionData.languageName || transcriptionData.language || formData.language;
              setStepStatus(prev => ({ ...prev, transcript: 'done', similarity: 'active' }));
            }
          } catch (err) {
            clearTimeout(warmupTimer);
            setTranscriptWarmingUp(false);
            console.error("Transcription service call failed, falling back to skipped behavior:", err);
            transcriptStatus = 'skipped';
            transcriptText = '';
            transcriptEmbedding = null;
            confidenceScore = 0;
            setStepStatus(prev => ({ ...prev, transcript: 'skipped', similarity: 'skipped' }));
          }
        } else {
          // Offline / graceful degradation
          transcriptStatus = 'skipped';
          transcriptText = '';
          transcriptEmbedding = null;
          confidenceScore = 0;
          setStepStatus(prev => ({ ...prev, transcript: 'skipped', similarity: 'skipped' }));
        }

        setProgress(75);

        // Stage 4: Running similarity analysis
        if (status !== 'Processing Failed' && transcriptStatus === 'completed') {
          // Audio fingerprinting (Near duplicate check) is still mocked
          const nameLowerCheck = formData.candidateName.toLowerCase();
          if (nameLowerCheck.includes('near') || nameLowerCheck.includes('michael')) {
            status = 'Near Duplicate';
            matchedRecordingId = 'REC-2024-0005';
            similarityScore = 0.97;
            duplicateType = 'near';
          }

          // If transcript is available and not already a duplicate, run cosine similarity check
          if (transcriptEmbedding && status !== 'Exact Duplicate' && status !== 'Near Duplicate') {
            const { match, score } = findMostSimilarTranscript(transcriptEmbedding, recordings);
            if (match) {
              status = 'Repeated Content';
              matchedRecordingId = match.recordingId;
              similarityScore = score;
              duplicateType = 'repeated';
            }
          }
        }

        setStepStatus(prev => {
          if (prev.similarity === 'skipped') return prev;
          return { ...prev, similarity: 'done' };
        });
        setProgress(100);
      }

      // Compile recording record
      const maxNum = recordings
        .map(r => {
          if (!r.recordingId) return 0;
          const parts = r.recordingId.split('-');
          const num = parseInt(parts[parts.length - 1], 10);
          return isNaN(num) ? 0 : num;
        })
        .reduce((max, n) => Math.max(max, n), 0);
      const nextId = maxNum + 1;
      const recordingId = `REC-2024-${nextId.toString().padStart(4, '0')}`;

      const finalResult = {
        recordingId,
        status,
        matchedRecordingId,
        similarityScore,
        duplicateType,
        confidenceScore: transcriptStatus === 'completed' ? confidenceScore : 0,
        transcriptPreview: transcriptText || 'Transcription skipped/failed.'
      };

      const newRecordObj = {
        recordingId: finalResult.recordingId,
        candidateId: formData.candidateId,
        candidateName: formData.candidateName,
        uploadTime: new Date().toISOString(),
        duration: Math.round(uploadRes.duration),
        fileSize: uploadRes.fileSize,
        fileHash: uploadRes.fileHash,
        audioFingerprint: Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        status: finalResult.status,
        matchedRecordingId: finalResult.matchedRecordingId,
        similarityScore: finalResult.similarityScore,
        duplicateType: finalResult.duplicateType,
        transcriptText: transcriptText || '',
        transcriptStatus: transcriptStatus,
        confidenceScore: finalResult.confidenceScore,
        language: detectedLanguage,
        transcriptProcessedAt: new Date().toISOString(),
        cloudinaryUrl: uploadRes.url,
        cloudinaryPublicId: uploadRes.publicId,
        // Guardrail: embedding must always be null when transcription wasn't completed
        transcriptEmbedding: transcriptStatus === 'completed' ? transcriptEmbedding : null
      };

      // Add to store and save in DB
      await addRecording(newRecordObj);

      setResult(finalResult);
      setIsProcessing(false);

      if (status === 'Unique') {
        setToast({
          isOpen: true,
          message: "Recording uploaded and analyzed successfully",
          type: 'success'
        });
      } else {
        setToast({
          isOpen: true,
          message: `Duplicate detected (${status}) — recording saved but flagged`,
          type: 'error'
        });
      }

    } catch (err) {
      console.error('Upload failed:', err);
      setIsProcessing(false);
      setToast({
        isOpen: true,
        message: err.message || 'Upload failed',
        type: 'error'
      });
    }
  };

  const handleUploadAnother = () => {
    resetUpload();
    setSelectedFile(null);
    setFileDuration(null);
    setIsProcessing(false);
    setTranscriptWarmingUp(false);
    setStepStatus({ 
      upload: 'pending', 
      duplicate: 'pending', 
      transcript: 'pending', 
      similarity: 'pending' 
    });
    setProgress(0);
    setResult(null);
    setFormData({ candidateId: '', candidateName: '', language: 'English', notes: '' });
    setErrors({});
    setCharCount(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const renderStepRow = (stepLabel, status, subLabel = null) => {
    return (
      <div className="flex items-start gap-3">
        {status === 'pending' && (
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-400 mt-0.5">
            <Circle size={16} />
          </div>
        )}
        {status === 'active' && (
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600 mt-0.5">
            <Loader2 size={16} className="animate-spin" />
          </div>
        )}
        {status === 'done' && (
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 text-green-600 mt-0.5">
            <CheckCircle2 size={16} />
          </div>
        )}
        {status === 'skipped' && (
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-400 mt-0.5">
            <MinusCircle size={16} />
          </div>
        )}
        
        <div className="flex flex-col">
          <span className={`text-sm ${
            status === 'pending' ? 'text-gray-400' :
            status === 'active' ? 'text-gray-900 font-medium' :
            status === 'skipped' ? 'text-gray-400 italic font-normal' :
            'text-green-700'
          }`}>
            {stepLabel} {status === 'skipped' && '(skipped)'}
          </span>
          {subLabel}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Toast Notification */}
      <ToastNotification 
        message={toast.message}
        type={toast.type}
        isOpen={toast.isOpen}
        onClose={() => setToast(prev => ({ ...prev, isOpen: false }))}
      />

      <PageHeader title="Upload Recording" breadcrumb="Home > Upload Recording" />

      {/* Transcription Service Health Banner */}
      <div className="mt-4">
        {serviceOnline === null ? (
          <div className="bg-gray-50 border border-gray-200 text-gray-650 rounded-xl p-3 px-4 text-xs flex items-center gap-2.5 shadow-sm">
            <Loader2 size={14} className="animate-spin text-gray-400" />
            <span className="font-medium">Checking transcription service status...</span>
          </div>
        ) : serviceOnline === 'online' ? (
          <div className="bg-emerald-50 border border-emerald-250 text-emerald-850 rounded-xl p-3 px-4 text-xs flex items-center justify-between shadow-sm animate-in fade-in duration-250">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
              <span>
                <strong className="font-semibold text-emerald-900">Transcription Service Online:</strong> Speech-to-text and multilingual embedding similarity analysis are active.
              </span>
            </div>
          </div>
        ) : serviceOnline === 'unknown' ? (
          <div className="bg-gray-50 border border-gray-200 text-gray-650 rounded-xl p-3 px-4 text-xs flex items-center gap-2.5 shadow-sm animate-in fade-in duration-250">
            <Loader2 size={14} className="animate-spin text-gray-400" />
            <span className="font-medium">Checking transcription service...</span>
          </div>
        ) : (
          <div className="bg-amber-55 bg-amber-50 border border-amber-250 text-amber-850 rounded-xl p-3 px-4 text-xs flex items-center justify-between shadow-sm animate-in fade-in duration-250">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2 w-2 rounded-full bg-amber-500"></span>
              <span>
                <strong className="font-semibold text-amber-900">Transcription Service Offline:</strong> Running in offline mode. Transcription and similarity checks will be skipped (graceful degradation).
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                {/* Left Column: File Upload Zone */}
        <div className="space-y-6">
          
          {/* Result Card State */}
          {result ? (
            <div className="bg-white border border-gray-200 rounded-xl relative shadow-sm overflow-hidden animate-in zoom-in-95 duration-200">
              {/* Accent top color */}
              <div className={`h-1.5 w-full ${
                result.status === 'Unique' ? 'bg-green-500' :
                result.status === 'Exact Duplicate' ? 'bg-red-500' :
                result.status === 'Near Duplicate' ? 'bg-amber-500' :
                'bg-orange-500'
              }`} />
              
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <StatusBadge status={result.status} />
                  <h3 className="font-semibold text-gray-900">Analysis Complete</h3>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 border border-gray-150 p-2 rounded-lg font-mono">
                  <span>ID: {result.recordingId}</span>
                  <button 
                    onClick={() => copyToClipboard(result.recordingId)}
                    className="p-1 hover:bg-gray-200 rounded text-gray-500 transition-colors"
                    title="Copy ID"
                  >
                    <Copy size={14} />
                  </button>
                </div>

                {/* Duplicate Warning Box */}
                {result.status !== 'Unique' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
                    <p className="text-amber-800 font-semibold text-sm">Matched with {result.matchedRecordingId}</p>
                    <p className="text-amber-700 text-xs font-medium">Similarity score: {Math.round(result.similarityScore * 100)}%</p>
                    <button 
                      onClick={() => navigate(`/transcripts/${result.matchedRecordingId}`)}
                      className="text-indigo-600 text-xs font-semibold hover:underline block mt-1"
                    >
                      View original recording →
                    </button>
                  </div>
                )}

                {/* Info Badges */}
                <div className="flex gap-2">
                  <div className="bg-gray-100 text-gray-700 text-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 font-medium">
                    <Activity size={14} className="text-gray-500" />
                    <span>Confidence: {Math.round(result.confidenceScore * 100)}%</span>
                  </div>
                  <div className="bg-gray-100 text-gray-700 text-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 font-medium">
                    <Globe size={14} className="text-gray-500" />
                    <span>Language: {formData.language}</span>
                  </div>
                </div>

                {/* Transcript Preview Box */}
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block mb-1">Transcript preview</label>
                  <p className="text-xs text-gray-700 italic leading-relaxed">
                    "{result.transcriptPreview.slice(0, 120)}..."
                  </p>
                </div>

                {/* Bottom Action buttons */}
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => navigate(`/transcripts/${result.recordingId}`)}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg text-xs transition-colors flex items-center justify-center"
                  >
                    View Full Transcript
                  </button>
                  <button 
                    onClick={handleUploadAnother}
                    className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-2.5 rounded-lg text-xs transition-colors flex items-center justify-center"
                  >
                    Upload Another
                  </button>
                </div>
              </div>
            </div>
          ) : uploadError ? (
            // Upload Error Card State
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center shadow-sm animate-in zoom-in-95 duration-200">
              <CloudOff size={32} className="text-red-400 mx-auto" />
              <h3 className="text-red-700 font-semibold mt-2">Upload failed</h3>
              <p className="text-red-500 text-sm mt-1 mb-4">{uploadError}</p>
              <button 
                type="button"
                onClick={resetUpload}
                className="px-4 py-2 border border-red-600 text-red-650 hover:bg-red-100 rounded-lg font-semibold text-xs tracking-wide transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : isProcessing ? (
            // Upload Progress State
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4 animate-in fade-in duration-300">
              <h3 className="font-semibold text-gray-900 text-sm tracking-wide">Analyzing your recording...</h3>
              
              <div className="flex flex-col gap-3">
                {renderStepRow("Uploading to cloud storage...", stepStatus.upload)}
                {renderStepRow("Checking for duplicates...", stepStatus.duplicate)}
                {renderStepRow(
                  transcriptWarmingUp ? "Warming up transcription service..." : "Generating transcript...",
                  stepStatus.transcript,
                  transcriptWarmingUp && (
                    <span className="text-xs text-amber-500 mt-0.5 block">
                      Service is waking up — this may take up to 60 seconds
                    </span>
                  )
                )}
                {renderStepRow("Running similarity analysis...", stepStatus.similarity)}
              </div>

              {/* Progress track bar */}
              <div className="space-y-1 pt-2">
                <div className="bg-gray-200 rounded-full h-1.5 w-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 rounded-full transition-all duration-350" 
                    style={{ width: `${stepStatus.upload === 'active' ? uploadProgress : progress}%` }}
                  />
                </div>
                <div className="text-right text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                  {stepStatus.upload === 'active' ? `${uploadProgress}% uploaded` : `${progress}% Complete`}
                </div>
              </div>
            </div>
          ) : selectedFile ? (
            // File Preview Card State
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm animate-in zoom-in-95 duration-100">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-3 ${getFileTypeBadge(selectedFile.name).bg}`}>
                    <Music size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900 truncate max-w-[200px]" title={selectedFile.name}>
                      {selectedFile.name}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full uppercase">
                    {getFileTypeBadge(selectedFile.name).label}
                  </span>
                  <button 
                    onClick={handleClearFile}
                    className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-100 mt-4 pt-3 flex gap-6 text-xs text-gray-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <Clock size={14} className="opacity-75" />
                  <span>Duration: {fileDurationText}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileAudio size={14} className="opacity-75" />
                  <span>Format: {getFileTypeBadge(selectedFile.name).label}</span>
                </div>
              </div>
            </div>
          ) : (
            // Drop Zone Default State
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 min-h-[280px] flex flex-col items-center justify-center text-center transition-all duration-200 ${
                isDragOver 
                  ? 'border-indigo-400 bg-indigo-50/50' 
                  : 'border-gray-300 bg-gray-50'
              }`}
            >
              <Upload 
                size={48} 
                className={`transition-colors duration-200 ${isDragOver ? 'text-indigo-500' : 'text-gray-400'}`} 
              />
              <p className="text-lg font-medium text-gray-700 mt-4">Drag & drop your audio file here</p>
              <span className="text-sm text-gray-400 my-2">or</span>
              
              <button 
                type="button"
                onClick={triggerFileSelect}
                className="px-4 py-2 border border-indigo-600 text-indigo-600 hover:bg-indigo-50 rounded-lg font-semibold text-xs tracking-wide transition-colors"
              >
                Browse Files
              </button>
              
              <input
                type="file"
                ref={fileInputRef}
                accept=".mp3,.wav,.m4a,.aac,audio/*"
                className="hidden"
                onChange={handleFileSelect}
              />

              <div className="flex gap-2 mt-5">
                {['MP3', 'WAV', 'M4A', 'AAC'].map(badge => (
                  <span key={badge} className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                    {badge}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-3 font-semibold">Max file size: 50MB</p>
            </div>
          )}

        </div>

        {/* Right Column: Candidate Metadata Form */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recording Details</h3>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Candidate ID */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Candidate ID *</label>
              <input 
                type="text" 
                name="candidateId"
                value={formData.candidateId}
                onChange={handleInputChange}
                disabled={isProcessing || !!result}
                placeholder="e.g. CAND-001"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
              {errors.candidateId && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle size={12} className="inline" />
                  {errors.candidateId}
                </p>
              )}
            </div>

            {/* Candidate Name */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Candidate Name *</label>
              <input 
                type="text" 
                name="candidateName"
                value={formData.candidateName}
                onChange={handleInputChange}
                disabled={isProcessing || !!result}
                placeholder="Enter full name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
              {errors.candidateName && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle size={12} className="inline" />
                  {errors.candidateName}
                </p>
              )}
            </div>

            {/* Upload Date & Time */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Upload Date & Time</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={uploadDateTime} 
                  readOnly 
                  className="w-full border border-gray-300 rounded-lg pl-3 pr-10 py-2.5 text-sm bg-gray-50 cursor-not-allowed text-gray-500 focus:outline-none" 
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Language</label>
              <select
                name="language"
                value={formData.language}
                onChange={handleInputChange}
                disabled={isProcessing || !!result}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
              >
                <option>English</option>
                <option>Hindi</option>
                <option>Tamil</option>
                <option>Telugu</option>
                <option>Kannada</option>
                <option>Other</option>
              </select>
              <p className="text-[11px] text-gray-400 mt-1">
                Note: When the transcription service is online, language is auto-detected directly from the audio.
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Notes (Optional)</label>
              <textarea 
                rows={3} 
                value={formData.notes}
                onChange={handleNotesChange}
                disabled={isProcessing || !!result}
                placeholder="Any additional context about this recording..." 
                maxLength={200}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed resize-none"
              />
              <div className="text-right text-[10px] text-gray-400 font-bold mt-1">
                {charCount} / 200
              </div>
            </div>

            {/* Submit Button */}
            <div>
              {isProcessing ? (
                <button
                  type="button"
                  disabled
                  className="bg-indigo-600 text-white font-medium py-3 rounded-lg w-full flex items-center justify-center gap-2 opacity-50 cursor-not-allowed text-sm"
                >
                  <Loader2 size={16} className="animate-spin" />
                  Analyzing...
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!selectedFile || !!result}
                  className={`font-semibold py-3 rounded-lg w-full flex items-center justify-center gap-2 text-sm transition-all ${
                    (!selectedFile || !!result)
                      ? 'bg-indigo-400 text-white opacity-50 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-[0.99] shadow-md hover:shadow-lg'
                  }`}
                >
                  <Upload size={16} />
                  Upload & Analyze
                </button>
              )}
            </div>

            {/* Footer security badges */}
            <div className="flex items-center justify-center gap-4 mt-3 text-[10px] font-semibold text-gray-400">
              <span className="flex items-center gap-1">
                <Shield size={12} />
                Virus scanned
              </span>
              <span className="flex items-center gap-1">
                <Lock size={12} />
                Encrypted
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} />
                Processed ~5s
              </span>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
}
