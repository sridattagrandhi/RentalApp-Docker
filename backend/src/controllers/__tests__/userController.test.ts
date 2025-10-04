// src/controllers/__tests__/userController.test.ts
import httpMocks from 'node-mocks-http';
import User from '../../models/User';
import Listing from '../../models/Listing';
import { updateUserPushToken, updateUserPreferences } from '../userController';
import { sendPersonalizedNotifications } from '../notificationController';
import { Expo } from 'expo-server-sdk';
import { Types } from 'mongoose';
import { UpdateQuery } from 'mongoose'; // <-- Add this import

// --- Mock the Mongoose models and the Expo SDK ---
jest.mock('../../models/User');
jest.mock('../../models/Listing');
jest.mock('expo-server-sdk');

const MockedUser = User as jest.Mocked<typeof User>;
const MockedListing = Listing as jest.Mocked<typeof Listing>;
const MockedExpo = Expo as jest.Mocked<typeof Expo>;

// Helper to build a fake Mongoose document with save()
const makeUserDoc = (overrides: Partial<any> = {}) => {
  return {
    _id: new Types.ObjectId('507f191e810c19729de860ea'),
    firebaseUID: 'firebase-uid-123',
    email: 'test@example.com',
    wishlist: [],
    pushToken: undefined,
    mostViewedCity: undefined,
    viewedCharacteristicsProfile: undefined,
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
};

const makeListingDoc = (overrides: Partial<any> = {}) => {
  return {
    _id: new Types.ObjectId('607f191e810c19729de860ea'),
    title: 'New Apartment',
    address: { city: 'Test City' },
    isAvailable: true,
    postedDate: new Date(),
    ...overrides,
  };
};

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  (console.error as jest.Mock).mockRestore();
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('updateUserPushToken (Notification setup)', () => {
  it('returns 400 if user id or token missing', async () => {
    const req = httpMocks.createRequest({ method: 'POST', body: {} }) as any;
    const res = httpMocks.createResponse();
    await updateUserPushToken(req, res, (() => {}) as any);
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({ message: 'Missing user ID or token' });
  });

  it('returns 404 if user not found', async () => {
    const req = httpMocks.createRequest({ method: 'POST', body: { token: 'ExponentPushToken[abc]' } }) as any;
    req.user = { uid: 'nope' };
    const res = httpMocks.createResponse();
    MockedUser.findOne.mockResolvedValue(null as any);
    await updateUserPushToken(req, res, (() => {}) as any);
    expect(MockedUser.findOne).toHaveBeenCalledWith({ firebaseUID: 'nope' });
    expect(res._getStatusCode()).toBe(404);
    expect(res._getJSONData()).toEqual({ message: 'User not found' });
  });

  it('saves token when changed and returns 200', async () => {
    const req = httpMocks.createRequest({ method: 'POST', body: { token: 'ExponentPushToken[xyz]' } }) as any;
    req.user = { uid: 'firebase-uid-123' };
    const res = httpMocks.createResponse();
    const userDoc = makeUserDoc({ pushToken: undefined });
    MockedUser.findOne.mockResolvedValue(userDoc as any);
    await updateUserPushToken(req, res, (() => {}) as any);
    expect(MockedUser.findOne).toHaveBeenCalledWith({ firebaseUID: 'firebase-uid-123' });
    expect(userDoc.pushToken).toBe('ExponentPushToken[xyz]');
    expect(userDoc.save).toHaveBeenCalledTimes(1);
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ message: 'Push token updated successfully' });
  });

  it('does not save when token unchanged (still returns 200)', async () => {
    const req = httpMocks.createRequest({ method: 'POST', body: { token: 'ExponentPushToken[same]' } }) as any;
    req.user = { uid: 'firebase-uid-123' };
    const res = httpMocks.createResponse();
    const userDoc = makeUserDoc({ pushToken: 'ExponentPushToken[same]' });
    MockedUser.findOne.mockResolvedValue(userDoc as any);
    await updateUserPushToken(req, res, (() => {}) as any);
    expect(userDoc.save).not.toHaveBeenCalled();
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ message: 'Push token updated successfully' });
  });
});

describe('updateUserPreferences (Personalized notifications)', () => {
  it('returns 400 when required fields are missing', async () => {
    const req = httpMocks.createRequest({ method: 'POST', body: {} }) as any;
    req.user = { uid: 'firebase-uid-123' };
    const res = httpMocks.createResponse();
    await updateUserPreferences(req, res, (() => {}) as any);
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({ message: 'Invalid data provided' });
  });
  
  it('returns 401 when user not authorized', async () => {
    const req = httpMocks.createRequest({ method: 'POST', body: { city: 'New York', characteristics: { bedrooms: 2 } } }) as any;
    const res = httpMocks.createResponse();
    await updateUserPreferences(req, res, (() => {}) as any);
    expect(res._getStatusCode()).toBe(401);
    expect(res._getJSONData()).toEqual({ message: 'Not authorized' });
  });

  it('returns 404 when user not found', async () => {
    const req = httpMocks.createRequest({ method: 'POST', body: { city: 'New York', characteristics: { bedrooms: 2 } } }) as any;
    req.user = { uid: 'missing-uid' };
    const res = httpMocks.createResponse();
    MockedUser.findOneAndUpdate.mockResolvedValue(null as any);
    await updateUserPreferences(req, res, (() => {}) as any);
    expect(MockedUser.findOneAndUpdate).toHaveBeenCalledWith(
      { firebaseUID: 'missing-uid' },
      expect.any(Object),
      expect.any(Object)
    );
    expect(res._getStatusCode()).toBe(404);
    expect(res._getJSONData()).toEqual({ message: 'User not found' });
  });

  it('updates personalization fields and saves', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: { city: 'San Jose', characteristics: { bedrooms: 2, rent: 2500, type: 'Apartment' } }
    }) as any;
    req.user = { uid: 'firebase-uid-123' };
    const res = httpMocks.createResponse();
    const userDoc = makeUserDoc();
    
    // --- FIX: Capture the update query with mockImplementation ---
    let updateQuery: UpdateQuery<typeof userDoc> | undefined;
    MockedUser.findOneAndUpdate.mockImplementation((filter, update, options) => {
        updateQuery = update;
        // The mock must return a Mongoose Query object, not a simple Promise
        return {
            exec: jest.fn().mockResolvedValue(userDoc as any)
        } as any;
    });

    await updateUserPreferences(req, res, (() => {}) as any);
    
    expect(MockedUser.findOneAndUpdate).toHaveBeenCalledWith(
      { firebaseUID: 'firebase-uid-123' },
      expect.any(Object),
      { new: true, upsert: true }
    );
    
    // Now you can safely assert on updateQuery
    expect(updateQuery!.$set).toEqual({ mostViewedCity: 'San Jose' });
    expect(updateQuery!.$inc).toEqual({
      'viewedCharacteristicsProfile.bedrooms.2': 1,
      'viewedCharacteristicsProfile.rentRange.2500': 1,
      'viewedCharacteristicsProfile.type.Apartment': 1,
    });
    
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ message: 'User preferences updated successfully' });
  });
});

describe('sendPersonalizedNotifications', () => {
  it('should send a notification to a user with matching listings', async () => {
    const req = httpMocks.createRequest() as any;
    const res = httpMocks.createResponse();
    
    const mockUserDoc = makeUserDoc({
      pushToken: 'ExponentPushToken[abc]',
      viewedCharacteristicsProfile: {
        city: { 'San Jose': 5 },
        bedrooms: { '2': 3 },
      },
    });

    const mockListingDoc = makeListingDoc({
      address: { city: 'San Jose' },
      bedrooms: 2,
    });
    
    MockedUser.find.mockResolvedValue([mockUserDoc] as any);
    MockedListing.find.mockResolvedValue([mockListingDoc] as any);
    
    jest.spyOn(Expo, 'isExpoPushToken').mockReturnValue(true);
    (MockedExpo.prototype.chunkPushNotifications as jest.Mock).mockReturnValue([[{}]]);
    (MockedExpo.prototype.sendPushNotificationsAsync as jest.Mock).mockResolvedValue(true);

    await sendPersonalizedNotifications(req, res, (() => {}) as any);

    expect(MockedUser.find).toHaveBeenCalledWith({
      pushToken: { $exists: true, $ne: [null, ''] },
      'viewedCharacteristicsProfile.city': { $exists: true, $ne: null },
    });
    
    expect(MockedListing.find).toHaveBeenCalledWith({
      'address.city': 'San Jose',
      isAvailable: true,
      postedDate: { $gte: expect.any(Date) },
      bedrooms: 2,
    });
    
    expect(MockedExpo.prototype.sendPushNotificationsAsync).toHaveBeenCalledTimes(1);
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ message: 'Notifications sent successfully' });
  });

  it('should not send a notification if no matching listings are found', async () => {
    const req = httpMocks.createRequest() as any;
    const res = httpMocks.createResponse();
    
    const mockUserDoc = makeUserDoc({
      pushToken: 'ExponentPushToken[abc]',
      viewedCharacteristicsProfile: { city: { 'San Jose': 5 } },
    });
    
    MockedUser.find.mockResolvedValue([mockUserDoc] as any);
    MockedListing.find.mockResolvedValue([] as any);
    
    jest.spyOn(Expo, 'isExpoPushToken').mockReturnValue(true);
    (MockedExpo.prototype.chunkPushNotifications as jest.Mock).mockReturnValue([]);

    await sendPersonalizedNotifications(req, res, (() => {}) as any);

    expect(MockedListing.find).toHaveBeenCalled();
    expect(MockedExpo.prototype.sendPushNotificationsAsync).not.toHaveBeenCalled();
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ message: 'Notifications sent successfully' });
  });
});