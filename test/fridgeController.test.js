const fridgeController = require('../controller/fridgeController');
const FridgeHistory = require('../model/FridgeHistory');
const User = require('../model/User');
const { GoogleGenAI } = require('@google/genai');

jest.mock('../model/FridgeHistory');
jest.mock('../model/User');
jest.mock('@google/genai');

describe('fridgeController', () => {
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
            user: { id: 'user-id' },
            file: {
                mimetype: 'image/jpeg',
                buffer: Buffer.from('fake-image')
            }
        };

        // Mock GoogleGenAI
        GoogleGenAI.mockImplementation(() => ({
            models: {
                generateContent: jest.fn().mockResolvedValue({
                    text: '{ "products": ["Apple"], "recipes": [], "analysis": {} }'
                })
            }
        }));
    });

    describe('analyzeImage', () => {
        test('should analyze image successfully', async () => {
            User.findById.mockReturnValue({
                select: jest.fn().mockResolvedValue({ profile: {} })
            });

            await fridgeController.analyzeImage(mockReq, mockRes);

            expect(FridgeHistory.create).toHaveBeenCalled();
            expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ products: ['Apple'] }));
        });

        test('should return 400 if no image', async () => {
            mockReq.file = null;
            await fridgeController.analyzeImage(mockReq, mockRes);
            expect(mockStatus).toHaveBeenCalledWith(400);
        });
    });

    describe('getHistory', () => {
        test('should return history', async () => {
            const mockHistory = [{ _id: '1' }];
            FridgeHistory.find.mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockHistory)
            });

            await fridgeController.getHistory(mockReq, mockRes);

            expect(mockJson).toHaveBeenCalledWith({ history: mockHistory });
        });
    });

    describe('getLatest', () => {
        test('should return latest entry', async () => {
            const mockLatest = { _id: '1' };
            FridgeHistory.findOne.mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockLatest)
            });

            await fridgeController.getLatest(mockReq, mockRes);

            expect(mockJson).toHaveBeenCalledWith({ latest: mockLatest });
        });
    });

    describe('updateProducts', () => {
        test('should update products successfully', async () => {
            mockReq.body = { id: 'entry-id', products: [{ name: 'Milk' }] };
            FridgeHistory.findOneAndUpdate.mockResolvedValue({ _id: 'entry-id' });

            await fridgeController.updateProducts(mockReq, mockRes);

            expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ message: 'Products updated' }));
        });
    });

    describe('getNotifications', () => {
        test('should return notifications', async () => {
            const mockLatest = {
                products: [
                    { name: 'Old Milk', expiryDate: new Date(Date.now() - 86400000) } // Expired
                ]
            };
            FridgeHistory.findOne.mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockLatest)
            });

            await fridgeController.getNotifications(mockReq, mockRes);

            expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
                notifications: expect.arrayContaining([
                    expect.objectContaining({ status: 'expired' })
                ])
            }));
        });
    });
});
