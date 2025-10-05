// app/listings/[listingId]/index.tsx
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Colors } from '../../../constants/Colors';
import { Listing, UserProfile } from '../../../constants/Types';
import { useAuth } from '../../../context/AuthContext';
import { useColorScheme } from '../../../hooks/useColorScheme';

const windowWidth = Dimensions.get('window').width;
// Fallback to localhost if EXPO_PUBLIC_DEV_URL is not set.  Android uses
// 10.0.2.2 to reach the host machine.  Parse EXPO_PUBLIC_DEV_URL to derive
// the host and enforce port 5001.  Use the Cloud Run URL in production.
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
const PRODUCTION_SERVER_URL = 'https://rentalapp-docker-383560472960.us-west2.run.app';
const BASE_URL = __DEV__
  ? Platform.OS === 'android'
    ? (devHost && devHost !== 'localhost' ? `http://${devHost}:5001` : 'http://10.0.2.2:5001')
    : DEV_SERVER_URL
  : PRODUCTION_SERVER_URL;

export default function ListingView() {
  const { listingId, from } = useLocalSearchParams<{
    listingId: string;
    from?: 'myListings' | string;
  }>();
  const router = useRouter();
  const theme = Colors[useColorScheme() || 'light'];
  const { firebaseUser, isLoading } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchListing = useCallback(async () => {
    if (!listingId) return;
    setLoading(true);
    try {
      const resp = await fetch(`${BASE_URL}/api/listings/${listingId}`);
      if (!resp.ok) throw new Error('Failed to load listing');
      const data: Listing = await resp.json();
      if (data._id) data.id = data._id;
      setListing(data);
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.message || 'Could not load listing');
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  // --- MODIFICATION: The Share button logic ---
  const handleSharePress = async () => {
    try {
      if (!listing) {
        Alert.alert('Error', 'Listing data is not available to share.');
        return;
      }
      const listingUrl = `https://your-app-domain.com/listings/${listingId}`;
      const message = `Check out this listing: ${listing?.title}\n\n${listingUrl}`;

      await Share.share({
        message: message,
        url: listingUrl,
        title: listing?.title,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to share listing.');
    }
  };
  // --- END OF MODIFICATION ---

  const handleLocationPress = () => {
    if (!listing?.address) return;
    const { street, locality, city, state, postalCode } = listing.address;
    const addressString = [street, locality, city, state, postalCode].filter(Boolean).join(', ');
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(addressString)}`,
      android: `geo:0,0?q=${encodeURIComponent(addressString)}`,
    });
    if (url) {
      Linking.openURL(url).catch(() => Alert.alert("Couldn't open maps"));
    }
  };

  // --- NEW: Function to send user preferences to the backend ---
  const updateUserPreferences = async (user: any, viewedListing: Listing) => {
    if (!user || !viewedListing) return;
    try {
      const token = await user.getIdToken();
      
      // --- NEW: Helper function to get area range string ---
      const getAreaRange = (area: number | undefined): string | undefined => {
          if (!area) return undefined;
          if (area <= 500) return '0-500';
          if (area <= 1000) return '501-1000';
          if (area <= 1500) return '1001-1500';
          if (area <= 2000) return '1501-2000';
          return '2001+';
      };
      // --- END NEW ---

      await fetch(`${BASE_URL}/api/users/update-preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          city: viewedListing.address.city,
          characteristics: {
            bedrooms: viewedListing.bedrooms,
            bathrooms: viewedListing.bathrooms,
            furnishingStatus: viewedListing.furnishingStatus,
            rent: viewedListing.rent,
            // --- MODIFICATION: Send the areaSqFt in a categorized format ---
            areaSqFt: getAreaRange(viewedListing.areaSqFt),
            // --- END MODIFICATION ---
            // --- MODIFICATION: Send the preferredTenants array ---
            preferredTenants: viewedListing.preferredTenants,
            // --- END MODIFICATION ---
          },
        }),
      });
    } catch (err) {
      console.error('Failed to update user preferences:', err);
    }
  };
  
  // --- MODIFICATION: Combined useEffect for authentication and fetching ---
  useEffect(() => {
    // Wait until the authentication state is no longer loading
    if (isLoading) {
      return;
    }
    if (!firebaseUser) {
      router.replace({
        pathname: '/login',
        params: { redirectTo: `/listings/${listingId}` },
      });
    } else {
      fetchListing();
    }
  }, [firebaseUser, isLoading, fetchListing, listingId, router]);
  // --- END OF MODIFICATION ---

  // --- NEW: useEffect to trigger preference update after listing data is fetched ---
  useEffect(() => {
    if (firebaseUser && listing) {
      updateUserPreferences(firebaseUser, listing);
    }
  }, [firebaseUser, listing]);
  // --- END NEW ---


  if (loading || !listing) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ title: loading ? 'Loading…' : 'Not found' }} />
        <View style={styles.centered}>
          {loading ? (
            <ActivityIndicator color={theme.primary} size="large" />
          ) : (
            <>
              <Text style={{ color: theme.text }}>Listing not found</Text>
              {/* --- NEW: Retry button --- */}
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: theme.primary }]}
                onPress={fetchListing}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
              {/* --- END NEW --- */}
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const images = (listing.imageUris?.length ?? 0) > 0 ? listing.imageUris! : [listing.image || 'https://placehold.co/600x400'];
  const ownerObj = typeof listing.owner === 'object' ? (listing.owner as UserProfile) : undefined;
  const ownerId = ownerObj?._id || ownerObj?.id;

  const isOwner = ownerObj?.firebaseUID === firebaseUser?.uid;
  const showChat = !isOwner && from !== 'myListings' && from !== 'edit';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: '',
          headerBackTitle: 'Back',
          headerTintColor: theme.primary,
          headerStyle: { backgroundColor: theme.background },
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {isOwner ? (
                <TouchableOpacity
                  style={{ marginRight: 15 }}
                  onPress={() => router.push(`/listings/${listingId}/edit`)}
                >
                  <Ionicons name="create-outline" size={24} color={theme.primary} />
                </TouchableOpacity>
              ) : null}
              {/* --- MODIFICATION: Share button UI --- */}
              <TouchableOpacity
                style={{ marginRight: 15 }}
                onPress={handleSharePress}
              >
                <Ionicons name="share-outline" size={24} color={theme.primary} />
              </TouchableOpacity>
              {/* --- END OF MODIFICATION --- */}
            </View>
          ),
        }}
      />
      <FlatList
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => `img-${i}`}
        renderItem={({ item }) => <Image source={{ uri: item }} style={[styles.gallery, { width: windowWidth }]} />}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>{listing.title}</Text>

        {listing.address && (
          <TouchableOpacity style={styles.locationRow} onPress={handleLocationPress}>
            <Ionicons name="location-outline" size={16} color={theme.text + '99'} />
            <Text style={[styles.locationText, { color: theme.text + '99' }]}>
              {listing.address.locality}, {listing.address.city}
            </Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.rent, { color: theme.primary }]}>
          ₹{listing.rent?.toLocaleString()} / month
        </Text>
        <View style={[styles.sep, { backgroundColor: theme.text + '20' }]} />
        <Text style={[styles.section, { color: theme.text }]}>Details</Text>
        <View style={styles.grid}>
          <Detail label="Type" value={listing.type} icon="home-outline" theme={theme} />
          <Detail label="Bedrooms" value={listing.bedrooms} icon="bed-outline" theme={theme} />
          <Detail label="Bathrooms" value={listing.bathrooms} icon="water-outline" theme={theme} />
          <Detail label="Furnishing" value={listing.furnishingStatus} icon="cube-outline" theme={theme} />
          {listing.areaSqFt != null && (
            <Detail label="Area" value={`${listing.areaSqFt} sqft`} icon="scan-outline" theme={theme} />
          )}
          {listing.isAvailable != null && (
            <Detail label="Available" value={listing.isAvailable ? 'Yes' : 'No'} icon="checkmark-circle-outline" theme={theme} />
          )}
        </View>
        <View style={[styles.sep, { backgroundColor: theme.text + '20' }]} />
        <Text style={[styles.section, { color: theme.text }]}>Description</Text>
        <Text style={[styles.body, { color: theme.text }]}>{listing.description}</Text>
        {listing.amenities?.length! > 0 && (
          <>
            <View style={[styles.sep, { backgroundColor: theme.text + '20' }]} />
            <Text style={[styles.section, { color: theme.text }]}>Amenities</Text>
            <View style={styles.tagsContainer}>
              {listing.amenities!.map((a, i) => (
                <View key={i} style={[styles.tagChip, { borderColor: theme.primary }]}>
                  <Text style={[styles.tagText, { color: theme.text }]}>{a}</Text>
                </View>
              ))}
            </View>
          </>
        )}
        {listing.preferredTenants?.length! > 0 && (
          <>
            <View style={[styles.sep, { backgroundColor: theme.text + '20' }]} />
            <Text style={[styles.section, { color: theme.text }]}>Preferred Tenants</Text>
            <View style={styles.tagsContainer}>
              {listing.preferredTenants!.map((pt, i) => (
                <View key={i} style={[styles.tagChip, { borderColor: theme.primary }]}>
                  <Text style={[styles.tagText, { color: theme.text }]}>{pt}</Text>
                </View>
              ))}
            </View>
          </>
        )}
        {listing.additionalInfo && (
          <>
            <View style={[styles.sep, { backgroundColor: theme.text + '20' }]} />
            <Text style={[styles.section, { color: theme.text }]}>Additional Info</Text>
            <Text style={[styles.body, { color: theme.text }]}>{listing.additionalInfo}</Text>
          </>
        )}
        {ownerObj && listing.postedDate && (
          <>
            <View style={[styles.sep, { backgroundColor: theme.text + '20' }]} />
            <Text style={[styles.section, { color: theme.text }]}>Posted By</Text>
            <View style={styles.postedByRow}>
              {ownerObj.profileImageUrl && (
                <Image source={{ uri: ownerObj.profileImageUrl }} style={styles.ownerAvatar} />
              )}
              <Text style={[styles.body, { color: theme.text }]}>{ownerObj.name} on {new Date(listing.postedDate).toLocaleDateString()}</Text>
            </View>
          </>
        )}
        {showChat && ownerObj && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={() => {
              if (!firebaseUser) {
                Alert.alert('Please log in to chat');
                return;
              }
              if (!ownerId) {
                Alert.alert('Cannot start chat: owner ID missing');
                return;
              }
              router.push({
                pathname: '/chat/new',
                params: {
                  recipientId: ownerId,
                  recipientName: ownerObj.name,
                  listingId: listingId,
                },
              });
            }}
          >
            <Ionicons name="chatbubbles-outline" size={20} color={theme.background} style={{ marginRight: 8 }} />
            <Text style={[styles.actionButtonText, { color: theme.background }]}>Chat with {ownerObj.name}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Detail({
  label,
  value,
  icon,
  theme,
}: {
  label: string;
  value?: string | number | boolean;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  theme: typeof Colors.light | typeof Colors.dark;
}) {
  if (value == null || (typeof value === 'string' && !value.trim())) return null;
  return (
    <View style={styles.detail}>
      <Ionicons name={icon} size={20} color={theme.primary} />
      <View style={{ marginLeft: 8 }}>
        <Text style={[styles.subLabel, { color: theme.text + '99' }]}>{label}</Text>
        <Text style={[styles.subValue, { color: theme.text }]}>{value.toString()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  gallery: { height: 240, backgroundColor: '#f0f0f0' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: 'bold' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  locationText: { marginLeft: 4, fontSize: 14, textDecorationLine: 'underline' },
  rent: { fontSize: 28, fontWeight: 'bold', marginVertical: 12 },
  sep: { height: StyleSheet.hairlineWidth, marginVertical: 20 },
  section: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  body: { fontSize: 16, lineHeight: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  detail: { flexDirection: 'row', width: '48%', marginBottom: 16, alignItems: 'center' },
  subLabel: { fontSize: 14 },
  subValue: { fontSize: 16, fontWeight: '500' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  tagChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, marginRight: 8, marginBottom: 8 },
  tagText: { fontSize: 14 },
  postedByRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  ownerAvatar: { width: 30, height: 30, borderRadius: 15, marginRight: 10, backgroundColor: '#e0e0e0' },
  actionButton: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginTop: 20,
  },
  actionButtonText: { fontSize: 16, fontWeight: 'bold' },

  // --- NEW: retry button styles ---
  retryButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
