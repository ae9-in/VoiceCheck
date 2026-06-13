import { create } from 'zustand';

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
      set({ recordings: data, isLoading: false });
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
      console.error("Offline: adding recording only to local state.", err.message);
      set((state) => ({ recordings: [rec, ...state.recordings] }));
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
  }
}));

// Auto-trigger fetch on store load
useRecordingStore.getState().fetchRecordings();
