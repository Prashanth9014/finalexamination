import mongoose from 'mongoose';
import type { Response, NextFunction } from 'express';
import {
  startExam,
  submitExam,
  saveCodingAnswer,
  saveMcqAnswer,
  getSavedAnswers,
  getMySubmissions,
  getSubmissionById,
  getAllSubmissions,
  resetCandidateAttempt,
  type SubmitExamInput,
  type SaveCodingAnswerInput,
  type SaveMcqAnswerInput,
} from '../services/submission.service';
import type { AuthRequest } from '../middlewares/auth.middleware';

export async function startExamHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    console.log('=== START EXAM HANDLER ===');
    console.log('Request params:', req.params);
    console.log('examId from params:', req.params.examId);
    console.log('User:', req.user);
    
    const { examId } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user!.userId);

    console.log('Calling startExam service with examId:', examId);
    const result = await startExam(examId, userId);

    console.log('startExam service returned successfully');
    console.log('Submission created/found:', result.submission._id);
    console.log('=== END START EXAM HANDLER ===');

    res.status(200).json({
      message: 'Exam started successfully',
      submission: result.submission,
      exam: result.exam,
    });
  } catch (error) {
    console.error('=== START EXAM HANDLER ERROR ===');
    console.error('Error:', error);
    console.error('=== END ERROR ===');
    
    if (error instanceof Error) {
      const knownErrors = [
        'Invalid exam ID',
        'Exam not found',
        'Exam has not started yet',
        'Exam has already ended',
        'You have already attempted this exam',
        'You have already submitted this exam',
      ];
      if (knownErrors.includes(error.message)) {
        res.status(400).json({ message: error.message });
        return;
      }
    }
    next(error);
  }
}

export async function submitExamHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { submissionId } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user!.userId);
    const { answers } = req.body;

    if (!Array.isArray(answers)) {
      res.status(400).json({ message: 'Answers must be an array' });
      return;
    }

    const input: SubmitExamInput = { answers };
    const submission = await submitExam(submissionId, userId, input);

    res.status(200).json({
      message: 'Exam submitted successfully',
      submission,
    });
  } catch (error) {
    if (error instanceof Error) {
      const knownErrors = [
        'Invalid submission ID',
        'Submission not found',
        'Submission already completed',
        'Associated exam not found',
      ];
      if (knownErrors.includes(error.message)) {
        res.status(400).json({ message: error.message });
        return;
      }
      if (error.message.includes('Unauthorized')) {
        res.status(403).json({ message: error.message });
        return;
      }
    }
    next(error);
  }
}

export async function saveCodingAnswerHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    console.log('=== SAVE CODING ANSWER HANDLER ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Submission ID:', req.params.submissionId);
    console.log('User ID:', req.user!.userId);
    
    const { submissionId } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user!.userId);
    const { questionId, language, code, executed } = req.body;

    console.log('Parsed data:', {
      questionId,
      language,
      codeLength: code?.length,
      codePreview: code?.substring(0, 50),
      executed
    });

    if (!questionId || !language || !code) {
      console.log('❌ Missing required fields');
      res.status(400).json({ message: 'Missing required fields: questionId, language, code' });
      return;
    }

    const input: SaveCodingAnswerInput = {
      questionId,
      language,
      code,
      executed: executed || false,
    };

    console.log('Calling saveCodingAnswer service...');
    const submission = await saveCodingAnswer(submissionId, userId, input);
    
    console.log('✅ Code saved successfully!');
    console.log('Submission answers count:', submission.answers.length);
    console.log('Saved answer:', submission.answers.find(a => a.questionId === questionId));
    console.log('=== END SAVE CODING ANSWER HANDLER ===');

    res.status(200).json({
      message: 'Coding answer saved successfully',
      submission,
    });
  } catch (error) {
    console.error('=== SAVE CODING ANSWER ERROR ===');
    console.error('Error:', error);
    console.error('=== END ERROR ===');
    
    if (error instanceof Error) {
      const knownErrors = [
        'Invalid submission ID',
        'Submission not found',
        'Cannot save code after submission is completed',
      ];
      if (knownErrors.includes(error.message)) {
        res.status(400).json({ message: error.message });
        return;
      }
      if (error.message.includes('Unauthorized')) {
        res.status(403).json({ message: error.message });
        return;
      }
    }
    next(error);
  }
}

export async function saveMcqAnswerHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    console.log('=== SAVE MCQ ANSWER HANDLER ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Submission ID:', req.params.submissionId);
    console.log('User ID:', req.user!.userId);
    
    const { submissionId } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user!.userId);
    const { questionId, selectedOption } = req.body;

    console.log('Parsed data:', {
      questionId,
      selectedOption
    });

    if (!questionId || !selectedOption) {
      console.log('❌ Missing required fields');
      res.status(400).json({ message: 'Missing required fields: questionId, selectedOption' });
      return;
    }

    const input: SaveMcqAnswerInput = {
      questionId,
      selectedOption,
    };

    console.log('Calling saveMcqAnswer service...');
    const submission = await saveMcqAnswer(submissionId, userId, input);
    
    console.log('✅ MCQ answer saved successfully!');
    console.log('=== END SAVE MCQ ANSWER HANDLER ===');

    res.status(200).json({
      message: 'MCQ answer saved successfully',
      submission,
    });
  } catch (error) {
    console.error('=== SAVE MCQ ANSWER ERROR ===');
    console.error('Error:', error);
    console.error('=== END ERROR ===');
    
    if (error instanceof Error) {
      const knownErrors = [
        'Invalid submission ID',
        'Submission not found',
        'Cannot save answer after submission is completed',
      ];
      if (knownErrors.includes(error.message)) {
        res.status(400).json({ message: error.message });
        return;
      }
      if (error.message.includes('Unauthorized')) {
        res.status(403).json({ message: error.message });
        return;
      }
    }
    next(error);
  }
}

export async function getSavedAnswersHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    console.log('=== GET SAVED ANSWERS HANDLER ===');
    console.log('Submission ID:', req.params.submissionId);
    console.log('User ID:', req.user!.userId);
    
    const { submissionId } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user!.userId);

    console.log('Calling getSavedAnswers service...');
    const answers = await getSavedAnswers(submissionId, userId);
    
    console.log('✅ Retrieved', answers.length, 'saved answers');
    console.log('=== END GET SAVED ANSWERS HANDLER ===');

    res.status(200).json({
      message: 'Saved answers retrieved successfully',
      answers,
    });
  } catch (error) {
    console.error('=== GET SAVED ANSWERS ERROR ===');
    console.error('Error:', error);
    console.error('=== END ERROR ===');
    
    if (error instanceof Error) {
      const knownErrors = [
        'Invalid submission ID',
        'Submission not found',
      ];
      if (knownErrors.includes(error.message)) {
        res.status(400).json({ message: error.message });
        return;
      }
      if (error.message.includes('Unauthorized')) {
        res.status(403).json({ message: error.message });
        return;
      }
    }
    next(error);
  }
}

export async function getMySubmissionsHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.userId);
    const submissions = await getMySubmissions(userId);

    // Disable caching to ensure fresh data is always fetched
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
      'ETag': '' // Remove ETag to prevent 304 responses
    });

    res.json(submissions);
  } catch (error) {
    next(error);
  }
}

export async function getSubmissionByIdHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    console.log('\n=== GET SUBMISSION BY ID HANDLER ===');
    console.log('Request params:', req.params);
    console.log('User:', req.user);
    
    const { id } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user!.userId);
    const userRole = req.user!.role;

    const submission = await getSubmissionById(id, userId, userRole);

    if (!submission) {
      console.log('❌ Submission not found, returning 404');
      res.status(404).json({ message: 'Submission not found' });
      return;
    }

    console.log('✅ Returning submission data');
    console.log('Response data preview:');
    console.log('  - Submission ID:', submission._id);
    console.log('  - Status:', submission.status);
    console.log('  - Answers count:', submission.answers?.length || 0);

    // Disable caching to ensure fresh data is always fetched
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
      'ETag': '' // Remove ETag to prevent 304 responses
    });

    console.log('=== END GET SUBMISSION BY ID HANDLER ===\n');
    res.json(submission);
  } catch (error) {
    console.error('=== GET SUBMISSION BY ID ERROR ===');
    console.error('Error:', error);
    console.error('=== END ERROR ===\n');
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      res.status(403).json({ message: error.message });
      return;
    }
    next(error);
  }
}

export async function getAllSubmissionsHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    console.log('\n=== GET ALL SUBMISSIONS HANDLER ===');
    console.log('User:', req.user);
    
    const submissions = await getAllSubmissions();
    
    console.log(`✅ Returning ${submissions.length} submissions`);
    
    // Disable caching to ensure fresh data is always fetched
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
      'ETag': '' // Remove ETag to prevent 304 responses
    });

    console.log('=== END GET ALL SUBMISSIONS HANDLER ===\n');
    res.json(submissions);
  } catch (error) {
    console.error('=== GET ALL SUBMISSIONS ERROR ===');
    console.error('Error:', error);
    console.error('=== END ERROR ===\n');
    next(error);
  }
}

export async function getRemainingTimeHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    console.log('\n=== GET REMAINING TIME HANDLER ===');
    const { submissionId } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user!.userId);

    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      res.status(400).json({ message: 'Invalid submission ID' });
      return;
    }

    const { Submission } = await import('../models/Submission');
    const { Exam } = await import('../models/Exam');

    const submission = await Submission.findById(submissionId).exec();
    if (!submission) {
      res.status(404).json({ message: 'Submission not found' });
      return;
    }

    // Verify ownership
    if (submission.userId.toString() !== userId.toString()) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }

    // If already submitted, return 0
    if (submission.status === 'submitted') {
      res.json({ remainingSeconds: 0, message: 'Exam already submitted' });
      return;
    }

    const exam = await Exam.findById(submission.examId).exec();
    if (!exam) {
      res.status(404).json({ message: 'Exam not found' });
      return;
    }

    // Calculate remaining time based on server time
    const now = new Date();
    const elapsedMs = now.getTime() - submission.startedAt.getTime();
    const totalMs = exam.duration * 60 * 1000; // Convert minutes to milliseconds
    const remainingMs = Math.max(0, totalMs - elapsedMs);
    const remainingSeconds = Math.ceil(remainingMs / 1000);

    console.log(`Exam duration: ${exam.duration} minutes`);
    console.log(`Started at: ${submission.startedAt}`);
    console.log(`Current time: ${now}`);
    console.log(`Elapsed: ${elapsedMs}ms`);
    console.log(`Remaining: ${remainingSeconds}s`);
    console.log('=== END GET REMAINING TIME HANDLER ===\n');

    res.json({ remainingSeconds });
  } catch (error) {
    console.error('=== GET REMAINING TIME ERROR ===');
    console.error('Error:', error);
    console.error('=== END ERROR ===\n');
    next(error);
  }
}

export async function resetCandidateAttemptHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    console.log('\n=== RESET CANDIDATE ATTEMPT HANDLER ===');
    console.log('Request params:', req.params);
    console.log('Admin user:', req.user);
    
    const { submissionId } = req.params;
    const adminUserId = new mongoose.Types.ObjectId(req.user!.userId);

    const success = await resetCandidateAttempt(submissionId, adminUserId);

    if (success) {
      console.log('✅ Candidate attempt reset successfully');
      res.json({ 
        message: 'Candidate attempt has been reset successfully. They can now reattempt the exam.',
        success: true 
      });
    } else {
      console.log('❌ Failed to reset candidate attempt');
      res.status(400).json({ message: 'Failed to reset candidate attempt' });
    }

    console.log('=== END RESET CANDIDATE ATTEMPT HANDLER ===\n');
  } catch (error) {
    console.error('=== RESET CANDIDATE ATTEMPT ERROR ===');
    console.error('Error:', error);
    console.error('=== END ERROR ===\n');
    
    if (error instanceof Error) {
      const knownErrors = [
        'Invalid submission ID',
        'Submission not found',
      ];
      if (knownErrors.includes(error.message)) {
        res.status(400).json({ message: error.message });
        return;
      }
    }
    next(error);
  }
}