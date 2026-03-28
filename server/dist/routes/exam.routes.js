"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const exam_controller_1 = require("../controllers/exam.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// POST /api/exams - Admin or Superadmin only: create exam
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.requireAdminOrSuperadmin)(), exam_controller_1.createExamHandler);
// Draft Exam Routes
// POST /api/exams/draft - Admin or Superadmin only: create draft exam
router.post('/draft', auth_middleware_1.authenticate, (0, auth_middleware_1.requireAdminOrSuperadmin)(), exam_controller_1.createDraftExamHandler);
// GET /api/exams/draft/:id - Admin or Superadmin only: get draft exam
router.get('/draft/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.requireAdminOrSuperadmin)(), exam_controller_1.getDraftExamHandler);
// PUT /api/exams/draft/:id - Admin or Superadmin only: update draft exam
router.put('/draft/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.requireAdminOrSuperadmin)(), exam_controller_1.updateDraftExamHandler);
// POST /api/exams/draft/:id/publish - Admin or Superadmin only: publish draft exam
router.post('/draft/:id/publish', auth_middleware_1.authenticate, (0, auth_middleware_1.requireAdminOrSuperadmin)(), exam_controller_1.publishDraftExamHandler);
// GET /api/exams - Authenticated users: get all exams
router.get('/', auth_middleware_1.authenticate, exam_controller_1.getAllExamsHandler);
// GET /api/exams/:id/attempt - Candidate only: get sanitized exam for attempt
router.get('/:id/attempt', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('candidate'), exam_controller_1.getExamForAttemptHandler);
// GET /api/exams/:id - Authenticated users: get exam by ID
router.get('/:id', auth_middleware_1.authenticate, exam_controller_1.getExamByIdHandler);
// PUT /api/exams/:id - Admin or Superadmin only: update exam
router.put('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.requireAdminOrSuperadmin)(), exam_controller_1.updateExamHandler);
// DELETE /api/exams/:id - Admin or Superadmin only: delete exam
router.delete('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.requireAdminOrSuperadmin)(), exam_controller_1.deleteExamHandler);
exports.default = router;
