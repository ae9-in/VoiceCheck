import express from 'express';
import Recording from '../models/Recording.js';
import Transcript from '../models/Transcript.js';
import DuplicateMapping from '../models/DuplicateMapping.js';

const router = express.Router();

// GET all recordings (with $lookup joins to fetch transcript and duplicate data)
router.get('/', async (req, res) => {
  try {
    const recordings = await Recording.aggregate([
      {
        $lookup: {
          from: 'transcripts',
          localField: 'recording_id',
          foreignField: 'recording_id',
          as: 'transcript'
        }
      },
      {
        $lookup: {
          from: 'duplicatemappings',
          localField: 'recording_id',
          foreignField: 'recording_id',
          as: 'duplicateMapping'
        }
      },
      {
        $sort: { upload_time: -1 }
      }
    ]);

    const formatted = recordings.map(rec => {
      const transcriptObj = rec.transcript[0] || {};
      const dupObj = rec.duplicateMapping[0] || {};
      return {
        recordingId: rec.recording_id,
        candidateId: rec.candidate_id,
        candidateName: rec.candidate_name,
        uploadTime: rec.upload_time,
        duration: rec.duration_seconds,
        fileSize: rec.file_size,
        fileHash: rec.file_hash,
        audioFingerprint: rec.audio_fingerprint,
        status: rec.status,
        matchedRecordingId: dupObj.matched_recording_id || null,
        similarityScore: dupObj.similarity_score || null,
        duplicateType: dupObj.duplicate_type || null,
        transcriptText: transcriptObj.transcript_text || '',
        confidenceScore: transcriptObj.confidence_score || 0,
        language: transcriptObj.language || 'English',
        transcriptProcessedAt: transcriptObj.transcript_processed_at || null
      };
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST a new recording (saves across all 3 tables)
router.post('/', async (req, res) => {
  try {
    const {
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
    } = req.body;

    const newRecording = new Recording({
      recording_id: recordingId,
      candidate_id: candidateId,
      candidate_name: candidateName,
      upload_time: uploadTime || new Date(),
      duration_seconds: duration,
      file_size: fileSize,
      file_hash: fileHash,
      audio_fingerprint: audioFingerprint,
      status: status
    });
    await newRecording.save();

    const newTranscript = new Transcript({
      recording_id: recordingId,
      transcript_text: transcriptText || '',
      confidence_score: confidenceScore || 0,
      language: language || 'English',
      transcript_processed_at: transcriptProcessedAt || new Date()
    });
    await newTranscript.save();

    if (status !== 'Unique' && matchedRecordingId) {
      const newDup = new DuplicateMapping({
        recording_id: recordingId,
        matched_recording_id: matchedRecordingId,
        similarity_score: similarityScore,
        duplicate_type: duplicateType
      });
      await newDup.save();
    }

    res.status(201).json(req.body);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE a recording by recordingId (removes from all 3 tables)
router.delete('/:recordingId', async (req, res) => {
  try {
    const recId = req.params.recordingId;
    
    const result = await Recording.findOneAndDelete({ recording_id: recId });
    if (!result) {
      return res.status(404).json({ error: 'Recording not found.' });
    }
    
    await Transcript.deleteMany({ recording_id: recId });
    await DuplicateMapping.deleteMany({ recording_id: recId });
    
    res.json({ message: 'Recording successfully deleted from all tables.', recordingId: recId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
