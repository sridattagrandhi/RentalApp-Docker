// backend/src/routes/authRoutes.ts
import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { syncUser, updateUserProfile } from '../controllers/authController';

const router = express.Router();

// POST /api/auth/sync-user  →  upsert the Firebase user into MongoDB
router.post('/sync-user', protect, syncUser);
router.put('/profile', protect, updateUserProfile);

export default router;
