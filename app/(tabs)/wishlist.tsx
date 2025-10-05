// app/(tabs)/wishlist.tsx
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  Text,
  View,
} from 'react-native';

import ListingCard from '../../components/ListingCard';
import { Colors } from '../../constants/Colors';
import { Listing } from '../../constants/Types';
import { useAuth } from '../../context/AuthContext';
import { useColorScheme } from '../../hooks/useColorScheme';
import { styles } from './wishlist.styles';

// ✅ One source of truth for API URL
import { BASE_URL } from '../../constants/api';

export default function WishlistScreen() {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const theme = Colors[useColorScheme() || 'light'];

  const [wishlistListings, setWishlistListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
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
    }, [firebaseUser])
  );

  const handleRemoveFromWishlist = async (listingId: string) => {
    // Optimistic update
    setWishlistListings(prev => prev.filter(l => (l._id || l.id) !== listingId));

    try {
      if (!firebaseUser) return;
      const token = await firebaseUser.getIdToken();
      await fetch(`${BASE_URL}/api/users/wishlist/${listingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      Alert.alert('Error', 'Failed to update your wishlist. The item will reappear on refresh.');
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
              isFavorite={true}
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
              // Trigger the same fetch logic
              (async () => {
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
              })();
            }}
            tintColor={theme.primary}
          />
        }
      />
    </SafeAreaView>
  );
}
