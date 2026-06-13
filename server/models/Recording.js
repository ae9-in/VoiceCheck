import mongoose from 'mongoose';

const RecordingSchema = new mongoose.Schema({
  recording_id: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  candidate_id: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  candidate_name: {
    type: String,
    required: true,
    trim: true
  },
  upload_time: {
    type: Date,
    default: Date.now
  },
  duration_seconds: {
    type: Number,
    required: true
  },
  file_size: {
    type: Number,
    required: true
  },
  file_hash: {
    type: String,
    required: true
  },
  audio_fingerprint: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['Unique', 'Exact Duplicate', 'Near Duplicate', 'Repeated Content', 'Processing Failed']
  }
}, {
  timestamps: true
});

const Recording = mongoose.model('Recording', RecordingSchema);
export default Recording;
