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
  },
  transcript_status: {
    type: String,
    enum: ['completed', 'skipped', 'failed'],
    default: 'skipped'
  },
  cloudinary_url: {
    type: String,
    trim: true
  },
  cloudinary_public_id: {
    type: String,
    trim: true
  },
  transcript_embedding: {
    type: [Number]
  },
  uploaded_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  }
}, {
  timestamps: true
});

const Recording = mongoose.model('Recording', RecordingSchema);
export default Recording;
