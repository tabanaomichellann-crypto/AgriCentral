const jwt = require('jsonwebtoken');
const { verifyToken, requireRole } = require('./auth.middleware');

jest.mock('jsonwebtoken');

const buildResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const next = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  process.env.JWT_SECRET = 'test-secret';
});

test('returns 401 when authorization header is missing', () => {
  const req = { headers: {} };
  const res = buildResponse();

  verifyToken(req, res, next);

  expect(res.status).toHaveBeenCalledWith(401);
  expect(res.json).toHaveBeenCalledWith({ message: 'No token provided.' });
  expect(next).not.toHaveBeenCalled();
});

test('returns 401 for invalid token', () => {
  const req = { headers: { authorization: 'Bearer badtoken' } };
  const res = buildResponse();
  jwt.verify.mockImplementation(() => { throw new Error('invalid'); });

  verifyToken(req, res, next);

  expect(res.status).toHaveBeenCalledWith(401);
  expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token.' });
  expect(next).not.toHaveBeenCalled();
});

test('calls next and attaches user when token is valid', () => {
  const req = { headers: { authorization: 'Bearer validtoken' } };
  const res = buildResponse();
  const userPayload = { id: 'abc', role: 'Admin' };
  jwt.verify.mockReturnValue(userPayload);

  verifyToken(req, res, next);

  expect(req.user).toEqual(userPayload);
  expect(next).toHaveBeenCalled();
});

test('returns 403 when role is not permitted', () => {
  const req = { user: { role: 'Guest' } };
  const res = buildResponse();

  requireRole('Admin')(req, res, next);

  expect(res.status).toHaveBeenCalledWith(403);
  expect(res.json).toHaveBeenCalledWith({ message: 'Access denied.' });
  expect(next).not.toHaveBeenCalled();
});

test('calls next when role is permitted', () => {
  const req = { user: { role: 'Admin' } };
  const res = buildResponse();

  requireRole('Admin', 'User')(req, res, next);

  expect(next).toHaveBeenCalled();
});
