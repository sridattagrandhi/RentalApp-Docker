// backend/src/models/Chat.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

// The Chat document represents a conversation thread
export interface IChat extends Document {
  _id: Types.ObjectId;
  participants: Types.ObjectId[];
  listing: Types.ObjectId; // <--- ADDED: A required reference to the listing
  lastMessage?: {
    text: string;
    timestamp: Date;
    sender: Types.ObjectId;
  };
  unreadCountByUser: Map<string, number>;
  hiddenBy: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema = new Schema<IChat>(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    
    // --- ADDED THIS ENTIRE FIELD ---
    listing: {
      type: Schema.Types.ObjectId,
      ref: 'Listing', // This name must match your Listing model name
      required: true,
    },
    // -----------------------------

    lastMessage: {
      text: { type: String },
      timestamp: { type: Date },
      sender: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    // Map from Mongo User ID -> number of unread messages
    unreadCountByUser: {
        type: Schema.Types.Mixed,
        default: {},
      },
      hiddenBy: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
  },
  { timestamps: true }
);

// Index for efficiently finding chats by participants
ChatSchema.index({ participants: 1 });

// You might want to add an index for chats related to a specific listing and user
ChatSchema.index({ listing: 1, participants: 1 });


export default mongoose.model<IChat>('Chat', ChatSchema);