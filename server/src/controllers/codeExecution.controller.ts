import { Request, Response } from 'express';
import codeExecutionService from '../services/codeExecution.service';

class CodeExecutionController {
  async runCode(req: Request, res: Response): Promise<void> {
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
      const result = await codeExecutionService.executeCode({
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
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Code execution failed',
        error: error.message,
      });
    }
  }

  async runWithTestCases(req: Request, res: Response): Promise<void> {
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
      const result = await codeExecutionService.executeWithTestCases({
        language,
        code,
        testCases,
      });

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Test execution failed',
        error: error.message,
      });
    }
  }

  async checkDockerStatus(req: Request, res: Response): Promise<void> {
    try {
      const isAvailable = await codeExecutionService.testDockerAvailability();
      
      res.status(200).json({
        success: true,
        dockerAvailable: isAvailable,
        message: isAvailable 
          ? 'Docker is available and ready' 
          : 'Docker is not available. Please install Docker to use code execution.',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to check Docker status',
        error: error.message,
      });
    }
  }
}

export default new CodeExecutionController();
