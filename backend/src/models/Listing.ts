// backend/src/models/Listing.ts
import mongoose, { Schema, Document, Types } from 'mongoose';
import { IUser } from './User';

export interface IListing extends Document {
  title: string;
  // --- MODIFICATION: Replaced city/locality with structured address ---
  address: {
    street: string;
    locality: string;
    city: string;
    state: string;
    postalCode: string;
  };
  rent: number;
  type: string;
  bedrooms: number;
  bathrooms: number;
  areaSqFt?: number;
  furnishingStatus: 'furnished' | 'semi-furnished' | 'unfurnished';
  preferredTenants?: string[];
  amenities?: string[];
  description: string;
  additionalInfo?: string;
  image: string;
  imageUris?: string[];
  owner: Types.ObjectId | IUser;
  isAvailable?: boolean;
  postedDate?: Date;
}

const ListingSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    // --- MODIFICATION: Updated schema to use a nested address object ---
    address: {
      type: {
        street: { type: String, required: true, trim: true },
        locality: { type: String, required: true, trim: true },
        city: { type: String, required: true, trim: true, index: true },
        state: { type: String, required: true, trim: true },
        postalCode: { type: String, required: true, trim: true },
      },
      required: true,
    },
    rent: { type: Number, required: true },
    type: { type: String, required: true },
    bedrooms: { type: Number, required: true },
    bathrooms: { type: Number, required: true },
    areaSqFt: { type: Number },
    furnishingStatus: {
      type: String,
      required: true,
      enum: ['furnished', 'semi-furnished', 'unfurnished'],
    },
    preferredTenants: [{ type: String }],
    amenities: [{ type: String }],
    description: { type: String, required: true },
    additionalInfo: { type: String },
    image: { type: String, required: true },
    imageUris: [{ type: String }],
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    isAvailable: { type: Boolean, default: true },
    postedDate: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);
ListingSchema.index({ title: 'text', description: 'text' });
const Listing = mongoose.model<IListing>('Listing', ListingSchema);

export default Listing;