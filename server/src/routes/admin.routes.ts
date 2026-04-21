import { Router } from 'express';
import { getDepartmentReportHandler, getProgrammingLanguageReportHandler } from '../controllers/report.controller';
import { registerAdminHandler, getAdminsHandler, deleteAdminHandler } from '../controllers/admin.controller';
import { authenticate, requireRole, requireAdminOrSuperadmin } from '../middlewares/auth.middleware';

const router = Router();

// POST /api/admins/register - Register a new admin user (only superadmin can access)
router.post('/register', authenticate, requireRole('superadmin'), registerAdminHandler);

// GET /api/admins/list - Get all admins (only superadmin can access)
router.get('/list', authenticate, requireRole('superadmin'), getAdminsHandler);

// DELETE /api/admins/:id - Delete an admin (only superadmin can access)
router.delete('/:id', authenticate, requireRole('superadmin'), deleteAdminHandler);

// GET /api/admins/report?language=Python - Admin only: get programming language-wise report
router.get(
  '/report',
  authenticate,
  requireAdminOrSuperadmin(),
  getProgrammingLanguageReportHandler,
);

// GET /api/admins/department-report?department=CSE - Admin only: get department-wise report (backward compatibility)
router.get(
  '/department-report',
  authenticate,
  requireAdminOrSuperadmin(),
  getDepartmentReportHandler,
);

export default router;
