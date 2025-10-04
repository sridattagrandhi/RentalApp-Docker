// backend/src/controllers/userController.ts
import { Request, Response, NextFunction } from 'express';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import User from '../models/User';
import mongoose from 'mongoose';

const expo = new Expo();

// Local request type that includes `user`
type AuthedRequest = Request & {
  user?: {
    uid: string;
    email?: string | null;
    name?: string | null;
  };
};

// Add a listing to the user's wishlist
export const addToWishlist = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { listingId } = req.params;
    const firebaseUserId = req.user?.uid;

    if (!firebaseUserId) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      res.status(400).json({ message: 'Invalid listing ID' });
      return;
    }

    const user = await User.findOne({ firebaseUID: firebaseUserId });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const listingObjectId = new mongoose.Types.ObjectId(listingId);
    const isAlreadyInWishlist = user.wishlist.some((id) => id.equals(listingObjectId));

    if (isAlreadyInWishlist) {
      res.status(400).json({ message: 'Listing already in wishlist' });
      return;
    }

    user.wishlist.push(listingObjectId);
    await user.save();

    res.status(200).json({ message: 'Added to wishlist', wishlist: user.wishlist });
  } catch (error) {
    console.error('Error in addToWishlist:', error);
    next(error);
  }
};

// Remove a listing from the user's wishlist
export const removeFromWishlist = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { listingId } = req.params;
    const firebaseUserId = req.user?.uid;

    if (!firebaseUserId) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      res.status(400).json({ message: 'Invalid listing ID' });
      return;
    }

    const user = await User.findOneAndUpdate(
      { firebaseUID: firebaseUserId },
      { $pull: { wishlist: new mongoose.Types.ObjectId(listingId) } },
      { new: true }
    );

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({ message: 'Removed from wishlist', wishlist: user.wishlist });
  } catch (error) {
    console.error('Error in removeFromWishlist:', error);
    next(error);
  }
};

// Get all listings in the user's wishlist
export const getWishlist = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const firebaseUserId = req.user?.uid;

    if (!firebaseUserId) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const user = await User.findOne({ firebaseUID: firebaseUserId }).populate('wishlist');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json(user.wishlist);
  } catch (error) {
    console.error('Error in getWishlist:', error);
    next(error);
  }
};

export const updateUserPushToken = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.body;
    const firebaseUserId = req.user?.uid;
    if (!firebaseUserId || !token) {
      res.status(400).json({ message: 'Missing user ID or token' });
      return;
    }
    const user = await User.findOne({ firebaseUID: firebaseUserId });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    // Only update if the token has changed
    if (user.pushToken !== token) {
      user.pushToken = token;
      await user.save();
    }
    res.status(200).json({ message: 'Push token updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateUserPreferences = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const firebaseUserId = req.user?.uid;
    const { city, characteristics } = req.body;

    if (!firebaseUserId) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    if (!city || !characteristics) {
      res.status(400).json({ message: 'Invalid data provided' });
      return;
    }

    const updateQuery: any = {
      $set: { mostViewedCity: city },
      $inc: {},
    };

    // Increment view counters for each characteristic
    if (characteristics.rent) {
      updateQuery.$inc[`viewedCharacteristicsProfile.rentRange.${characteristics.rent}`] = 1;
    }
    if (characteristics.bedrooms) {
      updateQuery.$inc[`viewedCharacteristicsProfile.bedrooms.${characteristics.bedrooms}`] = 1;
    }
    if (characteristics.bathrooms) {
      updateQuery.$inc[`viewedCharacteristicsProfile.bathrooms.${characteristics.bathrooms}`] = 1;
    }
    if (characteristics.furnishingStatus) {
      updateQuery.$inc[`viewedCharacteristicsProfile.furnishingStatus.${characteristics.furnishingStatus}`] = 1;
    }
    if (characteristics.type) {
      updateQuery.$inc[`viewedCharacteristicsProfile.type.${characteristics.type}`] = 1;
    }
    // Count each preferredTenant value
    if (characteristics.preferredTenants && Array.isArray(characteristics.preferredTenants)) {
      characteristics.preferredTenants.forEach((tenant: string) => {
        updateQuery.$inc[`viewedCharacteristicsProfile.preferredTenants.${tenant}`] = 1;
      });
    }
    // Area range bucket
    if (characteristics.areaSqFt) {
      updateQuery.$inc[`viewedCharacteristicsProfile.areaSqFt.${characteristics.areaSqFt}`] = 1;
    }

    const user = await User.findOneAndUpdate(
      { firebaseUID: firebaseUserId },
      updateQuery,
      { new: true, upsert: true }
    );

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({ message: 'User preferences updated successfully' });
  } catch (error) {
    next(error);
  }
};
