import mongoose from 'mongoose';

const TranscriptSchema = new mongoose.Schema({
  recording_id: {
    type: String,
    required: true,
    index: true
  },
  transcript_text: {
    type: String,
    default: ''
  },
  confidence_score: {
    type: Number,
    required: true
  },
  language: {
    type: String,
    default: 'English'
  },
  transcript_processed_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Transcript = mongoose.model('Transcript', TranscriptSchema);
export default Transcript;
