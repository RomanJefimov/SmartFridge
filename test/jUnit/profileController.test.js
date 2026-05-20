const profileController = require('../../controller/profileController');
const User = require('../../model/User');

jest.mock('../../model/User');

describe('profileController', () => {
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
            user: { id: 'user-id' }
        };
    });

    describe('getProfile', () => {
        test('should return user profile', async () => {
            const mockUser = { email: 'test@test.com', profile: { name: 'Test' } };
            User.findById.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser)
            });

            await profileController.getProfile(mockReq, mockRes);

            expect(mockJson).toHaveBeenCalledWith({ profile: mockUser.profile, email: mockUser.email });
        });

        test('should return 404 if user not found', async () => {
            User.findById.mockReturnValue({
                select: jest.fn().mockResolvedValue(null)
            });

            await profileController.getProfile(mockReq, mockRes);

            expect(mockStatus).toHaveBeenCalledWith(404);
        });
    });

    describe('updateProfile', () => {
        test('should update profile successfully', async () => {
            mockReq.body = { name: 'Updated' };
            const updatedUser = { email: 'test@test.com', profile: { name: 'Updated' } };
            User.findByIdAndUpdate.mockReturnValue({
                select: jest.fn().mockResolvedValue(updatedUser)
            });

            await profileController.updateProfile(mockReq, mockRes);

            expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ message: 'Profile updated' }));
        });

        test('should return 404 if user not found on update', async () => {
            User.findByIdAndUpdate.mockReturnValue({
                select: jest.fn().mockResolvedValue(null)
            });

            await profileController.updateProfile(mockReq, mockRes);

            expect(mockStatus).toHaveBeenCalledWith(404);
        });
    });
});
