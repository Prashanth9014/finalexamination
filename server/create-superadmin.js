const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// User Schema (simplified version)
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'admin', 'candidate'], default: 'candidate' },
  department: { type: String, enum: ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'MBA'] },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

async function createSuperadmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if superadmin already exists
    const existingSuperadmin = await User.findOne({ role: 'superadmin' });
    if (existingSuperadmin) {
      console.log('Superadmin already exists:', existingSuperadmin.email);
      process.exit(0);
    }

    // Create superadmin user
    const hashedPassword = await bcrypt.hash('superadmin123', 10);
    
    const superadmin = new User({
      name: 'Super Administrator',
      email: 'superadmin@system.com',
      password: hashedPassword,
      role: 'superadmin'
    });

    await superadmin.save();
    console.log('Superadmin created successfully!');
    console.log('Email: superadmin@system.com');
    console.log('Password: superadmin123');
    console.log('Please change the password after first login.');

  } catch (error) {
    console.error('Error creating superadmin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createSuperadmin();