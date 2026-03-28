"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const codeExecution_service_1 = __importDefault(require("../services/codeExecution.service"));
class CodeExecutionController {
    async runCode(req, res) {
        try {
            const { language, code, input } = req.body;
            // Validation
            if (!language || !code) {
                res.status(400).json({
                    success: false,
                    message: 'Language and code are required',
                });
                return;
            }
            // Validate language
            const supportedLanguages = ['python', 'javascript', 'c', 'cpp', 'java'];
            if (!supportedLanguages.includes(language.toLowerCase())) {
                res.status(400).json({
                    success: false,
                    message: `Unsupported language. Supported: ${supportedLanguages.join(', ')}`,
                });
                return;
            }
            // Execute code
            const result = await codeExecution_service_1.default.executeCode({
                language,
                code,
                input: input || '',
            });
            res.status(200).json({
                success: true,
                output: result.output,
                error: result.error,
                executionTime: result.executionTime,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Code execution failed',
                error: error.message,
            });
        }
    }
    async runWithTestCases(req, res) {
        try {
            const { language, code, testCases } = req.body;
            // Validation
            if (!language || !code || !testCases) {
                res.status(400).json({
                    success: false,
                    message: 'Language, code, and testCases are required',
                });
                return;
            }
            // Validate language
            const supportedLanguages = ['python', 'javascript', 'c', 'cpp', 'java'];
            if (!supportedLanguages.includes(language.toLowerCase())) {
                res.status(400).json({
                    success: false,
                    message: `Unsupported language. Supported: ${supportedLanguages.join(', ')}`,
                });
                return;
            }
            // Validate test cases
            if (!Array.isArray(testCases) || testCases.length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'Test cases must be a non-empty array',
                });
                return;
            }
            // Execute code with test cases
            const result = await codeExecution_service_1.default.executeWithTestCases({
                language,
                code,
                testCases,
            });
            res.status(200).json({
                success: true,
                ...result,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Test execution failed',
                error: error.message,
            });
        }
    }
    async checkDockerStatus(req, res) {
        try {
            const isAvailable = await codeExecution_service_1.default.testDockerAvailability();
            res.status(200).json({
                success: true,
                dockerAvailable: isAvailable,
                message: isAvailable
                    ? 'Docker is available and ready'
                    : 'Docker is not available. Please install Docker to use code execution.',
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to check Docker status',
                error: error.message,
            });
        }
    }
}
exports.default = new CodeExecutionController();
