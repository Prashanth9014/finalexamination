const request = require('supertest');
const app = require('../../dist/app').default;
const { User } = require('../../dist/models/User');
const { Submission } = require('../../dist/models/Submission');

describe('Auth Integration Tests', () => {
  describe('POST /api/auth/register', () => {
    test('should register new user', async () => {
      const timestamp = Date.now();
      const userData = {
        name: 'Test User',
        email: `test-${timestamp}@example.com`,
        password: 'password123',
        role: 'candidate'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.password).toBeUndefined(); // Password should not be returned
      expect(response.body.token).toBeDefined();

      // Verify user was created in database
      const userInDb = await User.findOne({ email: userData.email });
      expect(userInDb).toBeTruthy();
      expect(userInDb.name).toBe(userData.name);
    });

    test('should not register user with existing email', async () => {
      const timestamp = Date.now();
      const userData = {
        name: 'Test User',
        email: `test-${timestamp}@example.com`,
        password: 'password123',
        role: 'candidate'
      };

      // Create user first
      await User.create({
        name: userData.name,
        email: userData.email,
        password: 'hashedPassword',
        role: userData.role
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toBe('User with this email already exists');
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User'
          // Missing email, password, role
        })
        .expect(400);

      expect(response.body.message).toContain('required');
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login with correct credentials', async () => {
      // Create a test user first
      const timestamp = Date.now();
      const userData = {
        name: 'Test User',
        email: `test-${timestamp}@example.com`,
        password: 'password123',
        role: 'candidate'
      };

      // Register user first
      await request(app)
        .post('/api/auth/register')
        .send(userData);

      const loginData = {
        email: `test-${timestamp}@example.com`,
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.user).toBeDefined();
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(loginData.email);
    });

    test('should not login with incorrect password', async () => {
      // Create a test user first
      const timestamp = Date.now();
      const userData = {
        name: 'Test User',
        email: `test-${timestamp}@example.com`,
        password: 'password123',
        role: 'candidate'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);

      const loginData = {
        email: `test-${timestamp}@example.com`,
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.message).toBe('Invalid email or password');
    });

    test('should not login with non-existent email', async () => {
      const timestamp = Date.now();
      const loginData = {
        email: `nonexistent-${timestamp}@example.com`,
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.message).toBe('Invalid email or password');
    });
  });
});