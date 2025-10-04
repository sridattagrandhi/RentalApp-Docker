// context/AuthContext.tsx
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { FIREBASE_AUTH } from '../constants/firebaseConfig';

// --- ✅ IMPROVED BASE_URL DETECTION ---
// Determine the base URL for API requests.  Expo sets `EXPO_PUBLIC_DEV_URL` to
// the Metro bundler URL (e.g. "http://192.168.1.10:8081") in development.  We
// derive the host from that URL and always target port 5001 for our backend.
// Android emulators cannot reach `localhost`, so if no host is inferred we
// default to `10.0.2.2` on Android.
const getDevHost = (): string | undefined => {
  const raw = process.env.EXPO_PUBLIC_DEV_URL;
  if (!raw) return undefined;
  try {
    const urlObj = new URL(raw);
    return urlObj.hostname;
  } catch {
    return undefined;
  }
};
const devHost = getDevHost();
const DEV_SERVER_URL = devHost
  ? `http://${devHost}:5001`
  : 'http://localhost:5001';
// When building for production we always call our deployed Cloud Run backend.
// Update this URL if you deploy the backend to a different domain.
const PRODUCTION_SERVER_URL = 'https://rentalapp-docker-383560472960.us-west2.run.app';
const BASE_URL = __DEV__
  ? Platform.OS === 'android'
    ? (devHost && devHost !== 'localhost' ? `http://${devHost}:5001` : 'http://10.0.2.2:5001')
    : DEV_SERVER_URL
  : PRODUCTION_SERVER_URL;
// -----------------------------------------

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  mongoUser: any | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  mongoUser: null,
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [mongoUser, setMongoUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const token = await user.getIdToken();
          const resp = await fetch(`${BASE_URL}/api/auth/sync-user`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });
          const data = await resp.json();
          if (resp.ok) {
            setMongoUser(data.userData || null);
          } else {
            console.warn('[AuthContext] Sync failed:', data);
            setMongoUser(null);
          }
        } catch (err) {
          console.error('[AuthContext] Sync error:', err);
          setMongoUser(null);
        }
      } else {
        setMongoUser(null);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ firebaseUser, mongoUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};