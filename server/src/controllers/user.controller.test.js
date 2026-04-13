const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const {
  getUsers,
  createUser,
  updateUserStatus,
  deleteUser,
  updateUser,
  resetUserPassword,
  getUserStats
} = require('./user.controller');

jest.mock('../models/User.model');
jest.mock('bcryptjs');

const buildResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
});

test('getUsers returns user list without passwordHash', async () => {
  const users = [{ username: 'user1' }, { username: 'user2' }];
  User.find.mockReturnValue({ select: jest.fn().mockResolvedValue(users) });
  const req = {};
  const res = buildResponse();

  await getUsers(req, res);

  expect(res.json).toHaveBeenCalledWith(users);
});

test('createUser validates required fields', async () => {
  const req = { body: { username: 'user1' } };
  const res = buildResponse();

  await createUser(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({ message: 'Full name, username, password, and role are required.' });
});

test('createUser rejects existing username', async () => {
  User.findOne.mockResolvedValue({ username: 'user1' });
  const req = { body: { fullName: 'Test', username: 'user1', password: 'pass', role: 'Admin' } };
  const res = buildResponse();

  await createUser(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({ message: 'Username already exists.' });
});

test('createUser hashes password and returns created user', async () => {
  User.findOne.mockResolvedValue(null);
  bcrypt.hash.mockResolvedValue('hashed-pass');
  const createdUser = { toObject: () => ({ username: 'user1', fullName: 'Test', role: 'Admin' }) };
  User.create.mockResolvedValue(createdUser);

  const req = { body: { fullName: 'Test', username: 'user1', password: 'pass', email: 'test@example.com', role: 'Admin' } };
  const res = buildResponse();

  await createUser(req, res);

  expect(bcrypt.hash).toHaveBeenCalledWith('pass', 10);
  expect(res.status).toHaveBeenCalledWith(201);
  expect(res.json).toHaveBeenCalledWith({
    message: 'User created successfully.',
    user: { username: 'user1', fullName: 'Test', role: 'Admin' }
  });
});

test('updateUserStatus rejects invalid status', async () => {
  const req = { params: { id: 'id1' }, body: { status: 'Pending' } };
  const res = buildResponse();

  await updateUserStatus(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({ message: 'Invalid status. Must be Active or Inactive.' });
});

test('updateUserStatus returns 404 when user not found', async () => {
  User.findByIdAndUpdate.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
  const req = { params: { id: 'id1' }, body: { status: 'Active' } };
  const res = buildResponse();

  await updateUserStatus(req, res);

  expect(res.status).toHaveBeenCalledWith(404);
  expect(res.json).toHaveBeenCalledWith({ message: 'User not found.' });
});

test('updateUserStatus updates status successfully', async () => {
  const updatedUser = { username: 'user1', status: 'Active' };
  User.findByIdAndUpdate.mockReturnValue({ select: jest.fn().mockResolvedValue(updatedUser) });
  const req = { params: { id: 'id1' }, body: { status: 'Active' } };
  const res = buildResponse();

  await updateUserStatus(req, res);

  expect(res.json).toHaveBeenCalledWith({ message: 'User status updated successfully.', user: updatedUser });
});

test('deleteUser rejects deleting last admin', async () => {
  User.findById.mockResolvedValue({ role: 'Admin' });
  User.countDocuments.mockResolvedValue(1);
  const req = { params: { id: 'id1' } };
  const res = buildResponse();

  await deleteUser(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({ message: 'Cannot delete the last admin user.' });
});

test('deleteUser deletes non-admin user successfully', async () => {
  User.findById.mockResolvedValue({ role: 'User' });
  User.findByIdAndDelete.mockResolvedValue({});
  const req = { params: { id: 'id1' } };
  const res = buildResponse();

  await deleteUser(req, res);

  expect(res.json).toHaveBeenCalledWith({ message: 'User deleted successfully.' });
});

test('updateUser rejects duplicate username', async () => {
  User.findOne.mockResolvedValue({ username: 'other' });
  const req = { params: { id: 'id1' }, body: { username: 'other' } };
  const res = buildResponse();

  await updateUser(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({ message: 'Username already exists.' });
});

test('updateUser returns 404 when user not found', async () => {
  User.findOne.mockResolvedValue(null);
  User.findByIdAndUpdate.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
  const req = { params: { id: 'id1' }, body: { fullName: 'New Name' } };
  const res = buildResponse();

  await updateUser(req, res);

  expect(res.status).toHaveBeenCalledWith(404);
  expect(res.json).toHaveBeenCalledWith({ message: 'User not found.' });
});

test('updateUser updates user successfully', async () => {
  User.findOne.mockResolvedValue(null);
  User.findByIdAndUpdate.mockReturnValue({ select: jest.fn().mockResolvedValue({ username: 'user1', fullName: 'New Name' }) });
  const req = { params: { id: 'id1' }, body: { fullName: 'New Name' } };
  const res = buildResponse();

  await updateUser(req, res);

  expect(res.json).toHaveBeenCalledWith({
    message: 'User updated successfully.',
    user: { username: 'user1', fullName: 'New Name' }
  });
});

test('resetUserPassword validates password length', async () => {
  const req = { params: { id: 'id1' }, body: { newPassword: '123' } };
  const res = buildResponse();

  await resetUserPassword(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({ message: 'Password must be at least 6 characters long.' });
});

test('resetUserPassword returns 404 when user not found', async () => {
  bcrypt.hash.mockResolvedValue('hashed');
  User.findByIdAndUpdate.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
  const req = { params: { id: 'id1' }, body: { newPassword: '123456' } };
  const res = buildResponse();

  await resetUserPassword(req, res);

  expect(res.status).toHaveBeenCalledWith(404);
  expect(res.json).toHaveBeenCalledWith({ message: 'User not found.' });
});

test('resetUserPassword succeeds when user exists', async () => {
  bcrypt.hash.mockResolvedValue('hashed');
  User.findByIdAndUpdate.mockReturnValue({ select: jest.fn().mockResolvedValue({}) });
  const req = { params: { id: 'id1' }, body: { newPassword: '123456' } };
  const res = buildResponse();

  await resetUserPassword(req, res);

  expect(res.json).toHaveBeenCalledWith({ message: 'Password reset successfully.' });
});

test('getUserStats returns totals and role stats', async () => {
  User.countDocuments.mockResolvedValueOnce(10).mockResolvedValueOnce(8).mockResolvedValueOnce(2);
  User.aggregate.mockResolvedValue([{ _id: 'Admin', count: 2 }, { _id: 'User', count: 8 }]);
  const req = {};
  const res = buildResponse();

  await getUserStats(req, res);

  expect(res.json).toHaveBeenCalledWith({
    total: 10,
    active: 8,
    inactive: 2,
    byRole: [{ _id: 'Admin', count: 2 }, { _id: 'User', count: 8 }]
  });
});
