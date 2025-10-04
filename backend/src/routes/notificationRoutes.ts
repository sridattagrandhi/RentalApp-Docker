import express, { Router } from 'express';
import { sendPersonalizedNotifications } from '../controllers/notificationController';

const router: Router = express.Router();

// A public route that can be triggered by a cron job or a manual request
router.get('/send-personalized-notifications', sendPersonalizedNotifications);

export default router;