import mongoose from 'mongoose';

const RecordingSchema = new mongoose.Schema({
  recordingId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  candidateId: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  candidateName: {
    type: String,
    required: true,
    trim: true
  },
  uploadTime: {
    type: Date,
    default: Date.now
  },
  duration: {
    type: Number,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  fileHash: {
    type: String,
    required: true
  },
  audioFingerprint: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['Unique', 'Exact Duplicate', 'Near Duplicate', 'Repeated Content', 'Processing']
  },
  matchedRecordingId: {
    type: String,
    default: null
  },
  similarityScore: {
    type: Number,
    default: null
  },
  duplicateType: {
    type: String,
    enum: ['exact', 'near', 'repeated', null],
    default: null
  },
  transcriptText: {
    type: String,
    default: ''
  },
  confidenceScore: {
    type: Number,
    required: true
  },
  language: {
    type: String,
    default: 'English'
  },
  transcriptProcessedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

const Recording = mongoose.model('Recording', RecordingSchema);
export default Recording;
