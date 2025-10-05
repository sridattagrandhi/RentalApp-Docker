// constants/api.ts
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Derive the LAN host Expo dev server uses (if any)
const devHost = (Constants.expoConfig as any)?.hostUri?.split(':')?.[0] ?? 'localhost';

// Match the same dev logic you’ve been using elsewhere:
const DEV_SERVER_URL =
  Platform.OS === 'android'
    ? (devHost && devHost !== 'localhost' ? `http://${devHost}:5001` : 'http://10.0.2.2:5001')
    : 'http://localhost:5001';

// ✅ Your deployed Cloud Run backend
export const PRODUCTION_SERVER_URL =
  'https://rentalapp-docker-383560472960.us-west2.run.app';

// Single source of truth for everywhere:
export const BASE_URL = __DEV__ ? DEV_SERVER_URL : PRODUCTION_SERVER_URL;
