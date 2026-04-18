const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../dist/app');
const User = require('../../dist/models/User');
const Exam = require('../../dist/models/Exam');
const { signToken } = require('../../dist/utils/jwt');

describe('Exam Integration Tests', () => {
  let adminToken, candidateToken, adminUser, candidateUser;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/test_exam_db';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up
    await User.deleteMany({});
    await Exam.deleteMany({});

    // Create test users
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin'
    });

    candidateUser = await User.create({
      name: 'Candidate User',
      email: 'candidate@example.com',
      password: 'password123',
      role: 'candidate'
    });

    // Generate tokens
    adminToken = signToken({ userId: adminUser._id, role: 'admin' });
    candidateToken = signToken({ userId: candidateUser._id, role: 'candidate' });
  });

  describe('POST /api/exams', () => {
    test('should create exam as admin', async () => {
      const examData = {
        title: 'JavaScript Test',
        description: 'Basic JavaScript knowledge test',
        duration: 60,
        programmingLanguage: 'javascript',
        questions: [
          {
            type: 'mcq',
            question: 'What is JavaScript?',
            options: ['Language', 'Framework', 'Library', 'Database'],
            correctAnswer: 'Language',
            points: 5
          }
        ],
        startTime: new Date(Date.now() + 3600000), // 1 hour from now
        endTime: new Date(Date.now() + 7200000)    // 2 hours from now
      };

      const response = await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(examData)
        .expect(201);

      expect(response.body.message).toBe('Exam created successfully');
      expect(response.body.exam.title).toBe(examData.title);
      expect(response.body.exam.questions).toHaveLength(1);
    });

    test('should not create exam as candidate', async () => {
      const examData = {
        title: 'JavaScript Test',
        description: 'Basic JavaScript knowledge test',
        duration: 60,
        programmingLanguage: 'javascript',
        questions: []
      };

      const response = await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send(examData)
        .expect(403);

      expect(response.body.message).toBe('Access denied. Insufficient permissions.');
    });

    test('should not create exam without authentication', async () => {
      const examData = {
        title: 'JavaScript Test',
        description: 'Basic JavaScript knowledge test'
      };

      await request(app)
        .post('/api/exams')
        .send(examData)
        .expect(401);
    });
  });

  describe('GET /api/exams', () => {
    beforeEach(async () => {
      // Create test exams
      await Exam.create({
        title: 'JavaScript Test',
        description: 'Basic JavaScript test',
        duration: 60,
        programmingLanguage: 'javascript',
        questions: [],
        createdBy: adminUser._id,
        startTime: new Date(Date.now() + 3600000),
        endTime: new Date(Date.now() + 7200000)
      });

      await Exam.create({
        title: 'Python Test',
        description: 'Basic Python test',
        duration: 90,
        programmingLanguage: 'python',
        questions: [],
        createdBy: adminUser._id,
        startTime: new Date(Date.now() + 3600000),
        endTime: new Date(Date.now() + 7200000)
      });
    });

    test('should get all exams as admin', async () => {
      const response = await request(app)
        .get('/api/exams')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.exams).toHaveLength(2);
      expect(response.body.exams[0].title).toBeDefined();
    });

    test('should get available exams as candidate', async () => {
      const response = await request(app)
        .get('/api/exams')
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200);

      expect(response.body.exams).toHaveLength(2);
      // Questions should be filtered out for candidates
      expect(response.body.exams[0].questions).toBeUndefined();
    });
  });

  describe('GET /api/exams/:id', () => {
    let examId;

    beforeEach(async () => {
      const exam = await Exam.create({
        title: 'JavaScript Test',
        description: 'Basic JavaScript test',
        duration: 60,
        programmingLanguage: 'javascript',
        questions: [
          {
            type: 'mcq',
            question: 'What is JavaScript?',
            options: ['Language', 'Framework'],
            correctAnswer: 'Language',
            points: 5
          }
        ],
        createdBy: adminUser._id,
        startTime: new Date(Date.now() + 3600000),
        endTime: new Date(Date.now() + 7200000)
      });
      examId = exam._id;
    });

    test('should get exam details as admin', async () => {
      const response = await request(app)
        .get(`/api/exams/${examId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.exam.title).toBe('JavaScript Test');
      expect(response.body.exam.questions).toHaveLength(1);
    });

    test('should get exam without answers as candidate', async () => {
      const response = await request(app)
        .get(`/api/exams/${examId}`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200);

      expect(response.body.exam.title).toBe('JavaScript Test');
      expect(response.body.exam.questions[0].correctAnswer).toBeUndefined();
    });

    test('should return 404 for non-existent exam', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      await request(app)
        .get(`/api/exams/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});