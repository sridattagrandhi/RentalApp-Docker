// backend/src/controllers/notificationController.ts
import { Request, Response, NextFunction } from 'express';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import User from '../models/User';
import Listing from '../models/Listing';

const expo = new Expo();

export const sendPersonalizedNotifications = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Only select users with a valid Expo push token and a characteristics profile
    const users = await User.find({
      pushToken: { $exists: true, $nin: [null, ''] },
      'viewedCharacteristicsProfile.city': { $exists: true, $ne: null },
    });

    const messages: ExpoPushMessage[] = [];

    for (const user of users) {
      const { viewedCharacteristicsProfile } = user;

      // Find the top preference for each field
      const getTopPreference = (profile?: { [key: string]: number }) => {
        if (!profile || Object.keys(profile).length === 0) return null;
        return Object.keys(profile).reduce((a, b) =>
          (profile[a] || 0) > (profile[b] || 0) ? a : b
        );
      };

      const preferredCity = getTopPreference(viewedCharacteristicsProfile?.city);
      const preferredType = getTopPreference(viewedCharacteristicsProfile?.type);
      const preferredBedrooms = getTopPreference(viewedCharacteristicsProfile?.bedrooms);
      const preferredBathrooms = getTopPreference(viewedCharacteristicsProfile?.bathrooms);
      const preferredFurnishing = getTopPreference(viewedCharacteristicsProfile?.furnishingStatus);
      const preferredTenants = getTopPreference(viewedCharacteristicsProfile?.preferredTenants);

      // Build a query for new listings posted in the last 24 hours
      const query: any = {
        isAvailable: true,
        postedDate: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      };

      if (preferredCity) {
        query['address.city'] = preferredCity;
      }
      if (preferredType) {
        query.type = preferredType;
      }
      if (preferredBedrooms) {
        query.bedrooms = Number(preferredBedrooms);
      }
      if (preferredBathrooms) {
        query.bathrooms = Number(preferredBathrooms);
      }
      if (preferredFurnishing) {
        query.furnishingStatus = preferredFurnishing;
      }
      // If the user has a preferred tenant type, match at least one tenant
      if (preferredTenants) {
        query.preferredTenants = { $in: [preferredTenants] };
      }

      const newMatchingListings = await Listing.find(query);

      if (newMatchingListings.length > 0) {
        const body =
          newMatchingListings.length > 1
            ? `We found ${newMatchingListings.length} new listings in ${preferredCity} that you might like!`
            : `A new listing matching your preferences was posted in ${preferredCity}!`;

        // Only queue notifications for users with valid Expo push tokens
        if (user.pushToken && Expo.isExpoPushToken(user.pushToken)) {
          messages.push({
            to: user.pushToken,
            sound: 'default',
            title: 'New Listing Alert!',
            body,
            data: { screen: 'Listings', query },
          });
        }
      }
    }

    // Send notifications in chunks if there are any messages to send
    if (messages.length > 0) {
      const chunks = expo.chunkPushNotifications(messages);
      for (const chunk of chunks) {
        try {
          await expo.sendPushNotificationsAsync(chunk);
        } catch (error) {
          console.error('Error sending a notification chunk:', error);
        }
      }
    }

    res.status(200).json({ message: 'Notifications sent successfully' });
  } catch (error) {
    next(error);
  }
};
