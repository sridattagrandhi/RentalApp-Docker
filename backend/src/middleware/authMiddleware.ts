// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';

// Local request type that includes `user`
export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    name?: string;
  };
}

export const protect = async (
  req: AuthenticatedRequest, // <-- use the local interface here
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const idToken = authHeader.slice('Bearer '.length);

    try {
      const decoded = await admin.auth().verifyIdToken(idToken);

      req.user = {
        uid: decoded.uid,
        email: decoded.email,
        name: decoded.name,
      };

      next();
      return;
    } catch (error) {
      console.error('Error verifying Firebase ID token:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
      return;
    }
  }

  res.status(401).json({ message: 'Not authorized, no token or malformed header' });
};
