// backend/src/routes/listingRoutes.ts
import express, { Router } from 'express';
import {
  createListing,
  getMyListings,
  getPublicListings,
  getListingById,
  updateListing,
  deleteListing,
} from '../controllers/listingController';
import { protect } from '../middleware/authMiddleware';

const router: Router = express.Router();

// protected (requires Firebase token) for creation and modification
router.post('/',      protect, createListing);
router.get('/my-listings', protect, getMyListings);
router.put('/:id',    protect, updateListing);
router.delete('/:id', protect, deleteListing);

// Public listing retrieval routes should not require authentication.  Without
// a valid Firebase token the previous implementation would always return 401,
// preventing unauthenticated users from browsing listings.  Removing
// `protect` here makes these GET endpoints publicly accessible while keeping
// write operations secured.
router.get('/',    getPublicListings);
router.get('/:id', getListingById);

export default router;
