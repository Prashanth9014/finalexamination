"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const submission_controller_1 = require("../controllers/submission.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// POST /api/submissions/start/:examId - Candidate only: start exam attempt
router.post('/start/:examId', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('candidate'), submission_controller_1.startExamHandler);
// POST /api/submissions/submit/:submissionId - Candidate only: submit exam
router.post('/submit/:submissionId', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('candidate'), submission_controller_1.submitExamHandler);
// POST /api/submissions/:submissionId/save-code - Candidate only: save coding answer
router.post('/:submissionId/save-code', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('candidate'), submission_controller_1.saveCodingAnswerHandler);
// GET /api/submissions/my - Candidate only: get my submissions
router.get('/my', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('candidate'), submission_controller_1.getMySubmissionsHandler);
// GET /api/submissions/all - Admin or Superadmin only: get all submissions
router.get('/all', auth_middleware_1.authenticate, (0, auth_middleware_1.requireAdminOrSuperadmin)(), submission_controller_1.getAllSubmissionsHandler);
// GET /api/submissions/:submissionId/remaining-time - Candidate only: get remaining exam time
router.get('/:submissionId/remaining-time', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('candidate'), submission_controller_1.getRemainingTimeHandler);
// POST /api/submissions/:submissionId/reset - Admin or Superadmin only: reset candidate attempt
router.post('/:submissionId/reset', auth_middleware_1.authenticate, (0, auth_middleware_1.requireAdminOrSuperadmin)(), submission_controller_1.resetCandidateAttemptHandler);
// GET /api/submissions/:id - Admin or owner: get submission by ID
router.get('/:id', auth_middleware_1.authenticate, submission_controller_1.getSubmissionByIdHandler);
exports.default = router;
