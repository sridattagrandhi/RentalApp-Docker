// backend/src/controllers/chatController.ts
import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import User, { IUser } from '../models/User';
import Chat, { IChat } from '../models/Chat';
import Message, { IMessage } from '../models/Message';
import { Server as IOServer } from 'socket.io';

// Custom Express Request interface to include Socket.IO server instance
interface IRequest extends Request {
  user?: { uid: string };
  io?: IOServer;
}

// GET /api/chat/threads
export const getThreads = async (
  req: IRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const me = await User.findOne({ firebaseUID: req.user!.uid });
    if (!me) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const threads = await Chat.find({ participants: me._id, hiddenBy: { $ne: me._id } })
      .populate('participants', 'name profileImageUrl firebaseUID')
      // This is a nested populate. It gets the listing, and within that,
      // it gets the owner and selects their firebaseUID.
      .populate({
        path: 'listing',
        select: 'title owner', // Get title and owner from Listing
        populate: {
          path: 'owner',      // Populate the owner field inside the listing
          select: 'firebaseUID' // Select only the firebaseUID from the User model
        }
      })
      .sort({ updatedAt: -1 })
      .lean();

    const result = threads
      .map(thread => {
        const otherParticipant = (thread.participants as any[]).find(
          (p: any) => !p._id.equals(me._id)
        );

        if (!otherParticipant) return null;

        const unreadCount =
          (thread.unreadCountByUser as Record<string, number>)?.[
            me._id.toString()
          ] || 0;

        return {
          chatId: thread._id.toString(),
          recipientId: otherParticipant._id.toString(),
          recipientFirebaseUID: otherParticipant.firebaseUID,
          recipientName: otherParticipant.name || 'Unknown User',
          recipientAvatar: otherParticipant.profileImageUrl,
          lastMessageText: thread.lastMessage?.text || 'No messages yet',
          lastMessageTimestamp: thread.lastMessage?.timestamp?.toISOString() || new Date().toISOString(),
          unreadCount,
          updatedAt: thread.updatedAt.toISOString(),
          // Adds the populated listing title to the response
          listingTitle: (thread.listing as any)?.title,
          listingOwnerFirebaseUID: (thread.listing as any)?.owner?.firebaseUID,
        };
      })
      .filter(Boolean);

    res.status(200).json(result);
  } catch (err) {
    console.error('Error getting threads:', err);
    next(err);
  }
};

// GET /api/chat/:chatId/messages
export const getMessages = async (
  req: IRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const me = await User.findOne({ firebaseUID: req.user!.uid });
    if (!me) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const { chatId } = req.params;
    if (!Types.ObjectId.isValid(chatId)) {
      res.status(400).json({ message: 'Invalid chat ID' });
      return;
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      res.status(404).json({ message: 'Chat not found' });
      return;
    }

    const isParticipant = chat.participants.some(pId => pId.equals(me._id));
    if (!isParticipant) {
      res.status(403).json({ message: 'Access denied to this chat' });
      return;
    }

    const messages = await Message.find({ chatId: chat._id })
      .sort({ timestamp: 1 })
      .populate('sender', 'name profileImageUrl firebaseUID')
      .lean();

    await Chat.updateOne(
        { _id: chat._id },
        { $set: { [`unreadCountByUser.${me._id}`]: 0 } }
    );

    req.io?.to(chatId).emit('messagesRead', {
      chatId,
      readerId: req.user!.uid,
    });

    const transformedMessages = messages.map(msg => {
      const sender = msg.sender as any;
      return {
        _id: msg._id.toString(),
        chatId: msg.chatId.toString(),
        text: msg.text,
        timestamp: msg.timestamp.toISOString(),
        sender: {
          _id: sender.firebaseUID,
          name: sender.name,
          profileImageUrl: sender.profileImageUrl,
        },
      };
    });

    res.status(200).json(transformedMessages);
  } catch (err) {
    console.error('Error getting messages:', err);
    next(err);
  }
};

// POST /api/chat/messages
export const postMessage = async (
    req: Request & { user?: { uid: string }; io?: any },
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Accepts listingId from the request body now
      const { text, otherUserId, chatId: maybeChatId, listingId } = req.body as {
        text: string;
        otherUserId: string;
        chatId?: string;
        listingId?: string;
      };
  
      if (!text?.trim() || !otherUserId) {
        res.status(400).json({ message: 'Recipient and text are required' });
        return;
      }
  
      const me = await User.findOne({ firebaseUID: req.user!.uid });
      if (!me) { res.status(404).json({ message: 'Sender not found' }); return; }
  
      const recipient = Types.ObjectId.isValid(otherUserId)
        ? await User.findById(otherUserId)
        : await User.findOne({ firebaseUID: otherUserId });
      if (!recipient) { res.status(404).json({ message: 'Recipient not found' }); return; }
  
      let chat = maybeChatId && Types.ObjectId.isValid(maybeChatId)
        ? await Chat.findById(maybeChatId)
        : null;
  
      if (chat && !chat.participants.includes(me._id)) {
        res.status(403).json({ message: 'Access denied' }); return;
      }
  
      if (!chat) {
        chat = await Chat.findOne({
          participants: { $all: [me._id, recipient._id], $size: 2 },
          listing: listingId, // Also ensures we don't create duplicate chats for the same listing
        });
      }
  
      const lastMessageData = {
        text:      text.trim(),
        timestamp: new Date(),
        sender:    me._id,
      };
  
      if (!chat) {
        // Requires listingId to create a new chat
        if (!listingId) {
          res.status(400).json({ message: 'listingId is required for a new chat' });
          return;
        }
        chat = new Chat({
          participants:      [me._id, recipient._id],
          listing:           listingId, // Saves the listing reference
          lastMessage:       lastMessageData,
          unreadCountByUser: { [recipient._id.toString()]: 1 },
        });
        await chat.save();
      } else {
        await Chat.updateOne(
          { _id: chat._id },
          {
            $set: { lastMessage: lastMessageData },
            $inc: { [`unreadCountByUser.${recipient._id}`]: 1 },
          }
        );
      }
  
      const message = await Message.create({
        chatId:    chat._id,
        sender:    me._id,
        text:      text.trim(),
        timestamp: new Date(),
      });
  
      await message.populate('sender', 'name profileImageUrl firebaseUID');
      const sp = message.sender as any;
      const payload = {
        _id:       message._id.toString(),
        chatId:    chat._id.toString(),
        text:      message.text,
        timestamp: message.timestamp.toISOString(),
        sender: {
          _id:             sp.firebaseUID,
          name:            sp.name,
          profileImageUrl: sp.profileImageUrl,
        },
      };
  
      req.io?.to(chat._id.toString()).emit('message', payload);
      chat.participants.forEach(pid =>
        req.io?.to(`user-inbox-${pid.toString()}`)
           .emit('chat-activity', { chatId: chat._id.toString() })
      );
  
      res.status(201).json(payload);
    } catch (err) {
      console.error('postMessage error:', err);
      next(err);
    }
  };

  export const deleteThread = async (
    req: IRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const me = await User.findOne({ firebaseUID: req.user!.uid });
        if (!me) {
          res.status(404).json({ message: 'User not found' });
          return;
        }

        const { chatId } = req.params;
        if (!Types.ObjectId.isValid(chatId)) {
          res.status(400).json({ message: 'Invalid chat ID' });
          return;
        }

        const chat = await Chat.findOne({
            _id: chatId,
            participants: me._id
        });
        
        if (!chat) {
          res.status(404).json({ message: 'Chat not found or access denied.' });
          return;
        }

        // --- NEW LOGIC: CHECK IF THE OTHER USER HAS ALREADY DELETED ---
        const otherParticipantId = chat.participants.find(pId => !pId.equals(me._id));
        const isAlreadyHiddenByOther = otherParticipantId ? chat.hiddenBy.includes(otherParticipantId) : false;

        if (isAlreadyHiddenByOther) {
            // This is the HARD DELETE path. The other user already hid it,
            // so we will now permanently delete the chat and its messages.
            console.log(`Hard deleting chat ${chatId} as both users have deleted it.`);
            
            // 1. Delete all messages associated with the chat
            await Message.deleteMany({ chatId: chat._id });
            
            // 2. Delete the chat document itself
            await Chat.findByIdAndDelete(chat._id);

        } else {
            // This is the SOFT DELETE path. The other user has not hidden it yet,
            // so we just add the current user to the hiddenBy list.
            await Chat.updateOne(
                { _id: chatId },
                { $addToSet: { hiddenBy: me._id } }
            );
        }

        res.status(204).send(); // Success, no content for both cases

    } catch(err) {
        console.error('Error deleting thread:', err);
        next(err);
    }
};