"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const codeExecution_controller_1 = __importDefault(require("../controllers/codeExecution.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
// Execute code
router.post('/run', codeExecution_controller_1.default.runCode);
// Execute code with test cases
router.post('/test', codeExecution_controller_1.default.runWithTestCases);
// Check Docker availability
router.get('/docker-status', codeExecution_controller_1.default.checkDockerStatus);
exports.default = router;
