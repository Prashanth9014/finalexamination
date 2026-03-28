import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from './src/models/User';

const MONGODB_URI = 'mongodb://localhost:27017/online_recruit_system';

const adminData = {
  name: 'Main Admin',
  email: 'admin@gmail.com',
  password: 'admin123',
  role: 'admin' as const,
};

async function createAdmin() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    
    if (existingAdmin) {
      console.log(`Admin user with email "${adminData.email}" already exists.`);
      console.log('Skipping creation.');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Hash password
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    // Create admin user
    console.log('Creating admin user...');
    const admin = await User.create({
      name: adminData.name,
      email: adminData.email,
      password: hashedPassword,
      role: adminData.role,
    });

    console.log('✅ Admin user created successfully!');
    console.log('-----------------------------------');
    console.log('Email:', admin.email);
    console.log('Password:', adminData.password);
    console.log('Role:', admin.role);
    console.log('-----------------------------------');
    console.log('You can now login with these credentials.');

    // Close connection and exit
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
createAdmin();
