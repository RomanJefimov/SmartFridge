const authController = require('../controller/authController');
const User = require('../model/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock dependencies
jest.mock('../model/User');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

// Set environment variables for tests
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.JWT_EXPIRES_IN = '1h';

describe('authController', () => {
    let mockReq;
    let mockRes;
    let mockStatus;
    let mockJson;
    let mockSend;

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();

        // Mock Express response objects
        mockJson = jest.fn();
        mockSend = jest.fn();
        mockStatus = jest.fn(() => mockRes); // mockStatus returns mockRes to enable chaining
        mockRes = {
            status: mockStatus,
            json: mockJson,
            send: mockSend,
        };

        // Mock Express request object
        mockReq = {
            body: {},
        };
    });

    // --- Tests for register ---
    describe('register', () => {
        test('should register a new user successfully', async () => {
            mockReq.body = { email: 'test@example.com', password: 'Password123!@#' };

            // Mock User.findOne to return null (user does not exist)
            User.findOne.mockResolvedValue(null);
            // Mock bcrypt.hash
            bcrypt.hash.mockResolvedValue('hashedpassword123');
            // Mock User.create
            User.create.mockResolvedValue({ _id: 'someid', email: 'test@example.com', role: 'user', save: jest.fn() });
            // Mock jwt.sign
            jwt.sign.mockReturnValue('mocked_jwt_token');

            await authController.register(mockReq, mockRes);

            expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
            expect(bcrypt.hash).toHaveBeenCalledWith('Password123!@#', 10);
            expect(User.create).toHaveBeenCalledWith({ email: 'test@example.com', passwordHash: 'hashedpassword123' });
            expect(jwt.sign).toHaveBeenCalledWith(
                { id: 'someid', email: 'test@example.com', role: 'user' },
                'test_jwt_secret',
                { expiresIn: '1h' }
            );
            expect(mockStatus).toHaveBeenCalledWith(201);
            expect(mockJson).toHaveBeenCalledWith({
                message: 'User registered',
                token: 'mocked_jwt_token',
                role: 'user',
                email: 'test@example.com',
            });
        });

        test('should return 400 if email or password are missing', async () => {
            mockReq.body = { email: 'test@example.com' }; // missing password

            await authController.register(mockReq, mockRes);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Email and password are required' });
        });

        test('should return 400 for invalid email format', async () => {
            mockReq.body = { email: 'invalid-email', password: 'Password123!@#' };

            await authController.register(mockReq, mockRes);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Invalid email format' });
        });

        test('should return 400 for weak password', async () => {
            mockReq.body = { email: 'test@example.com', password: 'weak' };

            await authController.register(mockReq, mockRes);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({
                message:
                    'Password must be at least 8 characters and include uppercase, lowercase, number and special character',
            });
        });

        test('should return 400 if email is already in use', async () => {
            mockReq.body = { email: 'existing@example.com', password: 'Password123!@#' };
            User.findOne.mockResolvedValue({ email: 'existing@example.com' }); // User already exists

            await authController.register(mockReq, mockRes);

            expect(User.findOne).toHaveBeenCalledWith({ email: 'existing@example.com' });
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Email already in use' });
        });

        test('should return 500 for server error during registration', async () => {
            mockReq.body = { email: 'test@example.com', password: 'Password123!@#' };
            User.findOne.mockRejectedValue(new Error('DB error')); // Simulate a database error

            await authController.register(mockReq, mockRes);

            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Server error' });
        });
    });

    // --- Tests for login ---
    describe('login', () => {
        test('should log in a user successfully', async () => {
            mockReq.body = { email: 'test@example.com', password: 'Password123!@#' };
            const mockUser = { _id: 'someid', email: 'test@example.com', role: 'user', passwordHash: 'hashedpassword123', save: jest.fn() };

            User.findOne.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(true); // Password matches
            jwt.sign.mockReturnValue('mocked_jwt_token');

            await authController.login(mockReq, mockRes);

            expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
            expect(bcrypt.compare).toHaveBeenCalledWith('Password123!@#', 'hashedpassword123');
            expect(mockUser.save).toHaveBeenCalledTimes(1); // lastLoginAt should be updated
            expect(jwt.sign).toHaveBeenCalledWith(
                { id: 'someid', email: 'test@example.com', role: 'user' },
                'test_jwt_secret',
                { expiresIn: '1h' }
            );
            expect(mockJson).toHaveBeenCalledWith({
                message: 'Login successful',
                token: 'mocked_jwt_token',
                role: 'user',
                email: 'test@example.com',
            });
        });

        test('should return 400 if email or password are missing', async () => {
            mockReq.body = { email: 'test@example.com' }; // missing password

            await authController.login(mockReq, mockRes);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Email and password are required' });
        });

        test('should return 400 if user not found', async () => {
            mockReq.body = { email: 'nonexistent@example.com', password: 'Password123!@#' };
            User.findOne.mockResolvedValue(null); // User not found

            await authController.login(mockReq, mockRes);

            expect(User.findOne).toHaveBeenCalledWith({ email: 'nonexistent@example.com' });
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Invalid credentials' });
        });

        test('should return 400 for invalid credentials (wrong password)', async () => {
            mockReq.body = { email: 'test@example.com', password: 'WrongPassword123!@#' };
            const mockUser = { _id: 'someid', email: 'test@example.com', role: 'user', passwordHash: 'hashedpassword123', save: jest.fn() };

            User.findOne.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(false); // Password does not match

            await authController.login(mockReq, mockRes);

            expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
            expect(bcrypt.compare).toHaveBeenCalledWith('WrongPassword123!@#', 'hashedpassword123');
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Invalid credentials' });
        });

        test('should return 500 for server error during login', async () => {
            mockReq.body = { email: 'test@example.com', password: 'Password123!@#' };
            User.findOne.mockRejectedValue(new Error('DB error')); // Simulate a database error

            await authController.login(mockReq, mockRes);

            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Server error' });
        });
    });
});