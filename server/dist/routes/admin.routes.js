"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const report_controller_1 = require("../controllers/report.controller");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// POST /api/admin/register - Register a new admin user (requires secret key)
router.post('/register', admin_controller_1.registerAdminHandler);
// POST /api/admins/list - Get all admins (requires secret key)
router.post('/list', admin_controller_1.getAdminsHandler);
// DELETE /api/admins/:id - Delete an admin (requires secret key)
router.delete('/:id', admin_controller_1.deleteAdminHandler);
// GET /api/admin/report?language=Python - Admin only: get programming language-wise report
router.get('/report', auth_middleware_1.authenticate, (0, auth_middleware_1.requireAdminOrSuperadmin)(), report_controller_1.getProgrammingLanguageReportHandler);
// GET /api/admin/department-report?department=CSE - Admin only: get department-wise report (backward compatibility)
router.get('/department-report', auth_middleware_1.authenticate, (0, auth_middleware_1.requireAdminOrSuperadmin)(), report_controller_1.getDepartmentReportHandler);
exports.default = router;
