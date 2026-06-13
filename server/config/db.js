import mongoose from 'mongoose';

export default async function connectDB() {
  try {
    const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/voicecheck';
    
    mongoose.connection.on('connected', () => {
      console.log('MongoDB successfully connected.');
    });

    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected.');
    });

    await mongoose.connect(connUri);
  } catch (error) {
    console.error(`Failed to establish MongoDB connection: ${error.message}`);
    process.exit(1);
  }
}
