import express from 'express';
import Recording from '../models/Recording.js';

const router = express.Router();

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

// Helper to generate the exact mock recordings array
const generateMockRecordings = () => {
  const recordings = [];
  for (let i = 0; i < 20; i++) {
    const idNum = i + 1;
    const recordingId = `REC-2024-${idNum.toString().padStart(4, '0')}`;
    const candIndex = i % 10;
    const candidateId = `CAND-${(candIndex + 1).toString().padStart(3, '0')}`;
    const candidateName = INDIAN_NAMES[candIndex];
    
    const uploadTimeDate = new Date(Date.now() - (i * 1.5 * 24 * 60 * 60 * 1000 + Math.random() * 12 * 60 * 60 * 1000));
    const uploadTime = uploadTimeDate.toISOString();
    
    const duration = Math.floor(60 + Math.random() * 540);
    const fileSize = Math.floor(1000000 + Math.random() * 24000000);
    
    const fileHash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const audioFingerprint = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    
    let status = "Unique";
    let duplicateType = null;
    let matchedRecordingId = null;
    let similarityScore = null;
    
    if (i === 12 || i === 13 || i === 14) {
      status = "Exact Duplicate";
      duplicateType = "exact";
      matchedRecordingId = `REC-2024-000${(i - 11)}`;
      similarityScore = 0.99;
    } else if (i === 15 || i === 16 || i === 17) {
      status = "Near Duplicate";
      duplicateType = "near";
      matchedRecordingId = `REC-2024-000${(i - 10)}`;
      similarityScore = parseFloat((0.92 + Math.random() * 0.05).toFixed(2));
    } else if (i === 18 || i === 19) {
      status = "Repeated Content";
      duplicateType = "repeated";
      matchedRecordingId = `REC-2024-000${(i - 9)}`;
      similarityScore = parseFloat((0.91 + Math.random() * 0.02).toFixed(2));
    }
    
    const transcriptText = TRANSCRIPT_SAMPLES[i % TRANSCRIPT_SAMPLES.length];
    const confidenceScore = parseFloat((0.82 + Math.random() * 0.15).toFixed(2));
    const language = (i === 3 || i === 7 || i === 11) ? "Hindi" : "English";
    const transcriptProcessedAt = new Date(uploadTimeDate.getTime() + 120000).toISOString();
    
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

// Seed route
router.post('/seed', async (req, res) => {
  try {
    const count = await Recording.countDocuments();
    if (count > 0) {
      return res.status(200).json({ message: 'Database already has data. Seeding skipped.', count });
    }
    
    const mockRecs = generateMockRecordings();
    const seeded = await Recording.insertMany(mockRecs);
    res.status(201).json({ message: 'Database successfully seeded with mock recordings.', count: seeded.length });
  } catch (error) {
    console.error(`Seeding error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// GET all recordings
router.get('/', async (req, res) => {
  try {
    const recordings = await Recording.find().sort({ uploadTime: -1 });
    res.json(recordings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST a new recording
router.post('/', async (req, res) => {
  try {
    const newRecording = new Recording(req.body);
    const saved = await newRecording.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE a recording by recordingId
router.delete('/:recordingId', async (req, res) => {
  try {
    const result = await Recording.findOneAndDelete({ recordingId: req.params.recordingId });
    if (!result) {
      return res.status(404).json({ error: 'Recording not found.' });
    }
    res.json({ message: 'Recording successfully deleted.', recordingId: req.params.recordingId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
