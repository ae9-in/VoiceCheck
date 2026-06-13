import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

// Auto-seed default administrator account
async function seedAdminUser() {
  try {
    const adminEmail = 'admin@voicecheck.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (!existingAdmin) {
      console.log('Default administrator account not found. Seeding credentials...');
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('adminPassword@12345', salt);
      
      const admin = new User({
        name: 'VoiceCheck Administrator',
        email: adminEmail,
        password: hashedPassword
      });
      
      await admin.save();
      console.log('Default administrator account successfully created and saved to DB.');
    } else {
      console.log('Default administrator account already present in database.');
    }
  } catch (err) {
    console.error(`Failed to seed administrator account: ${err.message}`);
  }
}

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
    
    // Seed admin credentials
    await seedAdminUser();
  } catch (error) {
    console.error(`Failed to establish MongoDB connection: ${error.message}`);
    process.exit(1);
  }
}
