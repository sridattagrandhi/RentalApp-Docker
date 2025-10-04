// backend/src/controllers/uploadController.ts
import { Request, Response, NextFunction } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

const uploadToCloudinary = (fileBuffer: Buffer): Promise<any> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "room-rental-app" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

export const uploadSingleImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No image file provided.' });
      return;
    }
    const result = await uploadToCloudinary(req.file.buffer);
    const uri = result.secure_url;
    res.status(200).json({ uri });
  } catch (error) {
    console.error('Image upload failed:', error);
    next(error);
  }
};

export const uploadImages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      res.status(400).json({ message: 'No image files provided.' });
      return;
    }
    const files = req.files as Express.Multer.File[];
    const uploadPromises = files.map(file => uploadToCloudinary(file.buffer));
    const results = await Promise.all(uploadPromises);
    const imageUrls = results.map(result => result.secure_url);
    res.status(200).json({ imageUrls });
  } catch (error) {
    console.error('Image upload failed:', error);
    next(error);
  }
};