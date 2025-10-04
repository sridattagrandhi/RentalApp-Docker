// app/(tabs)/wishlist.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import ListingCard from '../../components/ListingCard'; // Reusable ListingCard component
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { Listing } from '../../constants/Types';
import { styles } from './wishlist.styles'; // Styles for this screen

// Provide a fallback for EXPO_PUBLIC_DEV_URL when running locally.  Android
// emulators use 10.0.2.2 instead of localhost.  Parse the env var to derive
// the host and enforce port 5001.  In production we call our Cloud Run backend.
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
const DEV_SERVER_URL = devHost ? `http://${devHost}:5001` : 'http://localhost:5001';
const PRODUCTION_SERVER_URL = 'https://roomrentalnativeapp-383560472960.us-west2.run.app';
const BASE_URL = __DEV__
  ? Platform.OS === 'android'
    ? (devHost && devHost !== 'localhost' ? `http://${devHost}:5001` : 'http://10.0.2.2:5001')
    : DEV_SERVER_URL
  : PRODUCTION_SERVER_URL;

export default function WishlistScreen() {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const theme = Colors[useColorScheme() || 'light'];

  const [wishlistListings, setWishlistListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  // --- FIXED: useFocusEffect now correctly wraps the async function call ---
  useFocusEffect(
    useCallback(() => {
      const fetchWishlist = async () => {
        if (!firebaseUser) {
          setWishlistListings([]); // Clear list if logged out
          setLoading(false);
          return;
        }
        setLoading(true);
        try {
          const token = await firebaseUser.getIdToken();
          const res = await fetch(`${BASE_URL}/api/users/wishlist`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error('Could not load your wishlist');
          const data: Listing[] = await res.json();
          setWishlistListings(data);
        } catch (err: any) {
          Alert.alert('Error', err.message || 'Failed to load your wishlist.');
        } finally {
          setLoading(false);
        }
      };

      fetchWishlist();
    }, [firebaseUser])
  );

  const handleRemoveFromWishlist = async (listingId: string) => {
    // Optimistic UI update for instant feedback
    setWishlistListings(prev => prev.filter(l => (l._id || l.id) !== listingId));

    try {
      if (!firebaseUser) return;
      const token = await firebaseUser.getIdToken();
      await fetch(`${BASE_URL}/api/users/wishlist/${listingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      // If the API call fails, the item is already removed from the UI.
      // You could optionally add it back here or just show an error.
      Alert.alert("Error", "Failed to update your wishlist. The item will reappear on refresh.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'My Wishlist',
          headerStyle: { backgroundColor: theme.background },
          headerTitleStyle: { color: theme.text },
          headerShadowVisible: false,
        }}
      />

      <FlatList
        data={wishlistListings}
        keyExtractor={(item) => (item._id || item.id!).toString()}
        renderItem={({ item }) => {
          const reliableId = item._id || item.id;
          if (!reliableId) return null;

          return (
            <ListingCard
              listing={item}
              themeColors={theme}
              onPress={() => router.push(`/listings/${reliableId}`)}
              isFavorite={true} // Always true on this screen
              onToggleFavorite={() => handleRemoveFromWishlist(reliableId)}
            />
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} style={styles.emptyIcon} color={theme.text + '70'} />
            <Text style={[styles.emptyText, { color: theme.text }]}>Your Wishlist is Empty</Text>
            <Text style={[styles.emptySubText, { color: theme.text + '99' }]}>
              Tap the heart on any listing to save it here for later.
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl 
            refreshing={loading} 
            onRefresh={() => {
              // Manually trigger the fetch logic inside the callback
              const fetchWishlist = async () => {
                if (!firebaseUser) {
                  setWishlistListings([]);
                  setLoading(false);
                  return;
                }
                setLoading(true);
                try {
                  const token = await firebaseUser.getIdToken();
                  const res = await fetch(`${BASE_URL}/api/users/wishlist`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  if (!res.ok) throw new Error('Could not load your wishlist');
                  const data: Listing[] = await res.json();
                  setWishlistListings(data);
                } catch (err: any) {
                  Alert.alert('Error', err.message || 'Failed to load your wishlist.');
                } finally {
                  setLoading(false);
                }
              };
              fetchWishlist();
            }} 
            tintColor={theme.primary} 
          />
        }
      />
    </SafeAreaView>
  );
}
