import { Router } from 'express';
import {
  createExamHandler,
  getAllExamsHandler,
  getExamByIdHandler,
  updateExamHandler,
  deleteExamHandler,
  getExamForAttemptHandler,
  createDraftExamHandler,
  updateDraftExamHandler,
  publishDraftExamHandler,
  getDraftExamHandler,
} from '../controllers/exam.controller';
import { authenticate, requireRole, requireAdminOrSuperadmin } from '../middlewares/auth.middleware';

const router = Router();

// POST /api/exams - Admin or Superadmin only: create exam
router.post(
  '/',
  authenticate,
  requireAdminOrSuperadmin(),
  createExamHandler,
);

// Draft Exam Routes
// POST /api/exams/draft - Admin or Superadmin only: create draft exam
router.post(
  '/draft',
  authenticate,
  requireAdminOrSuperadmin(),
  createDraftExamHandler,
);

// GET /api/exams/draft/:id - Admin or Superadmin only: get draft exam
router.get(
  '/draft/:id',
  authenticate,
  requireAdminOrSuperadmin(),
  getDraftExamHandler,
);

// PUT /api/exams/draft/:id - Admin or Superadmin only: update draft exam
router.put(
  '/draft/:id',
  authenticate,
  requireAdminOrSuperadmin(),
  updateDraftExamHandler,
);

// POST /api/exams/draft/:id/publish - Admin or Superadmin only: publish draft exam
router.post(
  '/draft/:id/publish',
  authenticate,
  requireAdminOrSuperadmin(),
  publishDraftExamHandler,
);

// GET /api/exams - Authenticated users: get all exams
router.get(
  '/',
  authenticate,
  getAllExamsHandler,
);

// GET /api/exams/:id/attempt - Candidate only: get sanitized exam for attempt
router.get(
  '/:id/attempt',
  authenticate,
  requireRole('candidate'),
  getExamForAttemptHandler,
);

// GET /api/exams/:id - Authenticated users: get exam by ID
router.get(
  '/:id',
  authenticate,
  getExamByIdHandler,
);

// PUT /api/exams/:id - Admin or Superadmin only: update exam
router.put(
  '/:id',
  authenticate,
  requireAdminOrSuperadmin(),
  updateExamHandler,
);

// DELETE /api/exams/:id - Admin or Superadmin only: delete exam
router.delete(
  '/:id',
  authenticate,
  requireAdminOrSuperadmin(),
  deleteExamHandler,
);

export default router;
