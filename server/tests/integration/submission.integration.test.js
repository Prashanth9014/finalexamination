const request = require('supertest');
const app = require('../../dist/app').default;
const { User } = require('../../dist/models/User');
const { Exam } = require('../../dist/models/Exam');
const { Submission } = require('../../dist/models/Submission');

describe('Submission Integration Tests', () => {
  let adminToken, candidateToken, examId;

  beforeEach(async () => {
    // Create admin user
    const adminData = {
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin'
    };

    const adminResponse = await request(app)
      .post('/api/auth/register')
      .send(adminData);
    
    adminToken = adminResponse.body.token;

    // Create candidate user
    const candidateData = {
      name: 'Candidate User',
      email: 'candidate@example.com',
      password: 'password123',
      role: 'candidate'
    };

    const candidateResponse = await request(app)
      .post('/api/auth/register')
      .send(candidateData);
    
    candidateToken = candidateResponse.body.token;

    // Create test exam
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
              question: 'What is 2+2?',
              options: ['3', '4', '5', '6'],
              correctAnswer: '4',
              marks: 5
            }
          ]
        }
      ]
    };

    const examResponse = await request(app)
      .post('/api/exams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(examData);
    
    if (examResponse.status !== 201) {
      console.error('Exam creation failed:', examResponse.status, examResponse.body);
    }
    examId = examResponse.body._id;
  });

  describe('POST /api/submissions/start/:examId', () => {
    test('should start exam successfully', async () => {
      const response = await request(app)
        .post(`/api/submissions/start/${examId}`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200);

      expect(response.body.submission).toBeDefined();
      expect(response.body.submission.status).toBe('in-progress');
      expect(response.body.exam).toBeDefined();
      expect(response.body.exam.title).toBe('Test Exam');
    });

    test('should return 404 for non-existent exam', async () => {
      const fakeExamId = '507f1f77bcf86cd799439011';
      
      await request(app)
        .post(`/api/submissions/start/${fakeExamId}`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(404);
    });

    test('should require authentication', async () => {
      await request(app)
        .post(`/api/submissions/start/${examId}`)
        .expect(401);
    });
  });

  describe('GET /api/submissions/my', () => {
    test('should return candidate submissions', async () => {
      // Start an exam first
      await request(app)
        .post(`/api/submissions/start/${examId}`)
        .set('Authorization', `Bearer ${candidateToken}`);

      const response = await request(app)
        .get('/api/submissions/my')
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    test('should return empty array for candidate with no submissions', async () => {
      // Create new candidate
      const newCandidateData = {
        name: 'New Candidate',
        email: 'newcandidate@example.com',
        password: 'password123',
        role: 'candidate'
      };

      const newCandidateResponse = await request(app)
        .post('/api/auth/register')
        .send(newCandidateData);

      const response = await request(app)
        .get('/api/submissions/my')
        .set('Authorization', `Bearer ${newCandidateResponse.body.token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe('GET /api/submissions/all', () => {
    test('should allow admin to view all submissions', async () => {
      const response = await request(app)
        .get('/api/submissions/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    test('should not allow candidate to view all submissions', async () => {
      await request(app)
        .get('/api/submissions/all')
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(403);
    });
  });
});