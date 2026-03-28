import mongoose from 'mongoose';
import { Exam } from './src/models/Exam';
import { loadEnv } from './src/config/env';

const env = loadEnv();

async function testExamCreation() {
  try {
    console.log('=== EXAM CREATION TEST ===');
    console.log('Connecting to MongoDB...');
    console.log('URI:', env.MONGODB_URI);
    
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB');
    console.log('Database:', mongoose.connection.db?.databaseName || 'unknown');
    console.log('Collection:', Exam.collection.name);
    
    // Count existing exams
    const beforeCount = await Exam.countDocuments();
    console.log('\nExams before test:', beforeCount);
    
    // Create test exam
    console.log('\nCreating test exam...');
    const testExam = {
      title: 'TEST-EXAM-' + Date.now(),
      description: 'Test exam for debugging',
      startTime: new Date(),
      endTime: new Date(Date.now() + 60 * 60 * 1000),
      duration: 60,
      createdBy: new mongoose.Types.ObjectId(),
      sections: [
        {
          title: 'Test Section',
          questions: [
            {
              type: 'mcq' as const,
              question: 'Test question?',
              options: ['A', 'B', 'C', 'D'],
              correctAnswer: 'A',
              marks: 5,
            },
          ],
        },
      ],
    };
    
    console.log('Test exam data:', JSON.stringify(testExam, null, 2));
    
    const exam = await Exam.create(testExam);
    console.log('\nExam created!');
    console.log('Exam ID:', exam._id);
    console.log('Exam title:', exam.title);
    console.log('Exam isNew:', exam.isNew);
    
    // Verify it was saved
    const savedExam = await Exam.findById(exam._id);
    console.log('\nVerification:');
    console.log('Found in DB:', !!savedExam);
    if (savedExam) {
      console.log('Title from DB:', savedExam.title);
    }
    
    // Count after
    const afterCount = await Exam.countDocuments();
    console.log('\nExams after test:', afterCount);
    console.log('Difference:', afterCount - beforeCount);
    
    // List all exams
    const allExams = await Exam.find().select('title createdAt').sort({ createdAt: -1 }).limit(5);
    console.log('\nLast 5 exams:');
    allExams.forEach((e, i) => {
      console.log(`${i + 1}. ${e.title} (${e.createdAt})`);
    });
    
    console.log('\n=== TEST COMPLETE ===');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n=== TEST ERROR ===');
    console.error('Error:', error);
    if (error instanceof Error) {
      console.error('Name:', error.name);
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
    await mongoose.connection.close();
    process.exit(1);
  }
}

testExamCreation();
