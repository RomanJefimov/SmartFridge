const authMiddleware = require('../../middleware/authMiddleware');
const jwt = require('jsonwebtoken');

// Mock dependencies
jest.mock('jsonwebtoken');

// Set environment variables for tests
process.env.JWT_SECRET = 'test_jwt_secret';

describe('authMiddleware', () => {
    let mockReq;
    let mockRes;
    let mockNext;
    let mockStatus;
    let mockJson;

    beforeEach(() => {
        jest.clearAllMocks();

        mockJson = jest.fn();
        mockStatus = jest.fn(() => mockRes); // mockStatus returns mockRes
        mockRes = {
            status: mockStatus,
            json: mockJson,
        };
        mockNext = jest.fn();

        mockReq = {
            headers: {},
            user: undefined, // Ensure user is not set initially
        };
    });

    test('should call next() if token is valid', () => {
        const mockToken = 'valid_token';
        const mockDecoded = { id: 'userid', email: 'test@example.com', role: 'user' };
        mockReq.headers.authorization = `Bearer ${mockToken}`;

        jwt.verify.mockReturnValue(mockDecoded); // jwt.verify should return decoded token

        authMiddleware.protect(mockReq, mockRes, mockNext);

        expect(jwt.verify).toHaveBeenCalledWith(mockToken, 'test_jwt_secret');
        expect(mockReq.user).toEqual(mockDecoded);
        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(mockStatus).not.toHaveBeenCalled(); // No error should occur
        expect(mockJson).not.toHaveBeenCalled();
    });

    test('should return 401 if no token is provided', () => {
        authMiddleware.protect(mockReq, mockRes, mockNext); // No authorization header

        expect(mockStatus).toHaveBeenCalledWith(401);
        expect(mockJson).toHaveBeenCalledWith({ message: 'No token, authorization denied' });
        expect(mockNext).not.toHaveBeenCalled();
        expect(jwt.verify).not.toHaveBeenCalled();
    });

    test('should return 401 if authorization header does not start with Bearer', () => {
        mockReq.headers.authorization = 'Token invalid_token'; // Incorrect format

        authMiddleware.protect(mockReq, mockRes, mockNext);

        expect(mockStatus).toHaveBeenCalledWith(401);
        expect(mockJson).toHaveBeenCalledWith({ message: 'No token, authorization denied' });
        expect(mockNext).not.toHaveBeenCalled();
        expect(jwt.verify).not.toHaveBeenCalled();
    });

    test('should return 401 if token is not valid (jwt.verify throws error)', () => {
        const mockToken = 'invalid_token';
        mockReq.headers.authorization = `Bearer ${mockToken}`;

        jwt.verify.mockImplementation(() => {
            throw new Error('Invalid Token'); // Simulate verification error
        });

        authMiddleware.protect(mockReq, mockRes, mockNext);

        expect(jwt.verify).toHaveBeenCalledWith(mockToken, 'test_jwt_secret');
        expect(mockStatus).toHaveBeenCalledWith(401);
        expect(mockJson).toHaveBeenCalledWith({ message: 'Token is not valid' });
        expect(mockNext).not.toHaveBeenCalled();
        expect(mockReq.user).toBeUndefined();
    });

    test('should return 401 if token is missing after Bearer', () => {
        mockReq.headers.authorization = 'Bearer ';
        // Mock jwt.verify to throw an error for empty string, as usually happens
        jwt.verify.mockImplementation(() => {
            throw new Error('jwt malformed'); // Typical error for empty or invalid JWT
        });

        authMiddleware.protect(mockReq, mockRes, mockNext);

        expect(mockStatus).toHaveBeenCalledWith(401);
        expect(mockJson).toHaveBeenCalledWith({ message: 'Token is not valid' });
        expect(mockNext).not.toHaveBeenCalled();
        expect(jwt.verify).toHaveBeenCalledWith('', 'test_jwt_secret'); // Ensure jwt.verify was called with empty string
    });
});