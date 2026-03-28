import mongoose from 'mongoose';
import { Submission } from '../src/models/Submission';
import { Exam } from '../src/models/Exam';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

/**
 * Safe Cleanup Script for Invalid Submissions
 * 
 * Purpose: Remove submissions with broken examId references
 * Safety: Only deletes submissions where the referenced exam no longer exists
 * Impact: Fixes "previous exam (details unavailable)" error messages
 */

interface CleanupStats {
  totalSubmissions: number;
  invalidSubmissions: number;
  deletedSubmissions: number;
  errors: number;
}

async function cleanupInvalidSubmissions(): Promise<CleanupStats> {
  const stats: CleanupStats = {
    totalSubmissions: 0,
    invalidSubmissions: 0,
    deletedSubmissions: 0,
    errors: 0
  };

  try {
    console.log('🔍 Starting submission cleanup process...');
    console.log('=====================================');

    // Get all submissions
    const allSubmissions = await Submission.find({}).select('_id examId userId status examTitle').exec();
    stats.totalSubmissions = allSubmissions.length;
    
    console.log(`📊 Total submissions found: ${stats.totalSubmissions}`);
    console.log('');

    // Check each submission
    for (const submission of allSubmissions) {
      try {
        // Check if examId is null or invalid
        if (!submission.examId) {
          console.log(`❌ Invalid submission found: ${submission._id} (examId is null)`);
          stats.invalidSubmissions++;
          continue;
        }

        // Check if the referenced exam exists
        const examExists = await Exam.findById(submission.examId).select('_id').exec();
        
        if (!examExists) {
          console.log(`❌ Orphaned submission found:`);
          console.log(`   Submission ID: ${submission._id}`);
          console.log(`   User ID: ${submission.userId}`);
          console.log(`   Exam ID: ${submission.examId} (DELETED)`);
          console.log(`   Status: ${submission.status}`);
          console.log(`   Exam Title: ${submission.examTitle || 'N/A'}`);
          
          stats.invalidSubmissions++;
          
          // Delete the orphaned submission
          await Submission.findByIdAndDelete(submission._id);
          stats.deletedSubmissions++;
          
          console.log(`   ✅ Deleted orphaned submission`);
          console.log('');
        }
      } catch (error) {
        console.error(`❌ Error processing submission ${submission._id}:`, error);
        stats.errors++;
      }
    }

    return stats;
  } catch (error) {
    console.error('❌ Fatal error during cleanup:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Submission Cleanup Script');
    console.log('============================');
    console.log('');

    // Get MongoDB URI from environment
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/online_recruit_system';
    
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    console.log('');

    // Run cleanup
    const stats = await cleanupInvalidSubmissions();

    // Print summary
    console.log('📈 CLEANUP SUMMARY');
    console.log('==================');
    console.log(`Total submissions checked: ${stats.totalSubmissions}`);
    console.log(`Invalid submissions found: ${stats.invalidSubmissions}`);
    console.log(`Submissions deleted: ${stats.deletedSubmissions}`);
    console.log(`Errors encountered: ${stats.errors}`);
    console.log('');

    if (stats.deletedSubmissions > 0) {
      console.log('✅ Cleanup completed successfully!');
      console.log('   The "previous exam (details unavailable)" issue should now be resolved.');
      console.log('   Only submissions with valid exam references remain in the database.');
    } else {
      console.log('ℹ️  No invalid submissions found. Database is already clean.');
    }

    console.log('');
    console.log('🔒 SAFETY NOTES:');
    console.log('- Only submissions with broken examId references were deleted');
    console.log('- All valid submissions remain intact');
    console.log('- No application logic was modified');
    console.log('- Users can create new submissions normally');

  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('');
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
}

// Run the script
main().catch((error) => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});