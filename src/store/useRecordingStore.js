import { create } from 'zustand';

const INDIAN_NAMES = [
  "Ravi Sharma", "Priya Mehta", "Arjun Nair", "Sneha Iyer", "Karan Patel",
  "Divya Reddy", "Rohan Verma", "Ananya Singh", "Vikram Joshi", "Meera Nambiar"
];

const TRANSCRIPT_SAMPLES = [
  "The client meeting went well today. We discussed the Q3 targets and agreed on a revised delivery timeline. The team is confident about hitting the milestones.",
  "I've reviewed the project documentation. There are a few discrepancies in the budget allocation that we need to address before the next stakeholder meeting.",
  "Our recent user feedback indicates a strong preference for the new mobile interface. We should prioritize the rollout of the dark mode feature next week.",
  "The technical debt is becoming a bottleneck for the engineering team. We need to allocate at least 20% of our next sprint to refactoring core modules.",
  "During the standup, it was clear that the backend integration is taking longer than expected. We've redirected two more developers to assist."
];

const generateMockRecordings = () => {
  const recordings = [];
  
  for (let i = 0; i < 20; i++) {
    const idNum = i + 1;
    const recordingId = `REC-2024-${idNum.toString().padStart(4, '0')}`;
    const candIndex = i % 10;
    const candidateId = `CAND-${(candIndex + 1).toString().padStart(3, '0')}`;
    const candidateName = INDIAN_NAMES[candIndex];
    
    // Upload time inside last 30 days
    const uploadTimeDate = new Date(Date.now() - (i * 1.5 * 24 * 60 * 60 * 1000 + Math.random() * 12 * 60 * 60 * 1000));
    const uploadTime = uploadTimeDate.toISOString();
    
    const duration = Math.floor(60 + Math.random() * 540); // 60 - 600 seconds
    const fileSize = Math.floor(1000000 + Math.random() * 24000000); // 1MB - 25MB
    
    const fileHash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const audioFingerprint = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    
    let status = "Unique";
    let duplicateType = null;
    let matchedRecordingId = null;
    let similarityScore = null;
    
    if (i === 12 || i === 13 || i === 14) {
      status = "Exact Duplicate";
      duplicateType = "exact";
      matchedRecordingId = `REC-2024-000${(i - 11)}`; // matches REC-2024-0001, 2, 3
      similarityScore = 0.99;
    } else if (i === 15 || i === 16 || i === 17) {
      status = "Near Duplicate";
      duplicateType = "near";
      matchedRecordingId = `REC-2024-000${(i - 10)}`; // matches REC-2024-0005, 6, 7
      similarityScore = parseFloat((0.92 + Math.random() * 0.05).toFixed(2));
    } else if (i === 18 || i === 19) {
      status = "Repeated Content";
      duplicateType = "repeated";
      matchedRecordingId = `REC-2024-000${(i - 9)}`; // matches REC-2024-0009, 10
      similarityScore = parseFloat((0.91 + Math.random() * 0.02).toFixed(2));
    }
    
    const transcriptText = TRANSCRIPT_SAMPLES[i % TRANSCRIPT_SAMPLES.length];
    const confidenceScore = parseFloat((0.82 + Math.random() * 0.15).toFixed(2));
    
    const language = (i === 3 || i === 7 || i === 11) ? "Hindi" : "English";
    const transcriptProcessedAt = new Date(uploadTimeDate.getTime() + 120000).toISOString(); // 2 mins later
    
    recordings.push({
      recordingId,
      candidateId,
      candidateName,
      uploadTime,
      duration,
      fileSize,
      fileHash,
      audioFingerprint,
      status,
      matchedRecordingId,
      similarityScore,
      duplicateType,
      transcriptText,
      confidenceScore,
      language,
      transcriptProcessedAt
    });
  }
  
  return recordings;
};

export const useRecordingStore = create((set, get) => ({
  recordings: [],
  selectedRecording: null,
  searchQuery: "",
  filterStatus: "all",
  isLoading: false,
  error: null,
  
  setSelectedRecording: (rec) => set({ selectedRecording: rec }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setFilterStatus: (s) => set({ filterStatus: s }),
  
  fetchRecordings: async () => {
    set({ isLoading: true, error: null });
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      let res = await fetch(`${apiUrl}/recordings`);
      if (!res.ok) throw new Error('Server responded with an error');
      
      let data = await res.json();
      
      // Seed if MongoDB returns no recordings
      if (data.length === 0) {
        console.log("MongoDB is empty. Seeding database with initial records...");
        const seedRes = await fetch(`${apiUrl}/recordings/seed`, { method: 'POST' });
        if (seedRes.ok) {
          const freshRes = await fetch(`${apiUrl}/recordings`);
          if (freshRes.ok) {
            data = await freshRes.json();
          }
        }
      }
      
      set({ recordings: data, isLoading: false });
    } catch (err) {
      console.warn("Could not connect to MongoDB server, loading local memory store fallback:", err.message);
      set({ 
        recordings: generateMockRecordings(), 
        isLoading: false,
        error: "Running in offline fallback mode."
      });
    }
  },
  
  addRecording: async (rec) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    try {
      const res = await fetch(`${apiUrl}/recordings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rec)
      });
      
      if (!res.ok) throw new Error('Failed to save recording to database');
      const saved = await res.json();
      
      set((state) => ({ recordings: [saved, ...state.recordings] }));
    } catch (err) {
      console.error("Offline fallback: adding recording only to local state.", err.message);
      // Fallback
      set((state) => ({ recordings: [rec, ...state.recordings] }));
    }
  },
  
  deleteRecording: async (recordingId) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    try {
      const res = await fetch(`${apiUrl}/recordings/${recordingId}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) throw new Error('Failed to delete recording from database');
      
      set((state) => ({
        recordings: state.recordings.filter(r => r.recordingId !== recordingId),
        selectedRecording: state.selectedRecording?.recordingId === recordingId ? null : state.selectedRecording
      }));
    } catch (err) {
      console.error("Offline fallback: deleting recording from local state.", err.message);
      // Fallback
      set((state) => ({
        recordings: state.recordings.filter(r => r.recordingId !== recordingId),
        selectedRecording: state.selectedRecording?.recordingId === recordingId ? null : state.selectedRecording
      }));
    }
  }
}));

// Auto-trigger fetch on store load
useRecordingStore.getState().fetchRecordings();
