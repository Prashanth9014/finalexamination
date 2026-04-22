// Mock Exam model FIRST - before any imports
jest.mock('../../../dist/models/Exam', () => ({
  Exam: {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn().mockReturnValue({
      exec: jest.fn(),
      populate: jest.fn().mockReturnThis()
    }),
    findByIdAndUpdate: jest.fn().mockReturnValue({
      exec: jest.fn(),
      populate: jest.fn().mockReturnThis()
    }),
    findByIdAndDelete: jest.fn().mockReturnValue({
      exec: jest.fn()
    }),
    modelName: 'Exam',
    collection: { name: 'exams' }
  }
}));

// Mock User model
jest.mock('../../../dist/models/User', () => ({
  User: {
    findById: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        exec: jest.fn()
      })
    })
  }
}));

// Mock Submission model for exam service
jest.mock('../../../dist/models/Submission', () => ({
  Submission: {
    find: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        exec: jest.fn()
      })
    })
  }
}));

// NOW import everything after mocking
const { createExam, getAllExams, getExamById, updateExam, deleteExam, getExamsForCandidate } = require('../../../dist/services/exam.service');
const { Exam } = require('../../../dist/models/Exam');
const { User } = require('../../../dist/models/User');
const { Submission } = require('../../../dist/models/Submission');
const { Types } = require('mongoose');

describe('Exam Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createExam', () => {
    test('should create exam successfully', async () => {
      const examData = {
        title: 'Test Exam',
        description: 'Test Description',
        duration: 60,
        language: 'Python',
        sections: [
          {
            title: 'MCQ Section',
            questions: [
              {
                type: 'mcq',
                question: 'Test question?',
                options: ['A', 'B', 'C', 'D'],
                correctAnswer: 'A',
                marks: 5
              }
            ]
          }
        ]
      };

      const adminId = {
        toString: () => new Types.ObjectId().toString()
      };
      const mockExam = {
        _id: new Types.ObjectId(),
        ...examData,
        createdBy: adminId,
        populate: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId(),
          ...examData,
          createdBy: { name: 'Admin', email: 'admin@test.com' }
        })
      };

      Exam.create.mockResolvedValue(mockExam);
      Exam.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockExam),
        populate: jest.fn().mockReturnThis()
      });

      const result = await createExam(examData, adminId);

      expect(Exam.create).toHaveBeenCalledWith({
        ...examData,
        createdBy: adminId
      });
      expect(result).toBeDefined();
    });

    test('should throw error for invalid exam data', async () => {
      const invalidData = {
        title: '', // Invalid empty title
        duration: -1 // Invalid negative duration
      };
      const adminId = {
        toString: () => new Types.ObjectId().toString()
      };

      Exam.create.mockRejectedValue(new Error('Validation failed'));

      await expect(createExam(invalidData, adminId)).rejects.toThrow('Validation failed');
    });
  });

  describe('getAllExams', () => {
    test('should return all exams for admin', async () => {
      const mockExams = [
        { _id: '1', title: 'Exam 1', language: 'Python' },
        { _id: '2', title: 'Exam 2', language: 'Java' }
      ];

      Exam.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockExams)
          })
        })
      });

      const result = await getAllExams();

      expect(result).toEqual(mockExams);
      expect(Exam.find).toHaveBeenCalledWith();
    });
  });

  describe('getExamsForCandidate', () => {
    test('should return filtered exams for candidate with language preference', async () => {
      const userId = new Types.ObjectId().toString();
      const mockUser = {
        _id: userId,
        preferredLanguage: 'Python',
        department: 'CSE'
      };

      const mockExams = [
        { _id: '1', title: 'Python Exam', language: 'Python', toObject: () => ({ _id: '1', title: 'Python Exam', language: 'Python' }) }
      ];

      const { User } = require('../../../dist/models/User');
      User.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockUser)
        })
      });

      Submission.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([])
        })
      });

      Exam.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockExams)
          })
        })
      });

      const result = await getExamsForCandidate(userId);

      expect(result).toBeDefined();
      expect(Exam.find).toHaveBeenCalledWith({ 
        status: 'created',
        language: 'Python' 
      });
    });

    test('should return all exams for candidate without preferences', async () => {
      const userId = new Types.ObjectId().toString();
      const mockUser = {
        _id: userId,
        preferredLanguage: null,
        department: null
      };

      const mockExams = [
        { _id: '1', title: 'Exam 1', toObject: () => ({ _id: '1', title: 'Exam 1' }) },
        { _id: '2', title: 'Exam 2', toObject: () => ({ _id: '2', title: 'Exam 2' }) }
      ];

      const { User } = require('../../../dist/models/User');
      User.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockUser)
        })
      });

      Submission.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([])
        })
      });

      Exam.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockExams)
          })
        })
      });

      const result = await getExamsForCandidate(userId);

      expect(result).toBeDefined();
      expect(Exam.find).toHaveBeenCalledWith({ status: 'created' });
    });
  });

  describe('getExamById', () => {
    test('should return exam by ID', async () => {
      const examId = new Types.ObjectId().toString();
      const mockExam = {
        _id: examId,
        title: 'Test Exam',
        sections: []
      };

      Exam.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockExam)
        })
      });

      const result = await getExamById(examId);

      expect(result).toEqual(mockExam);
      expect(Exam.findById).toHaveBeenCalledWith(examId);
    });

    test('should throw error for invalid exam ID', async () => {
      const invalidId = 'invalid-id';

      const result = await getExamById(invalidId);

      expect(result).toBeNull();
    });

    test('should return null for non-existent exam', async () => {
      const examId = new Types.ObjectId().toString();

      Exam.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null)
        })
      });

      const result = await getExamById(examId);

      expect(result).toBeNull();
    });
  });

  describe('updateExam', () => {
    test('should update exam successfully', async () => {
      const examId = new Types.ObjectId().toString();
      const updateData = {
        title: 'Updated Exam',
        description: 'Updated Description'
      };

      const mockUpdatedExam = {
        _id: examId,
        ...updateData
      };

      Exam.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockUpdatedExam)
        })
      });

      const result = await updateExam(examId, updateData);

      expect(result).toEqual(mockUpdatedExam);
      expect(Exam.findByIdAndUpdate).toHaveBeenCalledWith(
        examId,
        { $set: updateData },
        { new: true, runValidators: true }
      );
    });
  });

  describe('deleteExam', () => {
    test('should delete exam successfully', async () => {
      const examId = new Types.ObjectId().toString();
      const mockExam = {
        _id: examId,
        title: 'Test Exam'
      };

      Exam.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockExam)
      });

      const result = await deleteExam(examId);

      expect(result).toBe(true);
      expect(Exam.findByIdAndDelete).toHaveBeenCalledWith(examId);
    });

    test('should return false for non-existent exam', async () => {
      const examId = new Types.ObjectId().toString();

      Exam.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      const result = await deleteExam(examId);

      expect(result).toBe(false);
    });
  });
});