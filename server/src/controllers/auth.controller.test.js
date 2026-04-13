const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { login } = require('./auth.controller');

jest.mock('../models/User.model');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const buildResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env.JWT_SECRET = 'test-secret';
});

test('returns 400 when user is not found', async () => {
  User.findOne.mockResolvedValue(null);
  const req = { body: { username: 'user', password: 'password' } };
  const res = buildResponse();

  await login(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({ message: 'Invalid username or password.' });
});

test('returns 403 when account is inactive', async () => {
  User.findOne.mockResolvedValue({ status: 'Inactive' });
  const req = { body: { username: 'user', password: 'password' } };
  const res = buildResponse();

  await login(req, res);

  expect(res.status).toHaveBeenCalledWith(403);
  expect(res.json).toHaveBeenCalledWith({ message: 'Account is inactive. Contact administrator.' });
});

test('returns 400 when password does not match', async () => {
  User.findOne.mockResolvedValue({ status: 'Active', passwordHash: 'hashed' });
  bcrypt.compare.mockResolvedValue(false);
  const req = { body: { username: 'user', password: 'wrong-password' } };
  const res = buildResponse();

  await login(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({ message: 'Invalid username or password.' });
});

test('returns token and user details on successful login', async () => {
  const user = {
    _id: 'abc123',
    role: ' Farmer ',
    fullName: 'Jane Doe',
    passwordHash: 'hashed',
    status: 'Active'
  };
  User.findOne.mockResolvedValue(user);
  bcrypt.compare.mockResolvedValue(true);
  jwt.sign.mockReturnValue('token-123');

  const req = { body: { username: 'jane', password: 'password' } };
  const res = buildResponse();

  await login(req, res);

  expect(jwt.sign).toHaveBeenCalledWith(
    { id: user._id, role: 'Farmer' },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
  expect(res.json).toHaveBeenCalledWith({
    token: 'token-123',
    role: 'Farmer',
    fullName: 'Jane Doe'
  });
});
