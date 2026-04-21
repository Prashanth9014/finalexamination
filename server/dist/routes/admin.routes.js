"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const report_controller_1 = require("../controllers/report.controller");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// POST /api/admins/register - Register a new admin user (only superadmin can access)
router.post('/register', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('superadmin'), admin_controller_1.registerAdminHandler);
// GET /api/admins/list - Get all admins (only superadmin can access)
router.get('/list', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('superadmin'), admin_controller_1.getAdminsHandler);
// DELETE /api/admins/:id - Delete an admin (only superadmin can access)
router.delete('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('superadmin'), admin_controller_1.deleteAdminHandler);
// GET /api/admins/report?language=Python - Admin only: get programming language-wise report
router.get('/report', auth_middleware_1.authenticate, (0, auth_middleware_1.requireAdminOrSuperadmin)(), report_controller_1.getProgrammingLanguageReportHandler);
// GET /api/admins/department-report?department=CSE - Admin only: get department-wise report (backward compatibility)
router.get('/department-report', auth_middleware_1.authenticate, (0, auth_middleware_1.requireAdminOrSuperadmin)(), report_controller_1.getDepartmentReportHandler);
exports.default = router;
