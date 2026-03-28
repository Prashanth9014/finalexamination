import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

interface ExecutionResult {
  output: string;
  error: string;
  executionTime: number;
}

interface TestCase {
  input: string;
  expectedOutput: string;
}

interface TestResult {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
}

interface TestExecutionResult {
  passed: number;
  total: number;
  results: TestResult[];
  executionTime: number;
  error?: string;
}

interface CodeExecutionParams {
  language: string;
  code: string;
  input?: string;
}

interface TestExecutionParams {
  language: string;
  code: string;
  testCases: TestCase[];
}

class CodeExecutionService {
  private sandboxDir = path.join(__dirname, '../../sandbox');
  private executionTimeout = 5000; // 5 seconds

  constructor() {
    // Ensure sandbox directory exists
    if (!fs.existsSync(this.sandboxDir)) {
      fs.mkdirSync(this.sandboxDir, { recursive: true });
    }
  }

  async executeCode(params: CodeExecutionParams): Promise<ExecutionResult> {
    const { language, code, input = '' } = params;
    const workspaceId = uuidv4();
    const workspacePath = path.join(this.sandboxDir, workspaceId);

    try {
      // Create temporary workspace
      fs.mkdirSync(workspacePath, { recursive: true });

      // Get file extension and docker command
      const { fileName, dockerCommand } = this.getExecutionConfig(language, workspacePath);
      const filePath = path.join(workspacePath, fileName);

      // Write code to file
      fs.writeFileSync(filePath, code, 'utf-8');

      // Write input to file if provided
      if (input) {
        const inputPath = path.join(workspacePath, 'input.txt');
        fs.writeFileSync(inputPath, input, 'utf-8');
      }

      // Execute code in Docker container
      const startTime = Date.now();
      const result = await this.runInDocker(dockerCommand, workspacePath, input);
      const executionTime = Date.now() - startTime;

      return {
        output: result.stdout,
        error: result.stderr,
        executionTime,
      };
    } catch (error: any) {
      return {
        output: '',
        error: error.message || 'Execution failed',
        executionTime: 0,
      };
    } finally {
      // Cleanup workspace
      this.cleanupWorkspace(workspacePath);
    }
  }

  private getExecutionConfig(language: string, workspacePath: string): { fileName: string; dockerCommand: string } {
    const absolutePath = path.resolve(workspacePath);
    
    switch (language.toLowerCase()) {
      case 'python':
        return {
          fileName: 'code.py',
          dockerCommand: `docker run --rm --network none --memory=128m --cpus=0.5 -v "${absolutePath}:/app" -w /app python:3.10-slim python code.py`,
        };

      case 'javascript':
        return {
          fileName: 'code.js',
          dockerCommand: `docker run --rm --network none --memory=128m --cpus=0.5 -v "${absolutePath}:/app" -w /app node:18-slim node code.js`,
        };

      case 'c':
        return {
          fileName: 'code.c',
          dockerCommand: `docker run --rm --network none --memory=128m --cpus=0.5 -v "${absolutePath}:/app" -w /app gcc:12 bash -c "gcc code.c -o code && ./code"`,
        };

      case 'cpp':
        return {
          fileName: 'code.cpp',
          dockerCommand: `docker run --rm --network none --memory=128m --cpus=0.5 -v "${absolutePath}:/app" -w /app gcc:12 bash -c "g++ code.cpp -o a.out && ./a.out"`,
        };

      case 'java':
        return {
          fileName: 'Main.java',
          dockerCommand: `docker run --rm --network none --memory=128m --cpus=0.5 -v "${absolutePath}:/app" -w /app openjdk:17-slim bash -c "javac Main.java && java Main"`,
        };

      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }

  private async runInDocker(command: string, workspacePath: string, input: string): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const childProcess = exec(command, {
        timeout: this.executionTimeout,
        maxBuffer: 1024 * 1024, // 1MB
      }, (error, stdout, stderr) => {
        if (error) {
          // Check if it's a timeout error
          if (error.killed || error.signal === 'SIGTERM') {
            reject(new Error('Execution timeout: Code took too long to execute (max 5 seconds)'));
          } else {
            // Return stderr as error message for compilation/runtime errors
            resolve({ stdout: '', stderr: stderr || error.message });
          }
        } else {
          resolve({ stdout, stderr });
        }
      });

      // Send input to stdin if provided
      if (input && childProcess.stdin) {
        childProcess.stdin.write(input);
        childProcess.stdin.end();
      }
    });
  }

  private cleanupWorkspace(workspacePath: string): void {
    try {
      if (fs.existsSync(workspacePath)) {
        fs.rmSync(workspacePath, { recursive: true, force: true });
      }
    } catch (error) {
      console.error('Failed to cleanup workspace:', error);
    }
  }

  async testDockerAvailability(): Promise<boolean> {
    try {
      await execAsync('docker --version');
      return true;
    } catch (error) {
      return false;
    }
  }

  async executeWithTestCases(params: TestExecutionParams): Promise<TestExecutionResult> {
    const { language, code, testCases } = params;
    
    if (!testCases || testCases.length === 0) {
      return {
        passed: 0,
        total: 0,
        results: [],
        executionTime: 0,
        error: 'No test cases provided',
      };
    }

    try {
      // Wrap the candidate code with test case execution
      const wrappedCode = this.wrapCodeWithTestCases(language, code, testCases);
      
      // Execute the wrapped code
      const startTime = Date.now();
      const result = await this.executeCode({
        language,
        code: wrappedCode,
        input: '',
      });
      const executionTime = Date.now() - startTime;

      // If there's a compilation or runtime error, return it
      if (result.error) {
        return {
          passed: 0,
          total: testCases.length,
          results: testCases.map(tc => ({
            input: tc.input,
            expected: tc.expectedOutput,
            actual: '',
            passed: false,
          })),
          executionTime,
          error: result.error,
        };
      }

      // Parse the output and compare with expected results
      const outputs = result.output.trim().split('\n');
      const results: TestResult[] = testCases.map((testCase, index) => {
        const actual = outputs[index] ? outputs[index].trim() : '';
        const expected = testCase.expectedOutput.trim();
        
        return {
          input: testCase.input,
          expected,
          actual,
          passed: actual === expected,
        };
      });

      const passed = results.filter(r => r.passed).length;

      return {
        passed,
        total: testCases.length,
        results,
        executionTime,
      };
    } catch (error: any) {
      return {
        passed: 0,
        total: testCases.length,
        results: testCases.map(tc => ({
          input: tc.input,
          expected: tc.expectedOutput,
          actual: '',
          passed: false,
        })),
        executionTime: 0,
        error: error.message || 'Execution failed',
      };
    }
  }

  private wrapCodeWithTestCases(language: string, code: string, testCases: TestCase[]): string {
    switch (language.toLowerCase()) {
      case 'python':
        return this.wrapPython(code, testCases);
      
      case 'javascript':
        return this.wrapJavaScript(code, testCases);
      
      case 'c':
        return this.wrapC(code, testCases);
      
      case 'cpp':
        return this.wrapCpp(code, testCases);
      
      case 'java':
        return this.wrapJava(code, testCases);
      
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }

  private wrapPython(code: string, testCases: TestCase[]): string {
    const testCalls = testCases.map(tc => {
      const inputStr = tc.input.includes('"') ? `'${tc.input}'` : `"${tc.input}"`;
      return `print(solution(${inputStr}))`;
    }).join('\n');

    return `${code}\n\n${testCalls}`;
  }

  private wrapJavaScript(code: string, testCases: TestCase[]): string {
    const testCalls = testCases.map(tc => {
      const inputStr = tc.input.includes('"') ? `'${tc.input}'` : `"${tc.input}"`;
      return `console.log(solution(${inputStr}));`;
    }).join('\n');

    return `${code}\n\n${testCalls}`;
  }

  private wrapC(code: string, testCases: TestCase[]): string {
    // For C, we need to include the solution function and call it from main
    const testCalls = testCases.map(tc => {
      return `    printf("%s\\n", solution("${tc.input}"));`;
    }).join('\n');

    return `#include <stdio.h>
#include <string.h>
#include <stdlib.h>

${code}

int main() {
${testCalls}
    return 0;
}`;
  }

  private wrapCpp(code: string, testCases: TestCase[]): string {
    const testCalls = testCases.map(tc => {
      return `    cout << solution("${tc.input}") << endl;`;
    }).join('\n');

    return `#include <iostream>
#include <string>
using namespace std;

${code}

int main() {
${testCalls}
    return 0;
}`;
  }

  private wrapJava(code: string, testCases: TestCase[]): string {
    const testCalls = testCases.map(tc => {
      return `        System.out.println(solution("${tc.input}"));`;
    }).join('\n');

    return `public class Main {
    ${code}
    
    public static void main(String[] args) {
${testCalls}
    }
}`;
  }
}

export default new CodeExecutionService();
