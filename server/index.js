import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import recordingsRouter from './routes/recordings.js';
import authRouter from './routes/auth.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || 8000;

// Connect to MongoDB, then run startup migrations
connectDB().then(async () => {
  // Drop any legacy camelCase indexes left over from old schema versions.
  // These stale unique indexes cause E11000 duplicate key errors because the
  // field they index (e.g. "recordingId") no longer exists in the schema,
  // so every document gets null stored there → collides on the 2nd insert.
  const LEGACY_INDEXES_TO_DROP = [
    { collection: 'recordings',       index: 'recordingId_1' },
    { collection: 'recordings',       index: 'candidateId_1' },
    { collection: 'transcripts',      index: 'recordingId_1' },
    { collection: 'duplicatemappings',index: 'recordingId_1' },
  ];

  for (const { collection, index } of LEGACY_INDEXES_TO_DROP) {
    try {
      await mongoose.connection.collection(collection).dropIndex(index);
      console.log(`Migration: dropped legacy index "${index}" from "${collection}"`);
    } catch (err) {
      if (err.codeName === 'IndexNotFound' || err.code === 27) {
        // Index doesn't exist — nothing to do
      } else {
        console.warn(`Migration warning (${collection}/${index}):`, err.message);
      }
    }
  }
}).catch(err => {
  console.error('DB connection or migration failed:', err.message);
});

// Middlewares
app.use(cors({
  origin: '*', // Allows cross-origin testing for Vite development
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Routes
app.use('/api/recordings', recordingsRouter);
app.use('/api/auth', authRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

app.listen(PORT, () => {
  console.log(`VoiceCheck Backend Server running on port ${PORT}`);
});
