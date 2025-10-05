// chats.tsx
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { getExpoPushTokenAsync } from 'expo-notifications';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { GestureHandlerRootView, RectButton, Swipeable } from 'react-native-gesture-handler';
import io, { Socket } from 'socket.io-client';

import { Colors } from '../../constants/Colors';
import { ChatListItem } from '../../constants/Types';
import { useAuth } from '../../context/AuthContext';
import { useColorScheme } from '../../hooks/useColorScheme';
import { styles } from './chats.styles';

// Derive a reliable API base URL.  When using Expo, the env var
// EXPO_PUBLIC_DEV_URL points to the Metro bundler (e.g. "http://192.168.1.10:8081").
// We extract the host and force port 5001 for our backend.  If no host is
// available, default to localhost.  Android emulators cannot reach localhost
// directly, so we use 10.0.2.2 in that case.
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
// Production requests should hit the Cloud Run backend.  Update this if your
// backend is deployed to a different domain.
const PRODUCTION_SERVER_URL =
  'https://rentalapp-docker-383560472960.us-west2.run.app';
const BASE_URL = __DEV__
  ? Platform.OS === 'android'
    ? (devHost && devHost !== 'localhost' ? `http://${devHost}:5001` : 'http://10.0.2.2:5001')
    : DEV_SERVER_URL
  : PRODUCTION_SERVER_URL;

// --- Helper to normalize permission result across Expo SDK/type variants ---
function normalizePermissionStatus(
  p: unknown
): Notifications.PermissionStatus {
  const obj = p as any; // intentionally loosened for cross-SDK compatibility
  if (obj && typeof obj.status === 'string') {
    return obj.status as Notifications.PermissionStatus;
  }
  if (obj && typeof obj.granted === 'boolean') {
    return obj.granted
      ? Notifications.PermissionStatus.GRANTED
      : Notifications.PermissionStatus.DENIED;
  }
  return Notifications.PermissionStatus.UNDETERMINED;
}

export default function ChatsScreen() {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const theme = Colors[useColorScheme() || 'light'];
  const socketRef = useRef<Socket | null>(null);

  const [chatItems, setChatItems] = useState<ChatListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredChatItems, setFilteredChatItems] = useState<ChatListItem[]>([]);
  
  const swipeableRefs = useRef<Record<string, Swipeable | null>>({});

  const loadChats = useCallback(async (isRefreshing = false) => {
    if (!firebaseUser) return;
    if (!isRefreshing) setLoading(true);

    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`${BASE_URL}/api/chat/threads`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const data: ChatListItem[] = await res.json();
      setChatItems(data);
    } catch (err) {
      console.error('Failed to load chat threads', err);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredChatItems(chatItems);
    } else {
      const lowercasedTerm = searchTerm.toLowerCase();
      const filtered = chatItems.filter(item => {
        const title = item.listingTitle?.toLowerCase() || '';
        const name = item.recipientName?.toLowerCase() || '';
        return title.includes(lowercasedTerm) || name.includes(lowercasedTerm);
      });
      setFilteredChatItems(filtered);
    }
  }, [searchTerm, chatItems]);

  useFocusEffect(useCallback(() => { loadChats(); }, [loadChats]));

  // --- MODIFICATION: Separate useEffect for WebSocket logic ---
  useEffect(() => {
    if (!firebaseUser) return;
    firebaseUser.getIdToken().then(token => {
      const socket = io(BASE_URL, { auth: { token }, transports: ['websocket'] });
      socketRef.current = socket;
      socket.on('connect', () => console.log('Inbox socket connected'));
      socket.on('chat-activity', () => { loadChats(true); });
      socket.on('disconnect', () => console.log('Inbox socket disconnected'));
    });
    return () => { socketRef.current?.disconnect(); };
  }, [firebaseUser, loadChats]);
  // --- END OF MODIFICATION ---

  // --- NEW: useEffect to handle Push Notifications logic ---
  useEffect(() => {
    const registerForPushNotifications = async () => {
      if (!firebaseUser) return; // Wait for the user to be authenticated

      // Android 13+: ensure a channel exists before prompting
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
        });
      }

      // Get existing permissions (shape can vary by SDK)
      const existing = await Notifications.getPermissionsAsync();
      let finalStatus = normalizePermissionStatus(existing);

      if (finalStatus !== 'granted') {
        const req = await Notifications.requestPermissionsAsync();
        finalStatus = normalizePermissionStatus(req);
      }

      if (finalStatus !== 'granted') {
        Alert.alert('Permission Denied', 'Failed to get push token for push notifications!');
        return;
      }

      try {
        // Provide projectId when available; some setups infer it automatically
        const projectId =
          (Constants as any).expoConfig?.extra?.eas?.projectId ??
          (Constants as any).easConfig?.projectId;

        const pushTokenData = await getExpoPushTokenAsync(projectId ? { projectId } : {});
        const token = pushTokenData.data;
        console.log('Push Token:', token);

        const idToken = await firebaseUser.getIdToken();
        await fetch(`${BASE_URL}/api/users/push-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ token }),
        });
      } catch (err) {
        console.error('Failed to send push token to backend', err);
      }
    };

    registerForPushNotifications();
  }, [firebaseUser]);
  // --- END OF NEW ---

  const handleDelete = async (chatId: string) => {
    Alert.alert(
      'Delete Chat',
      'Are you sure you want to delete this chat thread? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => swipeableRefs.current[chatId]?.close() },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await firebaseUser!.getIdToken();
              const res = await fetch(`${BASE_URL}/api/chat/threads/${chatId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              if (!res.ok) throw new Error('Server responded with an error.');
              setChatItems(currentItems => currentItems.filter(item => item.chatId !== chatId));
            } catch(err) {
              console.error('Delete chat failed:', err);
              Alert.alert('Error', 'Could not delete the chat thread. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleChatPress = (item: ChatListItem) => {
    Object.values(swipeableRefs.current).forEach(ref => ref?.close());
    
    const isMeTheOwner = firebaseUser?.uid === item.listingOwnerFirebaseUID;
    router.push({
      pathname: '/chat/[chatId]',
      params: { 
        chatId: item.chatId, 
        recipientName: isMeTheOwner ? item.recipientName : item.listingTitle || 'Chat',
        otherUserId: item.recipientFirebaseUID 
      },
    });
  };

  const renderRightActions = (chatId: string) => {
    return (
      <RectButton style={styles.deleteAction} onPress={() => handleDelete(chatId)}>
        <Ionicons name="trash-outline" size={24} color="#fff" />
        <Text style={styles.deleteText}>Delete</Text>
      </RectButton>
    );
  };

  if (loading && chatItems.length === 0) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
            <View style={styles.emptyContainer}><ActivityIndicator size="large" color={theme.primary} /></View>
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <Stack.Screen
          options={{
            title: 'Messages',
            headerStyle: { backgroundColor: theme.background },
            headerTitleStyle: { color: theme.text },
            headerShadowVisible: false,
          }}
        />

        <View style={[styles.searchContainer, { backgroundColor: theme.background, shadowColor: theme.text }]}>
          <Ionicons name="search-outline" size={20} color={theme.text + '80'} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search by name or listing..."
            placeholderTextColor={theme.text + '60'}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
        
        {filteredChatItems.length > 0 ? (
          <FlatList
            data={filteredChatItems}
            keyExtractor={(item) => item.chatId}
            renderItem={({ item }) => {
              const isMeTheOwner = firebaseUser?.uid === item.listingOwnerFirebaseUID;
              const titleToDisplay = isMeTheOwner ? item.recipientName : item.listingTitle || 'Conversation';
              const subtitleToDisplay = isMeTheOwner ? `Listing: ${item.listingTitle}` : `From: ${item.recipientName}`;

              const avatarSource = item.recipientAvatar 
                ? { uri: item.recipientAvatar } 
                : require('../../assets/images/avatar.png');

              return (
                <Swipeable
                  ref={ref => { swipeableRefs.current[item.chatId] = ref; }}
                  onSwipeableWillOpen={() => {
                    Object.keys(swipeableRefs.current).forEach(chatId => {
                      if (chatId !== item.chatId && swipeableRefs.current[chatId]) {
                        swipeableRefs.current[chatId]?.close();
                      }
                    });
                  }}
                  renderRightActions={() => renderRightActions(item.chatId)}
                  overshootRight={false}
                >
                  <TouchableOpacity onPress={() => handleChatPress(item)} style={[styles.chatItemContainer, { backgroundColor: theme.background }]}>
                    <Image source={avatarSource} style={styles.avatar} />
                    <View style={styles.textContainer}>
                      <Text style={[styles.recipientName, { color: theme.text }]} numberOfLines={1}>
                        {titleToDisplay}
                      </Text>
                      <Text style={[styles.chatSubtitle, { color: theme.text + 'A0' }]} numberOfLines={1}>
                        {subtitleToDisplay}
                      </Text>
                      <Text style={[styles.lastMessageText, { color: theme.text + '99' }]} numberOfLines={1}>
                        {item.lastMessageText || 'No messages yet'}
                      </Text>
                    </View>
                    <View style={styles.metaContainer}>
                      <Text style={[styles.timestamp, { color: theme.text + '99' }]}>{new Date(item.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                      {item.unreadCount > 0 && (
                        <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}><Text style={styles.unreadText}>{item.unreadCount}</Text></View>
                      )}
                    </View>
                  </TouchableOpacity>
                </Swipeable>
              )
            }}
            ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: theme.text + '15' }]} />}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={() => loadChats(true)} tintColor={theme.primary} />}
          />
        ) : (
          <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={60} color={theme.text + '70'} />
              <Text style={[styles.emptyText, { color: theme.text + 'AA' }]}>
                {searchTerm ? 'No chats found' : 'No Chats Yet'}
              </Text>
              <Text style={[styles.emptySubText, { color: theme.text + '80' }]}>
                {searchTerm ? 'Try a different search term.' : 'When you start a conversation about a listing, it will appear here.'}
              </Text>
          </View>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
