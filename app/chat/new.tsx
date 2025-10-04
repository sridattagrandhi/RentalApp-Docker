// app/chat/new.tsx

import React, { useEffect } from 'react';
import { View, ActivityIndicator, SafeAreaView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL } from './[chatId]';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

export default function NewChatDispatcher() {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const theme = Colors[useColorScheme() || 'light'];
  
  // --- MODIFICATION #1: Receive listingId ---
  const { recipientId, recipientName, listingId } = useLocalSearchParams<{
    recipientId: string;
    recipientName: string;
    listingId: string; // <-- Receive the listingId
  }>();

  useEffect(() => {
    if (!firebaseUser || !recipientId) return;

    const findOrCreateChat = async () => {
      try {
        const token = await firebaseUser.getIdToken();
        // The find query on the backend needs the listingId to be specific
        const res = await fetch(`${BASE_URL}/api/chat/find/${recipientId}?listingId=${listingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const existingChat = await res.json();
          router.replace({
            pathname: `/chat/${existingChat._id}` as any,
            params: {
              otherUserId: recipientId,
              recipientName,
              listingId: listingId, // <-- Pass listingId along
            },
          });
        } else if (res.status === 404) {
          router.replace({
            pathname: `/chat/${recipientId}` as any,
            params: {
              otherUserId: recipientId,
              recipientName,
              listingId: listingId, // <-- Pass listingId along
            },
          });
        } else {
          throw new Error('Server error when finding chat');
        }
      } catch (err) {
        Alert.alert('Error', 'Could not start chat.');
        router.back();
      }
    };

    findOrCreateChat();
  }, [firebaseUser, recipientId, recipientName, listingId]);

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
      <Stack.Screen options={{ title: 'Starting Chat...' }} />
      <ActivityIndicator size="large" color={theme.primary} />
    </SafeAreaView>
  );
}