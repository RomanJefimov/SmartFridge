const adminController = require('../controller/adminController');
const User = require('../model/User');
const bcrypt = require('bcryptjs');

jest.mock('../model/User');
jest.mock('bcryptjs');

describe('adminController', () => {
    let mockReq;
    let mockRes;
    let mockStatus;
    let mockJson;

    beforeEach(() => {
        jest.clearAllMocks();
        mockJson = jest.fn();
        mockStatus = jest.fn(() => mockRes);
        mockRes = {
            status: mockStatus,
            json: mockJson
        };
        mockReq = {
            body: {},
            params: {},
            user: { id: 'admin-id' }
        };
    });

    describe('getUsers', () => {
        test('should return all users', async () => {
            const mockUsers = [{ _id: '1', email: 'test@test.com' }];
            User.find.mockResolvedValue(mockUsers);

            await adminController.getUsers(mockReq, mockRes);

            expect(User.find).toHaveBeenCalledWith({}, '_id email role lastLoginAt createdAt');
            expect(mockJson).toHaveBeenCalledWith({ users: mockUsers });
        });

        test('should handle errors', async () => {
            User.find.mockRejectedValue(new Error('DB error'));
            await adminController.getUsers(mockReq, mockRes);
            expect(mockStatus).toHaveBeenCalledWith(500);
        });
    });

    describe('createUser', () => {
        test('should create a user successfully', async () => {
            mockReq.body = { email: 'new@test.com', password: 'password', role: 'user' };
            User.findOne.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue('hashed');
            User.create.mockResolvedValue({ _id: 'new-id', email: 'new@test.com', role: 'user' });

            await adminController.createUser(mockReq, mockRes);

            expect(mockStatus).toHaveBeenCalledWith(201);
            expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ message: 'User created' }));
        });

        test('should return 400 if email or password missing', async () => {
            mockReq.body = { email: 'new@test.com' };
            await adminController.createUser(mockReq, mockRes);
            expect(mockStatus).toHaveBeenCalledWith(400);
        });

        test('should return 400 if email exists', async () => {
            mockReq.body = { email: 'new@test.com', password: 'password' };
            User.findOne.mockResolvedValue({ email: 'new@test.com' });
            await adminController.createUser(mockReq, mockRes);
            expect(mockStatus).toHaveBeenCalledWith(400);
        });
    });

    describe('updateUser', () => {
        test('should update a user successfully', async () => {
            mockReq.params = { id: 'user-id' };
            mockReq.body = { role: 'admin' };
            User.findByIdAndUpdate.mockReturnValue({
                select: jest.fn().mockResolvedValue({ _id: 'user-id', role: 'admin' })
            });

            await adminController.updateUser(mockReq, mockRes);

            expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ message: 'User updated' }));
        });

        test('should not allow removing own admin role', async () => {
            mockReq.params = { id: 'admin-id' };
            mockReq.user = { id: 'admin-id' };
            mockReq.body = { role: 'user' };

            await adminController.updateUser(mockReq, mockRes);

            expect(mockStatus).toHaveBeenCalledWith(400);
        });
    });

    describe('deleteUser', () => {
        test('should delete a user successfully', async () => {
            mockReq.params = { id: 'user-id' };
            User.findByIdAndDelete.mockResolvedValue({ _id: 'user-id' });

            await adminController.deleteUser(mockReq, mockRes);

            expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ message: 'User deleted successfully' }));
        });

        test('should not allow deleting self', async () => {
            mockReq.params = { id: 'admin-id' };
            mockReq.user = { id: 'admin-id' };

            await adminController.deleteUser(mockReq, mockRes);

            expect(mockStatus).toHaveBeenCalledWith(400);
        });
    });
});
