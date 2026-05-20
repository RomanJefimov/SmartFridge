const isAdmin = require('../../middleware/isAdmin');
const jwt = require('jsonwebtoken');

// Мокаем зависимости
jest.mock('jsonwebtoken');

// Устанавливаем переменные окружения для тестов
process.env.JWT_SECRET = 'test_jwt_secret';

describe('isAdmin middleware', () => {
    let mockReq;
    let mockRes;
    let mockNext;
    let mockStatus;
    let mockJson;

    beforeEach(() => {
        jest.clearAllMocks();

        mockJson = jest.fn();
        mockStatus = jest.fn(() => mockRes); // mockStatus возвращает mockRes
        mockRes = {
            status: mockStatus,
            json: mockJson,
        };
        mockNext = jest.fn();

        mockReq = {
            headers: {},
            user: undefined, // Убеждаемся, что user не установлен изначально
        };
    });

    test('should call next() if token is valid and user is admin', () => {
        const mockToken = 'valid_admin_token';
        const mockDecoded = { id: 'adminid', email: 'admin@example.com', role: 'admin' };
        mockReq.headers.authorization = `Bearer ${mockToken}`;

        jwt.verify.mockReturnValue(mockDecoded);

        isAdmin(mockReq, mockRes, mockNext);

        expect(jwt.verify).toHaveBeenCalledWith(mockToken, 'test_jwt_secret');
        expect(mockReq.user).toEqual(mockDecoded);
        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(mockStatus).not.toHaveBeenCalled();
        expect(mockJson).not.toHaveBeenCalled();
    });

    test('should return 401 if no token is provided', () => {
        isAdmin(mockReq, mockRes, mockNext);

        expect(mockStatus).toHaveBeenCalledWith(401);
        expect(mockJson).toHaveBeenCalledWith({ message: 'Unauthorized' });
        expect(mockNext).not.toHaveBeenCalled();
        expect(jwt.verify).not.toHaveBeenCalled();
    });

    test('should return 401 if authorization header does not start with Bearer', () => {
        mockReq.headers.authorization = 'Token invalid_token';

        isAdmin(mockReq, mockRes, mockNext);

        expect(mockStatus).toHaveBeenCalledWith(401);
        expect(mockJson).toHaveBeenCalledWith({ message: 'Unauthorized' });
        expect(mockNext).not.toHaveBeenCalled();
        expect(jwt.verify).not.toHaveBeenCalled();
    });

    test('should return 401 if token is not valid (jwt.verify throws error)', () => {
        const mockToken = 'invalid_token';
        mockReq.headers.authorization = `Bearer ${mockToken}`;

        jwt.verify.mockImplementation(() => {
            throw new Error('Invalid Token');
        });

        isAdmin(mockReq, mockRes, mockNext);

        expect(jwt.verify).toHaveBeenCalledWith(mockToken, 'test_jwt_secret');
        expect(mockStatus).toHaveBeenCalledWith(401);
        expect(mockJson).toHaveBeenCalledWith({ message: 'Token is not valid' });
        expect(mockNext).not.toHaveBeenCalled();
        expect(mockReq.user).toBeUndefined();
    });

    test('should return 403 if token is valid but user is not admin', () => {
        const mockToken = 'valid_user_token';
        const mockDecoded = { id: 'userid', email: 'user@example.com', role: 'user' };
        mockReq.headers.authorization = `Bearer ${mockToken}`;

        jwt.verify.mockReturnValue(mockDecoded);

        isAdmin(mockReq, mockRes, mockNext);

        expect(jwt.verify).toHaveBeenCalledWith(mockToken, 'test_jwt_secret');
        expect(mockReq.user).toBeUndefined(); // req.user не должен быть установлен, так как middleware завершается раньше
        expect(mockStatus).toHaveBeenCalledWith(403);
        expect(mockJson).toHaveBeenCalledWith({ message: 'Forbidden: Admins only' });
        expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 if token is missing after Bearer', () => {
        mockReq.headers.authorization = 'Bearer ';
        jwt.verify.mockImplementation(() => {
            throw new Error('jwt malformed');
        });

        isAdmin(mockReq, mockRes, mockNext);

        expect(mockStatus).toHaveBeenCalledWith(401);
        expect(mockJson).toHaveBeenCalledWith({ message: 'Token is not valid' });
        expect(jwt.verify).toHaveBeenCalledWith('', 'test_jwt_secret');
        expect(mockNext).not.toHaveBeenCalled();
    });
});