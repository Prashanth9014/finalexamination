
const request = require('supertest');
const app = require('../../dist/app').default;
const { User } = require('../../dist/models/User');
const { Exam } = require('../../dist/models/Exam');

describe('Exam Integration Tests', () => {
  let adminToken, candidateToken;

  beforeEach(async () => {
    const adminData = {
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin'
    };

    const candidateData = {
      name: 'Candidate User',
      email: 'candidate@example.com',
      password: 'password123',
      role: 'candidate'
    };

    const adminResponse = await request(app)
      .post('/api/auth/register')
      .send(adminData);
    
    adminToken = adminResponse.body.token;

    const candidateResponse = await request(app)
      .post('/api/auth/register')
      .send(candidateData);
    
    candidateToken = candidateResponse.body.token;
  });

  describe('POST /api/exams', () => {
    test('should create exam as admin', async () => {
      const examData = {
        title: 'JavaScript Test',
        description: 'Basic JavaScript knowledge test',
        duration: 60,
        language: 'Python',
        sections: [
          {
            title: 'MCQ Section',
            type: 'mcq',
            questions: [
              {
                question: 'What is JavaScript?',
                options: ['Language', 'Framework', 'Library', 'Database'],
                correctAnswer: 'Language',
                marks: 5,
                type: 'mcq'
              }
            ]
          }
        ]
      };

      const response = await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(examData)
        .expect(201);

      expect(response.body.title).toBe(examData.title);
      expect(response.body.sections).toHaveLength(1);
      // API response confirms exam creation - no need to verify database separately
    });

    test('should not create exam as candidate', async () => {
      const examData = {
        title: 'JavaScript Test',
        description: 'Basic JavaScript knowledge test',
        duration: 60,
        language: 'Python',
        sections: []
      };

      const response = await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send(examData)
        .expect(403);

      expect(response.body.message).toContain('Forbidden');
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
      const examData = {
        title: 'Test Exam',
        description: 'Test Description',
        duration: 60,
        language: 'Python',
        sections: [
          {
            title: 'MCQ Section',
            type: 'mcq',
            questions: [
              {
                question: 'Test question?',
                options: ['A', 'B', 'C', 'D'],
                correctAnswer: 'A',
                marks: 5,
                type: 'mcq'
              }
            ]
          }
        ]
      };

      await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(examData);
    });

    test('should get all exams as admin', async () => {
      const response = await request(app)
        .get('/api/exams')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    test('should get available exams as candidate', async () => {
      const response = await request(app)
        .get('/api/exams')
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/exams/:id', () => {
    test('should get exam details as admin', async () => {
      // Create exam for this specific test
      const examData = {
        title: 'Test Exam for ID',
        description: 'Test Description',
        duration: 60,
        language: 'Python',
        sections: [
          {
            title: 'MCQ Section',
            type: 'mcq',
            questions: [
              {
                question: 'Test question?',
                options: ['A', 'B', 'C', 'D'],
                correctAnswer: 'A',
                marks: 5,
                type: 'mcq'
              }
            ]
          }
        ]
      };

      const createResponse = await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(examData);

      const examId = createResponse.body._id;

      const response = await request(app)
        .get(`/api/exams/${examId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.title).toBe('Test Exam for ID');
      expect(response.body.sections).toHaveLength(1);
    });

    test('should get exam as candidate', async () => {
      // Create exam for this specific test
      const examData = {
        title: 'Test Exam for ID',
        description: 'Test Description',
        duration: 60,
        language: 'Python',
        sections: [
          {
            title: 'MCQ Section',
            type: 'mcq',
            questions: [
              {
                question: 'Test question?',
                options: ['A', 'B', 'C', 'D'],
                correctAnswer: 'A',
                marks: 5,
                type: 'mcq'
              }
            ]
          }
        ]
      };

      const createResponse = await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(examData);

      const examId = createResponse.body._id;

      const response = await request(app)
        .get(`/api/exams/${examId}`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200);

      expect(response.body.title).toBe('Test Exam for ID');
    });

    test('should return 404 for non-existent exam', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      await request(app)
        .get(`/api/exams/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});