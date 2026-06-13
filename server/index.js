import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import recordingsRouter from './routes/recordings.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || 8000;

// Connect to MongoDB
connectDB();

// Middlewares
app.use(cors({
  origin: '*', // Allows cross-origin testing for Vite development
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Routes
app.use('/api/recordings', recordingsRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

app.listen(PORT, () => {
  console.log(`VoiceCheck Backend Server running on port ${PORT}`);
});
