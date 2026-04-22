const request = require('supertest');
const app = require('../../dist/app').default;
const { User } = require('../../dist/models/User');
const { Exam } = require('../../dist/models/Exam');
const bcrypt = require('bcrypt');

describe('Report Integration Tests', () => {
  let adminToken, superadminToken;

  beforeEach(async () => {
    // Create superadmin user
    const superadminEmail = `superadmin-${Date.now()}@example.com`;
    const superadminPassword = await bcrypt.hash('superadmin123', 10);
    const superadmin = await User.create({
      name: 'Super Admin',
      email: superadminEmail,
      password: superadminPassword,
      role: 'superadmin'
    });

    // Create admin user
    const adminEmail = `admin-${Date.now()}@example.com`;
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      name: 'Admin User',
      email: adminEmail,
      password: adminPassword,
      role: 'admin'
    });

    // Get tokens
    const { signToken } = require('../../dist/utils/jwt');
    superadminToken = signToken({ userId: superadmin.id, role: 'superadmin' });
    adminToken = signToken({ userId: admin.id, role: 'admin' });
  });

  describe('GET /api/admins/report', () => {
    test('should allow admin to get programming language report', async () => {
      const response = await request(app)
        .get('/api/admins/report')
        .query({ language: 'Python' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    test('should allow superadmin to get programming language report', async () => {
      const response = await request(app)
        .get('/api/admins/report')
        .query({ language: 'Python' })
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    test('should return empty array for language with no submissions', async () => {
      const response = await request(app)
        .get('/api/admins/report')
        .query({ language: 'C++' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    test('should validate programming language parameter', async () => {
      await request(app)
        .get('/api/admins/report')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    test('should reject invalid programming language', async () => {
      const response = await request(app)
        .get('/api/admins/report')
        .query({ language: 'InvalidLanguage' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.message).toContain('Invalid programming language');
    });
  });

  describe('GET /api/admins/department-report', () => {
    test('should allow admin to get department report', async () => {
      const response = await request(app)
        .get('/api/admins/department-report')
        .query({ department: 'CSE' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    test('should validate department parameter', async () => {
      await request(app)
        .get('/api/admins/department-report')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    test('should reject invalid department', async () => {
      const response = await request(app)
        .get('/api/admins/department-report')
        .query({ department: 'InvalidDept' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.message).toContain('Invalid department');
    });

    test('should return empty array for department with no candidates', async () => {
      const response = await request(app)
        .get('/api/admins/department-report')
        .query({ department: 'CIVIL' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });
});