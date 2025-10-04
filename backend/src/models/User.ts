// backend/src/models/User.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId; 
  firebaseUID: string;
  email: string;
  name?: string;
  phone?: string;
  bio?: string;
  profileImageUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
  wishlist: Types.ObjectId[];
  pushToken?: string;
  mostViewedCity?: string;
  viewedCharacteristicsProfile?: {
    city?: { [key: string]: number };
    type?: { [key: string]: number };
    bedrooms?: { [key: string]: number };
    bathrooms?: { [key: string]: number };
    furnishingStatus?: { [key: string]: number };
    preferredTenants?: { [key: string]: number };
    rentRange?: { [key: string]: number };
  };
}

const UserSchema: Schema = new Schema(
  {
    firebaseUID: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      sparse: true,
    },
    bio: {
      type: String,
      trim: true,
    },
    profileImageUrl: {
      type: String,
    },
    pushToken: { type: String },
    wishlist: [{
      type: Schema.Types.ObjectId,
      ref: 'Listing'
    }],
    mostViewedCity: { type: String, trim: true },
    viewedCharacteristicsProfile: {
      type: {
        city: { type: Map, of: Number },
        type: { type: Map, of: Number },
        bedrooms: { type: Map, of: Number },
        bathrooms: { type: Map, of: Number },
        furnishingStatus: { type: Map, of: Number },
        preferredTenants: { type: Map, of: Number },
        rentRange: { type: Map, of: Number },
      },
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model<IUser>('User', UserSchema);

export default User;