// backend/src/controllers/authController.ts
import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import User, { IUser } from '../models/User';
import { AuthenticatedRequest } from '../middleware/authMiddleware'; // ⬅️ add this

/**
 * POST /api/auth/sync-user
 * Verifies the Firebase token and upserts a user document in MongoDB.
 */
export const syncUser = async (
  req: Request,
  res: Response<{ message: string; user: IUser }>,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1]!;
    const decoded = await admin.auth().verifyIdToken(token);
    const firebaseUID = decoded.uid;
    const email = decoded.email || '';
    const name = decoded.name || '';

    const user = await User.findOneAndUpdate(
      { firebaseUID },
      { firebaseUID, email, name },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ message: 'User synced', user });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/auth/profile
 * Updates the current user's profile in MongoDB.
 */
export const updateUserProfile = async (
  req: AuthenticatedRequest, // ⬅️ use the augmented request here
  res: Response<{ message: string; user: IUser }>,
  next: NextFunction
): Promise<void> => {
  try {
    const { uid } = req.user!; // now OK

    const updates: Partial<Pick<IUser, 'name' | 'email' | 'profileImageUrl'>> = {};
    if (req.body.name  != null) updates.name  = req.body.name;
    if (req.body.email != null) updates.email = req.body.email;
    if (req.body.photoURL != null) updates.profileImageUrl = req.body.photoURL;

    const user = await User.findOneAndUpdate(
      { firebaseUID: uid },
      { $set: updates },
      { new: true }
    );

    if (!user) {
      res.status(404).json({ message: 'User not found', user: null as any });
      return;
    }

    res.json({ message: 'Profile updated', user });
  } catch (err) {
    next(err);
  }
};
