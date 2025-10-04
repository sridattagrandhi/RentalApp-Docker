// backend/src/routes/chatRoutes.ts
import express from 'express'
import { protect } from '../middleware/authMiddleware'
import { getThreads, getMessages, postMessage, deleteThread } from '../controllers/chatController'

const router = express.Router()

router.get('/threads', protect, getThreads)
router.delete('/threads/:chatId', protect, deleteThread); 
router.get('/:chatId/messages', protect, getMessages)
router.post('/messages', protect, postMessage) // updated route

export default router
