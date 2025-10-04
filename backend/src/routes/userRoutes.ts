// backend/src/routes/userRoutes.ts
import express from 'express';
import { 
    addToWishlist, 
    removeFromWishlist, 
    getWishlist, 
    updateUserPushToken,
    // --- NEW: Import the new controller ---
    updateUserPreferences,
} from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// All routes are protected by the auth middleware
router.get('/wishlist', protect, getWishlist);
router.post('/wishlist/:listingId', protect, addToWishlist);
router.delete('/wishlist/:listingId', protect, removeFromWishlist);
router.post('/push-token', protect, updateUserPushToken);
router.post('/update-preferences', protect, updateUserPreferences);

export default router;