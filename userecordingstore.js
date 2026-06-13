import { create } from 'zustand';

/**
 * Realistic Indian Names for Mock Data
 */
const INDIAN_NAMES = [
  "Ravi Sharma", "Priya Mehta", "Arjun Nair", "Siddharth Goel", 
  "Ananya Iyer", "Vikram Singh", "Kavita Reddy", "Aditya Gupta", 
  "Sneha Kapoor", "Rohan Verma"
];

/**
 * Realistic Transcript Snippets
 */
const TRANSCRIPT_SAMPLES = [
  "The client meeting went well today. We discussed the Q3 targets and agreed on a revised delivery timeline. The team is confident about hitting the milestones.",
  "I've reviewed the project documentation. There are a few discrepancies in the budget allocation that we need to address before the next stakeholder meeting.",
  "Our recent user feedback indicates a strong preference for the new mobile interface. We should prioritize the rollout of the dark mode feature next week.",
  "The technical debt is becoming a bottleneck for the engineering team. We need to allocate at least 20% of our next sprint to refactoring core modules.",
  "During the standup, it was clear that the backend integration is taking longer than expected. We've redirected two more developers to assist."
];

/**
 * Generate 20 Mock Recordings
 */
const generateMockRecordings = () => {
  return Array.from({ length: 20 }, (_, i) => {
    const id = i + 1;
    const recordingId = `REC-2024-${id.toString().padStart(4, '0')}`;
    const candIdNum = (i % 10) + 1;
    const candidateId = `CAND-${candIdNum.toString().padStart(3, '0')}`;
    const candidateName = INDIAN_NAMES[i % 10];
    
    // Status distribution
    let status = "Unique";
    let duplicateType = null;
    let matchedId = null;
    let similarity = null;

    if (id > 12 && id <= 15) {
      status = "Exact Duplicate";
      duplicateType = "exact";
      matchedId = "REC-2024-0001";
      similarity = 0.99;
    } else if (id > 15 && id <= 18) {
      status = "Near Duplicate";
      duplicateType = "near";
      matchedId = "REC-2024-0005";
      similarity = 0.94;
    } else if (id > 18) {
      status = "Repeated Content";
      duplicateType = "repeated";
      matchedId = "REC-2024-0010";
      similarity = 0.91;
    }

    return {
      recordingId,
      candidateId,
      candidateName,
      uploadTime: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
      duration: Math.floor(Math.random() * (600 - 60 + 1) + 60),
      fileSize: Math.floor(Math.random() * (25 * 1024 * 1024 - 1024 * 1024) + 1024 * 1024),
      fileHash: Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      audioFingerprint: Array.from({length: 32}, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      status,
      matchedRecordingId: matchedId,
      similarityScore: similarity,
      duplicateType,
      transcriptText: TRANSCRIPT_SAMPLES[Math.floor(Math.random() * TRANSCRIPT_SAMPLES.length)],
      confidenceScore: (Math.random() * (0.97 - 0.82) + 0.82).toFixed(2),
      language: Math.random() > 0.85 ? "Hindi" : "English",
      transcriptProcessedAt: new Date().toISOString()
    };
  });
};

/**
 * Zustand Store for VoiceCheck
 */
export const useRecordingStore = create((set) => ({
  recordings: generateMockRecordings(),
  selectedRecording: null,
  filterStatus: "all",
  searchQuery: "",

  setSelectedRecording: (recording) => set({ selectedRecording: recording }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
