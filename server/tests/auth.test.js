const request = require('supertest');
const app = require('../index');
const db = require('../db');

describe('Auth Endpoints', () => {
  const testUser = {
    username: 'testuserauth', // Unique username for this test suite
    email: 'auth@example.com', // Unique email
    password: 'password123'
  };
  let token; // To store token from login for other potential tests

  // Clean up any existing test user before all tests run
  beforeAll(async () => {
    await db.query("DELETE FROM users WHERE email = $1 OR username = $2", [testUser.email, testUser.username]);
  });

  afterAll(async () => {
    // Clean up created users
    try {
      await db.query("DELETE FROM users WHERE email = $1 OR username = $2", [testUser.email, testUser.username]);
    } catch (error) {
      console.error("Error cleaning up user in afterAll:", error);
    }
    // Close db connection
    await db.end();
  });

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'User registered successfully!');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.username).toEqual(testUser.username);
    expect(res.body.user.email).toEqual(testUser.email);
  });

  it('should not register a user with an existing username', async () => {
    // First, ensure the user is registered (e.g. from the previous test or register here)
    // For this test, we assume the previous test ran and registered the user.
    // If not, you might need to register a user in a beforeAll or ensure sequential execution.
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...testUser, email: 'anotheremail@example.com' }); // Same username, different email
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'Username already exists.');
  });

  it('should not register a user with an existing email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...testUser, username: 'anotherusername' }); // Same email, different username
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'Email already exists.');
  });

  it('should login an existing user', async () => {
    // This test depends on the successful registration from the first test.
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('message', 'Logged in successfully!');
    token = res.body.token; // Save token for potential future tests
  });

  it('should not login with incorrect email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'wrong@example.com',
        password: testUser.password,
      });
    expect(res.statusCode).toEqual(401); // Or 400 based on your error handling
    expect(res.body).toHaveProperty('message', 'Invalid credentials.');
  });

  it('should not login with incorrect password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword',
      });
    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('message', 'Invalid credentials.');
  });
});
