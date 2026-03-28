import { Router } from 'express';
import codeExecutionController from '../controllers/codeExecution.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Execute code
router.post('/run', codeExecutionController.runCode);

// Execute code with test cases
router.post('/test', codeExecutionController.runWithTestCases);

// Check Docker availability
router.get('/docker-status', codeExecutionController.checkDockerStatus);

export default router;
