// Migration script to populate missing examTitle fields
// Run this once to fix existing submissions

const mongoose = require('mongoose');

async function migrateExamTitles() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/online-recruit-system');
    
    console.log('Connected to MongoDB');
    
    // Get submissions without examTitle
    const submissions = await mongoose.connection.db.collection('submissions').find({
      examTitle: { $exists: false }
    }).toArray();
    
    console.log(`Found ${submissions.length} submissions without examTitle`);
    
    for (const submission of submissions) {
      try {
        // Try to get exam title
        const exam = await mongoose.connection.db.collection('exams').findOne({
          _id: submission.examId
        });
        
        if (exam && exam.title) {
          // Update submission with exam title
          await mongoose.connection.db.collection('submissions').updateOne(
            { _id: submission._id },
            { $set: { examTitle: exam.title } }
          );
          console.log(`Updated submission ${submission._id} with title: ${exam.title}`);
        } else {
          // Exam was deleted, set a generic title
          await mongoose.connection.db.collection('submissions').updateOne(
            { _id: submission._id },
            { $set: { examTitle: 'Previous Exam (Deleted)' } }
          );
          console.log(`Updated submission ${submission._id} with fallback title`);
        }
      } catch (error) {
        console.error(`Error updating submission ${submission._id}:`, error);
      }
    }
    
    console.log('Migration completed');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateExamTitles();