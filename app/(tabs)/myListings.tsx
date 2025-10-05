// app/(tabs)/myListings.tsx
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  GestureHandlerRootView,
  RectButton,
  Swipeable,
} from 'react-native-gesture-handler';

import { Colors } from '../../constants/Colors';
import { Listing } from '../../constants/Types';
import { useAuth } from '../../context/AuthContext';
import { useColorScheme } from '../../hooks/useColorScheme';

// Fallback to localhost if EXPO_PUBLIC_DEV_URL is undefined.  For Android
// emulators use 10.0.2.2 to reach the host.  Parse EXPO_PUBLIC_DEV_URL to
// extract the hostname and enforce port 5001.  In production we call our
// deployed backend.
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

export default function MyListingsScreen() {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const theme = Colors[useColorScheme() || 'light'];

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (refresh = false) => {
      if (!firebaseUser) {
        setListings([]);
        setLoading(false);
        return;
      }
      if (!refresh) setLoading(true);

      try {
        const token = await firebaseUser.getIdToken();
        const res = await fetch(`${BASE_URL}/api/listings/my-listings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        const data: Array<Listing & { _id?: string }> = await res.json();
        const normalized = data.map(l => ({
          ...l,
          id: l.id ?? l._id ?? '',
        }));
        setListings(normalized);
      } catch (err: any) {
        console.error('Fetch my listings failed:', err);
        Alert.alert('Error', 'Could not load your listings.');
      } finally {
        setLoading(false);
      }
    },
    [firebaseUser]
  );

  useFocusEffect(
    useCallback(() => {
      load(false);
    }, [load])
  );

  const deleteListing = (id: string) => {
    Alert.alert(
      'Delete Listing',
      'Are you sure you want to delete this listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await firebaseUser!.getIdToken();
              const res = await fetch(`${BASE_URL}/api/listings/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              if (!res.ok) throw new Error('Delete failed');
              load(true);
            } catch (err) {
              console.error('Delete failed', err);
              Alert.alert('Error', 'Could not delete listing.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView
          style={{ flex: 1, justifyContent: 'center', backgroundColor: theme.background }}
        >
          <ActivityIndicator size="large" color={theme.primary} />
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <Stack.Screen
          options={{
            title: 'My Listings',
            headerStyle: { backgroundColor: theme.background },
            headerTitleStyle: { color: theme.text },
            headerRight: () => (
              <TouchableOpacity
                onPress={() => router.push('/rentals/post-room')}
                style={{ marginRight: 15 }}
              >
                <Ionicons name="add-circle-outline" size={26} color={theme.primary} />
              </TouchableOpacity>
            ),
          }}
        />

        <FlatList
          data={listings}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => load(true)}
              tintColor={theme.primary}
            />
          }
          renderItem={({ item }) => (
            <Swipeable
              renderRightActions={() => (
                <RectButton
                  style={{
                    backgroundColor: 'red',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: 80,
                  }}
                  onPress={() => deleteListing(item.id)}
                >
                  <Ionicons name="trash-outline" size={24} color="#fff" />
                </RectButton>
              )}
            >
              <TouchableOpacity
                style={{
                  margin: 10,
                  backgroundColor: theme.background,
                  borderRadius: 8,
                  padding: 10,
                  shadowColor: '#000',
                  shadowOpacity: 0.1,
                }}
                onPress={() =>
                  router.push({
                    pathname: '/listings/[listingId]',
                    params: { listingId: item.id, from: 'myListings' },
                  })
                }
              >
                <Image
                  source={{ uri: item.image }}
                  style={{ width: '100%', height: 150, borderRadius: 8 }}
                />
                <Text
                  style={{
                    marginTop: 8,
                    color: theme.text,
                    fontSize: 16,
                    fontWeight: '600',
                  }}
                >
                  {item.title}
                </Text>

                {/* This conditional check prevents the app from crashing on old data */}
                {item.address && (
                  <Text style={{ color: theme.text + '99' }}>
                    {item.address.locality}, {item.address.city}
                  </Text>
                )}

                <Text style={{ color: theme.primary, marginTop: 4 }}>
                  ₹{item.rent.toLocaleString()}/mo
                </Text>

                <TouchableOpacity
                  onPress={() => router.push(`/listings/${item.id}/edit`)}
                  style={{ position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 15, padding: 4 }}
                >
                  <Ionicons name="pencil-outline" size={20} color={'#fff'} />
                </TouchableOpacity>
              </TouchableOpacity>
            </Swipeable>
          )}
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 }}>
              <Ionicons name="home-outline" size={60} color={theme.text + '70'} />
              <Text style={{ color: theme.text, marginTop: 10, fontSize: 16 }}>You haven't posted any listings yet.</Text>
            </View>
          }
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}