import mongoose from 'mongoose';

const DuplicateMappingSchema = new mongoose.Schema({
  recording_id: {
    type: String,
    required: true,
    index: true
  },
  matched_recording_id: {
    type: String,
    required: true
  },
  similarity_score: {
    type: Number,
    required: true
  },
  duplicate_type: {
    type: String,
    required: true,
    enum: ['exact', 'near', 'repeated']
  }
}, {
  timestamps: true
});

const DuplicateMapping = mongoose.model('DuplicateMapping', DuplicateMappingSchema);
export default DuplicateMapping;
