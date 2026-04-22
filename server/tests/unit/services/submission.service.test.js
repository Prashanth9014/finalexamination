// Mock models FIRST - before any imports
jest.mock('../../../dist/models/Submission', () => ({
  Submission: {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn()
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
      const userId = new Types.ObjectId();
      
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
        userId,
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

      Submission.create.mockResolvedValue(mockSubmission);

      const result = await startExam(examId, userId);

      expect(result.submission).toEqual(mockSubmission);
      expect(result.exam).toEqual(mockExam);
      expect(Submission.create).toHaveBeenCalled();
    });

    test('should throw error for invalid exam ID', async () => {
      const invalidExamId = 'invalid-id';
      const userId = new Types.ObjectId();

      await expect(startExam(invalidExamId, userId)).rejects.toThrow('Invalid exam ID');
    });

    test('should throw error if exam not found', async () => {
      const examId = new Types.ObjectId().toString();
      const userId = new Types.ObjectId();

      Exam.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      await expect(startExam(examId, userId)).rejects.toThrow('Exam not found');
    });

    test('should prevent duplicate submission', async () => {
      const examId = new Types.ObjectId().toString();
      const userId = new Types.ObjectId();
      
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
      const userId = new Types.ObjectId();
      
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
      const questionId = 'q1';
      const selectedOption = 'A';

      const mockSubmission = {
        _id: submissionId,
        answers: [],
        save: jest.fn().mockResolvedValue(true)
      };

      Submission.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSubmission)
      });

      const result = await saveMcqAnswer(submissionId, questionId, selectedOption);

      expect(result.answers).toHaveLength(1);
      expect(result.answers[0].questionId).toBe(questionId);
      expect(result.answers[0].selectedOption).toBe(selectedOption);
      expect(mockSubmission.save).toHaveBeenCalled();
    });

    test('should update existing MCQ answer', async () => {
      const submissionId = new Types.ObjectId().toString();
      const questionId = 'q1';
      const newOption = 'B';

      const mockSubmission = {
        _id: submissionId,
        answers: [
          { questionId: 'q1', selectedOption: 'A' }
        ],
        save: jest.fn().mockResolvedValue(true)
      };

      Submission.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSubmission)
      });

      const result = await saveMcqAnswer(submissionId, questionId, newOption);

      expect(result.answers).toHaveLength(1);
      expect(result.answers[0].selectedOption).toBe(newOption);
    });

    test('should throw error if submission not found', async () => {
      const submissionId = new Types.ObjectId().toString();

      Submission.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      await expect(saveMcqAnswer(submissionId, 'q1', 'A')).rejects.toThrow('Submission not found');
    });
  });

  describe('saveCodingAnswer', () => {
    test('should save coding answer successfully', async () => {
      const submissionId = new Types.ObjectId().toString();
      const questionId = 'q1';
      const codingAnswer = 'print("Hello World")';
      const language = 'Python';

      const mockSubmission = {
        _id: submissionId,
        answers: [],
        save: jest.fn().mockResolvedValue(true)
      };

      Submission.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSubmission)
      });

      const result = await saveCodingAnswer(submissionId, questionId, codingAnswer, language);

      expect(result.answers).toHaveLength(1);
      expect(result.answers[0].questionId).toBe(questionId);
      expect(result.answers[0].codingAnswer).toBe(codingAnswer);
      expect(result.answers[0].language).toBe(language);
    });
  });

  describe('submitExam', () => {
    test('should submit exam and calculate score', async () => {
      const submissionId = new Types.ObjectId().toString();
      const answers = [
        { questionId: 'q1', selectedOption: 'A' },
        { questionId: 'q2', codingAnswer: 'print("test")', language: 'Python' }
      ];

      const mockSubmission = {
        _id: submissionId,
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

      const result = await submitExam(submissionId, { answers });

      expect(result.status).toBe('submitted');
      expect(result.correctAnswers).toBeDefined();
      expect(result.questionCounts).toBeDefined();
      expect(result.codingSubmitted).toBeDefined();
      expect(mockSubmission.save).toHaveBeenCalled();
    });

    test('should throw error if submission already submitted', async () => {
      const submissionId = new Types.ObjectId().toString();

      const mockSubmission = {
        _id: submissionId,
        status: 'submitted'
      };

      Submission.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSubmission)
      });

      await expect(submitExam(submissionId, { answers: [] })).rejects.toThrow('Submission already submitted');
    });
  });

  describe('getSavedAnswers', () => {
    test('should return saved answers', async () => {
      const submissionId = new Types.ObjectId().toString();
      const mockSubmission = {
        _id: submissionId,
        answers: [
          { questionId: 'q1', selectedOption: 'A' },
          { questionId: 'q2', codingAnswer: 'print("test")' }
        ]
      };

      Submission.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockSubmission)
        })
      });

      const result = await getSavedAnswers(submissionId);

      expect(result.answers).toHaveLength(2);
      expect(result.answers[0].questionId).toBe('q1');
    });

    test('should throw error if submission not found', async () => {
      const submissionId = new Types.ObjectId().toString();

      Submission.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null)
        })
      });

      await expect(getSavedAnswers(submissionId)).rejects.toThrow('Submission not found');
    });
  });
});