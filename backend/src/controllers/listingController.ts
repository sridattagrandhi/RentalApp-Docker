// backend/src/controllers/listingController.ts
import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Listing from '../models/Listing';
import { Types } from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';

// Local request type that includes `user`
type AuthedRequest = Request & {
  user?: {
    uid: string;
    email?: string | null;
    name?: string | null;
  };
};

const getPublicIdFromUrl = (url: string): string | null => {
  const match = url.match(/upload\/(?:v\d+\/)?([^\.]+)/);
  return match ? match[1] : null;
};

// Controller to create a new listing (Protected)
export const createListing = async (
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
    const user = await User.findOne({ firebaseUID: firebaseUserId });
    if (!user) {
      res.status(404).json({ message: 'User profile not found in database' });
      return;
    }
    const newListing = new Listing({ ...req.body, owner: user._id });
    const savedListing = await newListing.save();
    res.status(201).json(savedListing);
  } catch (error) {
    next(error);
  }
};

// Controller to get listings for the current authenticated user (Protected)
export const getMyListings = async (
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
    const user = await User.findOne({ firebaseUID: firebaseUserId });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    const listings = await Listing.find({ owner: user._id }).sort({ createdAt: -1 });
    res.status(200).json(listings);
  } catch (error) {
    next(error);
  }
};

// --- PUBLIC CONTROLLERS ---

// GET /api/listings - Get all public listings, can be filtered by city
export const getPublicListings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { 
      city, search, minRent, maxRent, bedrooms, bathrooms,
      furnishingStatus, type, minArea, maxArea, amenities, preferredTenants 
    } = req.query;

    const query: any = { isAvailable: true };

    if (city && typeof city === 'string') {
      query['address.city'] = { $regex: new RegExp(`^${city}$`, 'i') };
    }
    if (search && typeof search === 'string') {
      query.$text = { $search: search };
    }
    if (minRent || maxRent) {
      query.rent = {};
      if (minRent) query.rent.$gte = Number(minRent);
      if (maxRent) query.rent.$lte = Number(maxRent);
    }
    if (bedrooms) query.bedrooms = { $gte: Number(bedrooms) };
    if (bathrooms) query.bathrooms = { $gte: Number(bathrooms) };
    if (type && typeof type === 'string') query.type = { $regex: new RegExp(`^${type}$`, 'i') };
    if (furnishingStatus && typeof furnishingStatus === 'string') query.furnishingStatus = furnishingStatus;

    // Area Range (in sq ft)
    if (minArea || maxArea) {
      query.areaSqFt = {};
      if (minArea) query.areaSqFt.$gte = Number(minArea);
      if (maxArea) query.areaSqFt.$lte = Number(maxArea);
    }
    
    // Amenities (ALL)
    if (amenities && typeof amenities === 'string' && amenities.length > 0) {
      const amenitiesList = amenities.split(',');
      query.amenities = { $all: amenitiesList };
    }

    // Preferred Tenants (ANY)
    if (preferredTenants && typeof preferredTenants === 'string' && preferredTenants.length > 0) {
      const tenantsList = preferredTenants.split(',');
      query.preferredTenants = { $in: tenantsList };
    }
    
    const listings = await Listing.find(query).sort({ postedDate: -1 });
    res.status(200).json(listings);
  } catch (error) {
    next(error);
  }
};

// GET /api/listings/:id - Get a single listing by its ID (Public)
export const getListingById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid listing ID format' });
      return;
    }
    const listing = await Listing.findById(id).populate('owner', 'name profileImageUrl');

    if (!listing) {
      res.status(404).json({ message: 'Listing not found' });
      return;
    }
    res.status(200).json(listing);
  } catch (error) {
    next(error);
  }
};

// Update a listing (Protected) with Cloudinary cleanup
export const updateListing = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const firebaseUid = req.user?.uid;
    if (!firebaseUid) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const user = await User.findOne({ firebaseUID: firebaseUid });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const listingId = req.params.id;
    if (!Types.ObjectId.isValid(listingId)) {
      res.status(400).json({ message: 'Invalid listing ID' });
      return;
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      res.status(404).json({ message: 'Listing not found' });
      return;
    }

    if (listing.owner.toString() !== user.id) {
      res.status(403).json({ message: 'You can only edit your own listings.' });
      return;
    }

    // Cloudinary deletions for removed images
    const oldImageUris = listing.imageUris || [];
    const newImageUris = req.body.imageUris || [];
    const imagesToDelete = oldImageUris.filter(uri => !newImageUris.includes(uri));

    if (imagesToDelete.length > 0) {
      try {
        const publicIdsToDelete = imagesToDelete
          .map(uri => getPublicIdFromUrl(uri))
          .filter((id): id is string => !!id);
        if (publicIdsToDelete.length > 0) {
          await cloudinary.api.delete_resources(publicIdsToDelete);
        }
      } catch (cloudinaryError) {
        console.error('Cloudinary deletion failed:', cloudinaryError);
      }
    }

    Object.assign(listing, req.body);
    const updatedListing = await listing.save();
    res.status(200).json(updatedListing);
  } catch (err) {
    console.error('Failed to update listing:', err);
    next(err);
  }
};

export const deleteListing = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const firebaseUid = req.user?.uid;
    const user = await User.findOne({ firebaseUID: firebaseUid });
    if (!user) {
      res.status(401).json({ message: 'User not found or not authorized' });
      return;
    }

    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid listing ID' });
      return;
    }
    const listing = await Listing.findById(id);
    if (!listing) {
      res.status(404).json({ message: 'Listing not found' });
      return;
    }

    if (listing.owner.toString() !== user.id) {
      res.status(403).json({ message: 'You can only delete your own listings.' });
      return;
    }

    // Delete images from Cloudinary first
    try {
      const publicIds: string[] = [];
      if (listing.image) {
        const publicId = getPublicIdFromUrl(listing.image);
        if (publicId) publicIds.push(publicId);
      }
      if (listing.imageUris && listing.imageUris.length > 0) {
        listing.imageUris.forEach(uri => {
          const publicId = getPublicIdFromUrl(uri);
          if (publicId) publicIds.push(publicId);
        });
      }
      if (publicIds.length > 0) {
        await cloudinary.api.delete_resources(publicIds);
      }
    } catch (cloudinaryError) {
      console.error('Cloudinary deletion failed, but proceeding with DB deletion:', cloudinaryError);
    }
    
    await listing.deleteOne();
    res.status(204).end();
  } catch (err) {
    console.error('Failed to delete listing:', err);
    next(err);
  }
};
