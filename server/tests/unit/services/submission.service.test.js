// Mock models FIRST - before any imports
jest.mock('../../../dist/models/Submission', () => ({
  Submission: {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findOneAndUpdate: jest.fn()
  }
}));

jest.mock('../../../dist/models/Exam', () => ({
  Exam: {
    findById: jest.fn()
  }
}));

jest.mock('../../../dist/models/User', () => ({
  User: {
    findById: jest.fn()
  }
}));

// Mock code execution service
jest.mock('../../../dist/services/codeExecution.service', () => ({
  default: {
    executeWithTestCases: jest.fn()
  }
}));

// NOW import everything after mocking
const { startExam, submitExam, saveCodingAnswer, saveMcqAnswer, getSavedAnswers } = require('../../../dist/services/submission.service');
const { Submission } = require('../../../dist/models/Submission');
const { Exam } = require('../../../dist/models/Exam');
const { User } = require('../../../dist/models/User');
const codeExecutionService = require('../../../dist/services/codeExecution.service').default;
const { Types } = require('mongoose');

describe('Submission Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('startExam', () => {
    test('should start exam successfully for new candidate', async () => {
      const examId = new Types.ObjectId().toString();
      const userIdString = new Types.ObjectId().toString();
      const userId = {
        toString: () => userIdString
      };
      
      const mockExam = {
        _id: examId,
        title: 'Test Exam',
        duration: 60,
        sections: []
      };

      const mockUser = {
        _id: userId,
        canReattempt: false
      };

      const mockSubmission = {
        _id: new Types.ObjectId(),
        userId: {
          toString: () => userIdString
        },
        examId,
        status: 'in-progress',
        answers: []
      };

      Exam.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockExam)
      });

      User.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser)
      });

      Submission.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]) // No existing submissions
        })
      });

      Submission.findOneAndUpdate.mockResolvedValue(mockSubmission);

      const result = await startExam(examId, userId);

      expect(result.submission).toEqual(mockSubmission);
      expect(result.exam).toEqual(mockExam);
      expect(Submission.findOneAndUpdate).toHaveBeenCalled();
    });

    test('should throw error for invalid exam ID', async () => {
      const invalidExamId = 'invalid-id';
      const userId = {
        toString: () => new Types.ObjectId().toString()
      };

      await expect(startExam(invalidExamId, userId)).rejects.toThrow('Invalid exam ID');
    });

    test('should throw error if exam not found', async () => {
      const examId = new Types.ObjectId().toString();
      const userId = {
        toString: () => new Types.ObjectId().toString()
      };

      Exam.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      await expect(startExam(examId, userId)).rejects.toThrow('Exam not found');
    });

    test('should prevent duplicate submission', async () => {
      const examId = new Types.ObjectId().toString();
      const userId = {
        toString: () => new Types.ObjectId().toString()
      };
      
      const mockExam = {
        _id: examId,
        title: 'Test Exam'
      };

      const mockUser = {
        _id: userId,
        canReattempt: false
      };

      const existingSubmission = {
        _id: new Types.ObjectId(),
        userId,
        examId: { _id: examId },
        status: 'submitted'
      };

      Exam.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockExam)
      });

      User.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser)
      });

      Submission.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([existingSubmission])
        })
      });

      await expect(startExam(examId, userId)).rejects.toThrow('Attempt Limit Reached');
    });

    test('should allow resume for in-progress submission', async () => {
      const examId = new Types.ObjectId().toString();
      const userId = {
        toString: () => new Types.ObjectId().toString()
      };
      
      const mockExam = {
        _id: examId,
        title: 'Test Exam'
      };

      const mockUser = {
        _id: userId,
        canReattempt: false
      };

      const existingSubmission = {
        _id: new Types.ObjectId(),
        userId,
        examId: { _id: examId },
        status: 'in-progress'
      };

      Exam.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockExam)
      });

      User.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser)
      });

      Submission.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([existingSubmission])
        })
      });

      const result = await startExam(examId, userId);

      expect(result.submission).toEqual(existingSubmission);
      expect(result.exam).toEqual(mockExam);
    });
  });

  describe('saveMcqAnswer', () => {
    test('should save MCQ answer successfully', async () => {
      const submissionId = new Types.ObjectId().toString();
      const userIdString = new Types.ObjectId().toString();
      const userId = {
        toString: () => userIdString
      };
      const input = {
        questionId: 'q1',
        selectedOption: 'A'
      };

      const mockSubmission = {
        _id: submissionId,
        userId: {
          toString: () => userIdString
        },
        answers: [],
        status: 'in-progress',
        save: jest.fn().mockResolvedValue(true)
      };

      Submission.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSubmission)
      });

      const result = await saveMcqAnswer(submissionId, userId, input);

      expect(result.answers).toHaveLength(1);
      expect(result.answers[0].questionId).toBe(input.questionId);
      expect(result.answers[0].selectedOption).toBe(input.selectedOption);
      expect(mockSubmission.save).toHaveBeenCalled();
    });

    test('should update existing MCQ answer', async () => {
      const submissionId = new Types.ObjectId().toString();
      const userIdString = new Types.ObjectId().toString();
      const userId = {
        toString: () => userIdString
      };
      const input = {
        questionId: 'q1',
        selectedOption: 'B'
      };

      const mockSubmission = {
        _id: submissionId,
        userId: {
          toString: () => userIdString
        },
        answers: [
          { questionId: 'q1', selectedOption: 'A' }
        ],
        status: 'in-progress',
        save: jest.fn().mockResolvedValue(true)
      };

      Submission.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSubmission)
      });

      const result = await saveMcqAnswer(submissionId, userId, input);

      expect(result.answers).toHaveLength(1);
      expect(result.answers[0].selectedOption).toBe(input.selectedOption);
    });

    test('should throw error if submission not found', async () => {
      const submissionId = new Types.ObjectId().toString();
      const userId = {
        toString: () => new Types.ObjectId().toString()
      };
      const input = { questionId: 'q1', selectedOption: 'A' };

      Submission.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      await expect(saveMcqAnswer(submissionId, userId, input)).rejects.toThrow('Submission not found');
    });
  });

  describe('saveCodingAnswer', () => {
    test('should save coding answer successfully', async () => {
      const submissionId = new Types.ObjectId().toString();
      const userIdString = new Types.ObjectId().toString();
      const userId = {
        toString: () => userIdString
      };
      const input = {
        questionId: 'q1',
        language: 'Python',
        code: 'print("Hello World")',
        executed: true
      };

      const mockSubmission = {
        _id: submissionId,
        userId: {
          toString: () => userIdString
        },
        answers: [],
        status: 'in-progress',
        save: jest.fn().mockResolvedValue(true)
      };

      Submission.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSubmission)
      });

      const result = await saveCodingAnswer(submissionId, userId, input);

      expect(result.answers).toHaveLength(1);
      expect(result.answers[0].questionId).toBe(input.questionId);
      expect(result.answers[0].selectedOption).toBe(input.code);
      expect(result.answers[0].language).toBe(input.language);
      expect(mockSubmission.save).toHaveBeenCalled();
    });
  });

  describe('submitExam', () => {
    test('should submit exam and calculate score', async () => {
      const submissionId = new Types.ObjectId().toString();
      const userIdString = new Types.ObjectId().toString();
      const userId = {
        toString: () => userIdString
      };
      const input = {
        answers: [
          { questionId: 'q1', selectedOption: 'A' },
          { questionId: 'q2', codingAnswer: 'print("test")', language: 'Python' }
        ]
      };

      const mockSubmission = {
        _id: submissionId,
        userId: {
          toString: () => userIdString
        },
        examId: new Types.ObjectId(),
        answers: [],
        status: 'in-progress',
        save: jest.fn().mockResolvedValue(true)
      };

      const mockExam = {
        _id: mockSubmission.examId,
        sections: [
          {
            title: 'MCQ',
            questions: [
              {
                type: 'mcq',
                question: 'Test?',
                correctAnswer: 'A',
                marks: 5
              }
            ]
          },
          {
            title: 'Coding',
            questions: [
              {
                type: 'coding',
                question: 'Code test',
                testCases: [
                  { input: '', expectedOutput: 'test' }
                ],
                marks: 10
              }
            ]
          }
        ]
      };

      Submission.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSubmission)
      });

      Exam.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockExam)
      });

      codeExecutionService.executeWithTestCases.mockResolvedValue({
        success: true,
        results: [{ passed: true }],
        score: 10
      });

      const result = await submitExam(submissionId, userId, input);

      expect(result.status).toBe('submitted');
      expect(result.correctAnswers).toBeDefined();
      expect(result.questionCounts).toBeDefined();
      expect(result.codingSubmitted).toBeDefined();
      expect(mockSubmission.save).toHaveBeenCalled();
    });

    test('should throw error if submission already submitted', async () => {
      const submissionId = new Types.ObjectId().toString();
      const userIdString = new Types.ObjectId().toString();
      const userId = {
        toString: () => userIdString
      };
      const input = { answers: [] };

      const mockSubmission = {
        _id: submissionId,
        userId: {
          toString: () => userIdString
        },
        status: 'submitted'
      };

      Submission.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSubmission)
      });

      await expect(submitExam(submissionId, userId, input)).rejects.toThrow('Submission already completed');
    });
  });

  describe('getSavedAnswers', () => {
    test('should return saved answers', async () => {
      const submissionId = new Types.ObjectId().toString();
      const userIdString = new Types.ObjectId().toString();
      const userId = {
        toString: () => userIdString
      };
      const mockSubmission = {
        _id: submissionId,
        userId: {
          toString: () => userIdString
        },
        answers: [
          { questionId: 'q1', selectedOption: 'A' },
          { questionId: 'q2', codingAnswer: 'print("test")' }
        ]
      };

      Submission.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSubmission)
      });

      const result = await getSavedAnswers(submissionId, userId);

      expect(result).toHaveLength(2);
      expect(result[0].questionId).toBe('q1');
    });

    test('should throw error for invalid submission ID', async () => {
      const invalidId = 'invalid-id';
      const userId = {
        toString: () => new Types.ObjectId().toString()
      };

      await expect(getSavedAnswers(invalidId, userId)).rejects.toThrow('Invalid submission ID');
    });

    test('should throw error if submission not found', async () => {
      const submissionId = new Types.ObjectId().toString();
      const userId = {
        toString: () => new Types.ObjectId().toString()
      };

      Submission.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      await expect(getSavedAnswers(submissionId, userId)).rejects.toThrow('Submission not found');
    });

    test('should throw error for unauthorized access', async () => {
      const submissionId = new Types.ObjectId().toString();
      const userId = {
        toString: () => new Types.ObjectId().toString()
      };
      const differentUserId = {
        toString: () => new Types.ObjectId().toString()
      };
      const mockSubmission = {
        _id: submissionId,
        userId: differentUserId,
        answers: []
      };

      Submission.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSubmission)
      });

      await expect(getSavedAnswers(submissionId, userId)).rejects.toThrow('Unauthorized: This is not your submission');
    });
  });
});