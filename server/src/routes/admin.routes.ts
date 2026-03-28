import { Router } from 'express';
import { getDepartmentReportHandler, getProgrammingLanguageReportHandler } from '../controllers/report.controller';
import { registerAdminHandler, getAdminsHandler, deleteAdminHandler } from '../controllers/admin.controller';
import { authenticate, requireRole, requireAdminOrSuperadmin } from '../middlewares/auth.middleware';

const router = Router();

// POST /api/admin/register - Register a new admin user (requires secret key)
router.post('/register', registerAdminHandler);

// POST /api/admins/list - Get all admins (requires secret key)
router.post('/list', getAdminsHandler);

// DELETE /api/admins/:id - Delete an admin (requires secret key)
router.delete('/:id', deleteAdminHandler);

// GET /api/admin/report?language=Python - Admin only: get programming language-wise report
router.get(
  '/report',
  authenticate,
  requireAdminOrSuperadmin(),
  getProgrammingLanguageReportHandler,
);

// GET /api/admin/department-report?department=CSE - Admin only: get department-wise report (backward compatibility)
router.get(
  '/department-report',
  authenticate,
  requireAdminOrSuperadmin(),
  getDepartmentReportHandler,
);

export default router;
