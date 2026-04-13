const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const app = require('../app');

jest.mock('../models/User.model');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

beforeEach(() => {
  jest.clearAllMocks();
  process.env.JWT_SECRET = 'test-secret';
});

test('POST /api/auth/login returns token and user details', async () => {
  User.findOne.mockResolvedValue({
    _id: 'user1',
    username: 'tester',
    passwordHash: 'hashed-password',
    role: ' Coordinator ',
    fullName: 'Test User',
    status: 'Active'
  });
  bcrypt.compare.mockResolvedValue(true);
  jwt.sign.mockReturnValue('route-token');

  const response = await request(app)
    .post('/api/auth/login')
    .send({ username: 'tester', password: 'password' })
    .expect(200);

  expect(response.body).toEqual({
    token: 'route-token',
    role: 'Coordinator',
    fullName: 'Test User'
  });
});
