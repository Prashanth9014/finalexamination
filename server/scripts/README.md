# Database Cleanup Scripts

## Submission Cleanup Script

### Purpose
Fixes the "previous exam (details unavailable)" error by removing submissions that reference deleted exams.

### What It Does
1. **Scans all submissions** in the database
2. **Checks each examId reference** to verify the exam still exists
3. **Safely deletes orphaned submissions** where the referenced exam was deleted
4. **Preserves all valid submissions** with existing exam references
5. **Provides detailed logging** of all operations

### Safety Features
- ✅ **Read-only verification** before any deletions
- ✅ **Detailed logging** of every submission checked
- ✅ **Error handling** for edge cases
- ✅ **No application logic changes** - only data cleanup
- ✅ **Preserves valid data** - only removes broken references

### How to Run

#### Method 1: Using npm script (Recommended)
```bash
cd server
npm run cleanup-submissions
```

#### Method 2: Direct execution
```bash
cd server
npx ts-node scripts/cleanupSubmissions.ts
```

### Expected Output
```
🚀 Submission Cleanup Script
============================

🔌 Connecting to MongoDB...
✅ Connected to MongoDB

🔍 Starting submission cleanup process...
=====================================
📊 Total submissions found: 15

❌ Orphaned submission found:
   Submission ID: 507f1f77bcf86cd799439011
   User ID: 507f191e810c19729de860ea
   Exam ID: 507f1f77bcf86cd799439012 (DELETED)
   Status: submitted
   Exam Title: JavaScript Fundamentals
   ✅ Deleted orphaned submission

📈 CLEANUP SUMMARY
==================
Total submissions checked: 15
Invalid submissions found: 3
Submissions deleted: 3
Errors encountered: 0

✅ Cleanup completed successfully!
   The "previous exam (details unavailable)" issue should now be resolved.
   Only submissions with valid exam references remain in the database.

🔒 SAFETY NOTES:
- Only submissions with broken examId references were deleted
- All valid submissions remain intact
- No application logic was modified
- Users can create new submissions normally

🔌 MongoDB connection closed
```

### When to Run
- **After seeing "previous exam (details unavailable)" errors**
- **After deleting exams from the admin panel**
- **During database maintenance**
- **Before production deployment** (to clean up test data)

### Impact
- ✅ **Fixes error messages** - No more "previous exam (details unavailable)"
- ✅ **Improves data integrity** - Removes orphaned records
- ✅ **Maintains functionality** - All valid submissions preserved
- ✅ **No downtime required** - Can run while application is running

### Rollback
If you need to restore deleted submissions, you would need to restore from a database backup. The script only deletes submissions where the referenced exam no longer exists, so there's typically no need to rollback.

### Troubleshooting

#### Connection Issues
```bash
# Make sure MongoDB is running
# Check your .env file has correct MONGODB_URI
```

#### Permission Issues
```bash
# Make sure you have write access to the database
# Run with appropriate user permissions
```

#### TypeScript Issues
```bash
# Make sure ts-node is installed
npm install -g ts-node
```