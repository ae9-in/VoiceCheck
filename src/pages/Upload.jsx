import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, X, Music, Clock, FileAudio, CheckCircle2, Loader2,
         Circle, Copy, Activity, Globe, Shield, Lock, AlertCircle,
         ChevronRight } from 'lucide-react'
import { useRecordingStore } from '../store/useRecordingStore'
import PageHeader from '../components/ui/PageHeader'
import StatusBadge from '../components/ui/StatusBadge'
import ToastNotification from '../components/ui/ToastNotification'

export default function UploadRecording() {
  const navigate = useNavigate();
  const { addRecording, recordings } = useRecordingStore();
  const fileInputRef = useRef(null);
  const timeoutsRef = useRef([]);

  // State Variables
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stepStatus, setStepStatus] = useState({ 
    step1: 'pending', step2: 'pending', step3: 'pending' 
  });
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [formData, setFormData] = useState({ 
    candidateId: '', candidateName: '', language: 'English', notes: '' 
  });
  const [errors, setErrors] = useState({});
  const [charCount, setCharCount] = useState(0);

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
  const validateAndSelectFile = (file) => {
    if (!file) return;

    const validExtensions = ['mp3', 'wav', 'm4a', 'aac'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    
    if (!validExtensions.includes(ext)) {
      setToast({
        isOpen: true,
        message: "Only MP3, WAV, M4A and AAC files are supported",
        type: 'error'
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setToast({
        isOpen: true,
        message: "File size exceeds the 50MB limit",
        type: 'error'
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
  };

  // Clear selected file
  const handleClearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Simulated duration value once file is loaded
  const fileDurationText = useMemo(() => {
    if (!selectedFile) return 'Calculating...';
    // Generate a pseudo-random length
    return "05:42";
  }, [selectedFile]);

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
  const handleSubmit = (e) => {
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
    setStepStatus({ step1: 'active', step2: 'pending', step3: 'pending' });
    setProgress(0);

    // Clear previous timeouts if any
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    // Step 1 completes after 1500ms
    const t1 = setTimeout(() => {
      setStepStatus({ step1: 'done', step2: 'active', step3: 'pending' });
      setProgress(33);
    }, 1500);

    // Step 2 completes after 2500ms (1500 + 2500)
    const t2 = setTimeout(() => {
      setStepStatus({ step1: 'done', step2: 'done', step3: 'active' });
      setProgress(66);
    }, 4000);

    // Step 3 completes after 1500ms (4000 + 1500)
    const t3 = setTimeout(() => {
      setStepStatus({ step1: 'done', step2: 'done', step3: 'done' });
      setProgress(100);
    }, 5500);

    // Display result card after 6000ms
    const t4 = setTimeout(() => {
      completeUpload();
    }, 6000);

    timeoutsRef.current.push(t1, t2, t3, t4);
  };

  const completeUpload = () => {
    const nextId = recordings.length + 1;
    const recordingId = `REC-2024-${nextId.toString().padStart(4, '0')}`;
    
    // Check candidateName for mock results variations
    const nameLower = formData.candidateName.toLowerCase();
    
    let status = 'Unique';
    let matchedRecordingId = null;
    let similarityScore = null;
    let duplicateType = null;

    if (nameLower.includes('exact') || nameLower.includes('sarah')) {
      status = 'Exact Duplicate';
      matchedRecordingId = 'REC-2024-0005';
      similarityScore = 0.99;
      duplicateType = 'exact';
    } else if (nameLower.includes('near') || nameLower.includes('michael')) {
      status = 'Near Duplicate';
      matchedRecordingId = 'REC-2024-0005';
      similarityScore = 0.97;
      duplicateType = 'near';
    } else if (nameLower.includes('repeated') || nameLower.includes('content') || nameLower.includes('duplicate')) {
      status = 'Repeated Content';
      matchedRecordingId = 'REC-2024-0010';
      similarityScore = 0.91;
      duplicateType = 'repeated';
    }

    const mockResult = {
      recordingId,
      status,
      matchedRecordingId,
      similarityScore,
      duplicateType,
      confidenceScore: 0.94,
      transcriptPreview: `The client meeting went well today. We discussed Q3 targets and agreed on a revised delivery timeline. The candidate ${formData.candidateName} completed verification.`
    };

    const newRecordObj = {
      recordingId: mockResult.recordingId,
      candidateId: formData.candidateId,
      candidateName: formData.candidateName,
      uploadTime: new Date().toISOString(),
      duration: 342, // 5m 42s
      fileSize: selectedFile.size,
      fileHash: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      audioFingerprint: Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      status: mockResult.status,
      matchedRecordingId: mockResult.matchedRecordingId,
      similarityScore: mockResult.similarityScore,
      duplicateType: mockResult.duplicateType,
      transcriptText: mockResult.transcriptPreview,
      confidenceScore: mockResult.confidenceScore,
      language: formData.language,
      transcriptProcessedAt: new Date().toISOString()
    };

    // Save to Zustand store
    addRecording(newRecordObj);

    // Save result local state
    setResult(mockResult);
    setIsProcessing(false);

    // Trigger Success Toasts
    if (status === 'Unique') {
      setToast({
        isOpen: true,
        message: "Recording uploaded and analyzed successfully",
        type: 'success'
      });
    } else {
      setToast({
        isOpen: true,
        message: "Duplicate detected — recording saved but flagged",
        type: 'error'
      });
    }
  };

  const handleUploadAnother = () => {
    setSelectedFile(null);
    setIsProcessing(false);
    setStepStatus({ step1: 'pending', step2: 'pending', step3: 'pending' });
    setProgress(0);
    setResult(null);
    setFormData({ candidateId: '', candidateName: '', language: 'English', notes: '' });
    setErrors({});
    setCharCount(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const renderStepRow = (stepLabel, status) => {
    return (
      <div className="flex items-center gap-3">
        {status === 'pending' && (
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-400">
            <Circle size={16} />
          </div>
        )}
        {status === 'active' && (
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
            <Loader2 size={16} className="animate-spin" />
          </div>
        )}
        {status === 'done' && (
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 text-green-600">
            <CheckCircle2 size={16} />
          </div>
        )}
        
        <span className={`text-sm ${
          status === 'pending' ? 'text-gray-400' :
          status === 'active' ? 'text-gray-900 font-medium' :
          'text-green-700'
        }`}>
          {stepLabel}
        </span>
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
          ) : isProcessing ? (
            // Upload Progress State
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4 animate-in fade-in duration-300">
              <h3 className="font-semibold text-gray-900 text-sm tracking-wide">Analyzing your recording...</h3>
              
              <div className="flex flex-col gap-3">
                {renderStepRow("Checking for duplicates...", stepStatus.step1)}
                {renderStepRow("Generating transcript...", stepStatus.step2)}
                {renderStepRow("Running similarity analysis...", stepStatus.step3)}
              </div>

              {/* Progress track bar */}
              <div className="space-y-1 pt-2">
                <div className="bg-gray-200 rounded-full h-1.5 w-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 rounded-full transition-all duration-500 ease-out" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-right text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">{progress}% Complete</div>
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
