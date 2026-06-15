import { create } from 'zustand';

function createSeededRandom(seedStr) {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) {
    h = (Math.imul(31, h) + seedStr.charCodeAt(i)) | 0;
  }
  let state = h;
  return function() {
    state = (Math.imul(1103515245, state) + 12345) | 0;
    return (state >>> 0) / 4294967296;
  };
}

export function generateMockEmbedding(recordingId) {
  if (recordingId === 'REC-2024-0019' || recordingId === 'REC-2024-0020') {
    const base = generateMockEmbedding('REC-2024-0010');
    const rand = createSeededRandom(recordingId);
    const nudged = base.map(val => {
      return val * 0.97 + (rand() - 0.5) * 0.03;
    });
    const mag = Math.sqrt(nudged.reduce((sum, v) => sum + v * v, 0));
    return nudged.map(v => v / (mag || 1));
  }

  const rand = createSeededRandom(recordingId);
  const vec = Array.from({ length: 768 }, () => rand() * 2 - 1);
  const mag = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  return vec.map(v => v / (mag || 1));
}

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
      let apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      if (apiUrl && !apiUrl.endsWith('/api') && !apiUrl.endsWith('/api/')) {
        apiUrl = `${apiUrl.replace(/\/$/, '')}/api`;
      }
      const res = await fetch(`${apiUrl}/recordings`);
      if (!res.ok) throw new Error('Server responded with an error');
      
      const data = await res.json();
      const mapped = data.map(rec => ({
        ...rec,
        cloudinaryUrl: rec.cloudinaryUrl || `https://res.cloudinary.com/demo/video/upload/voicecheck/recordings/mock-${rec.recordingId}.mp3`,
        cloudinaryPublicId: rec.cloudinaryPublicId || `voicecheck/recordings/mock-${rec.recordingId}`,
        transcriptEmbedding: rec.transcriptEmbedding || generateMockEmbedding(rec.recordingId)
      }));
      set({ recordings: mapped, isLoading: false });
    } catch (err) {
      console.warn("Could not connect to MongoDB server, running in offline mode with empty store:", err.message);
      set({ 
        recordings: [], 
        isLoading: false,
        error: "Running in offline mode (empty database)."
      });
    }
  },
  
  addRecording: async (rec) => {
    let apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    if (apiUrl && !apiUrl.endsWith('/api') && !apiUrl.endsWith('/api/')) {
      apiUrl = `${apiUrl.replace(/\/$/, '')}/api`;
    }
    const recWithEmbedding = {
      ...rec,
      transcriptEmbedding: rec.transcriptEmbedding || generateMockEmbedding(rec.recordingId)
    };
    try {
      const res = await fetch(`${apiUrl}/recordings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recWithEmbedding)
      });
      
      if (!res.ok) throw new Error('Failed to save recording to database');
      const saved = await res.json();
      const mappedSaved = {
        ...saved,
        cloudinaryUrl: saved.cloudinaryUrl || recWithEmbedding.cloudinaryUrl,
        cloudinaryPublicId: saved.cloudinaryPublicId || recWithEmbedding.cloudinaryPublicId,
        transcriptEmbedding: saved.transcriptEmbedding || recWithEmbedding.transcriptEmbedding
      };
      
      set((state) => ({ recordings: [mappedSaved, ...state.recordings] }));
    } catch (err) {
      console.error("Offline: adding recording only to local state.", err.message);
      set((state) => ({ 
        recordings: [{
          ...recWithEmbedding,
          cloudinaryUrl: recWithEmbedding.cloudinaryUrl,
          cloudinaryPublicId: recWithEmbedding.cloudinaryPublicId,
        }, ...state.recordings] 
      }));
    }
  },
  
  deleteRecording: async (recordingId) => {
    let apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    if (apiUrl && !apiUrl.endsWith('/api') && !apiUrl.endsWith('/api/')) {
      apiUrl = `${apiUrl.replace(/\/$/, '')}/api`;
    }
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
      console.error("Offline: deleting recording from local state.", err.message);
      set((state) => ({
        recordings: state.recordings.filter(r => r.recordingId !== recordingId),
        selectedRecording: state.selectedRecording?.recordingId === recordingId ? null : state.selectedRecording
      }));
    }
  },
  
  updateRecording: async (recordingId, updatedFields) => {
    let apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    if (apiUrl && !apiUrl.endsWith('/api') && !apiUrl.endsWith('/api/')) {
      apiUrl = `${apiUrl.replace(/\/$/, '')}/api`;
    }
    try {
      const res = await fetch(`${apiUrl}/recordings/${recordingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      if (!res.ok) throw new Error('Failed to update recording in database');
      
      await get().fetchRecordings();
    } catch (err) {
      console.error("Offline: updating recording only in local state.", err.message);
      set((state) => ({
        recordings: state.recordings.map(r => 
          r.recordingId === recordingId ? { ...r, ...updatedFields } : r
        ),
        selectedRecording: state.selectedRecording?.recordingId === recordingId 
          ? { ...state.selectedRecording, ...updatedFields } 
          : state.selectedRecording
      }));
    }
  }
}));

// Auto-trigger fetch on store load
useRecordingStore.getState().fetchRecordings();
