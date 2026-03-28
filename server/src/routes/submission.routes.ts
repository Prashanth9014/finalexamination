import { Router } from 'express';
import {
  startExamHandler,
  submitExamHandler,
  saveCodingAnswerHandler,
  saveMcqAnswerHandler,
  getSavedAnswersHandler,
  getMySubmissionsHandler,
  getSubmissionByIdHandler,
  getAllSubmissionsHandler,
  getRemainingTimeHandler,
  resetCandidateAttemptHandler,
} from '../controllers/submission.controller';
import { authenticate, requireRole, requireAdminOrSuperadmin } from '../middlewares/auth.middleware';

const router = Router();

// POST /api/submissions/start/:examId - Candidate only: start exam attempt
router.post(
  '/start/:examId',
  authenticate,
  requireRole('candidate'),
  startExamHandler,
);

// POST /api/submissions/submit/:submissionId - Candidate only: submit exam
router.post(
  '/submit/:submissionId',
  authenticate,
  requireRole('candidate'),
  submitExamHandler,
);

// POST /api/submissions/:submissionId/save-code - Candidate only: save coding answer
router.post(
  '/:submissionId/save-code',
  authenticate,
  requireRole('candidate'),
  saveCodingAnswerHandler,
);

// POST /api/submissions/:submissionId/save-mcq - Candidate only: save MCQ answer
router.post(
  '/:submissionId/save-mcq',
  authenticate,
  requireRole('candidate'),
  saveMcqAnswerHandler,
);

// GET /api/submissions/:submissionId/saved-answers - Candidate only: get saved answers
router.get(
  '/:submissionId/saved-answers',
  authenticate,
  requireRole('candidate'),
  getSavedAnswersHandler,
);

// GET /api/submissions/my - Candidate only: get my submissions
router.get(
  '/my',
  authenticate,
  requireRole('candidate'),
  getMySubmissionsHandler,
);

// GET /api/submissions/all - Admin or Superadmin only: get all submissions
router.get(
  '/all',
  authenticate,
  requireAdminOrSuperadmin(),
  getAllSubmissionsHandler,
);

// GET /api/submissions/:submissionId/remaining-time - Candidate only: get remaining exam time
router.get(
  '/:submissionId/remaining-time',
  authenticate,
  requireRole('candidate'),
  getRemainingTimeHandler,
);

// POST /api/submissions/:submissionId/reset - Admin or Superadmin only: reset candidate attempt
router.post(
  '/:submissionId/reset',
  authenticate,
  requireAdminOrSuperadmin(),
  resetCandidateAttemptHandler,
);

// GET /api/submissions/:id - Admin or owner: get submission by ID
router.get(
  '/:id',
  authenticate,
  getSubmissionByIdHandler,
);

export default router;
