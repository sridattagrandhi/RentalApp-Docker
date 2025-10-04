// backend/src/routes/uploadRoutes.ts
import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware';
import { uploadSingleImage, uploadImages } from '../controllers/uploadController';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Route for a single image upload
router.post('/single', protect, upload.single('image'), uploadSingleImage);

// Route for multiple image uploads
router.post('/multiple', protect, upload.array('images'), uploadImages);

export default router;