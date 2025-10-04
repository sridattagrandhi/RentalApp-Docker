// app/chat/[chatId].tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform,
  StyleSheet, Alert, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import io, { Socket } from 'socket.io-client';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { Message } from '../../constants/Types';

type DateSeparator = { type: 'date-separator'; date: string; _id: string };
type ChatListItemData = Message | DateSeparator;

function isDateSeparator(item: ChatListItemData): item is DateSeparator {
  return (item as DateSeparator).type === 'date-separator';
}

const formatDisplayDate = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};

const groupMessagesByDate = (messages: Message[]): ChatListItemData[] => {
  if (messages.length === 0) return [];
  const grouped: ChatListItemData[] = [];
  let lastDate: string | null = null;
  messages.forEach(message => {
    const messageDate = new Date(message.timestamp).toDateString();
    if (messageDate !== lastDate) {
      grouped.push({ type: 'date-separator', date: formatDisplayDate(new Date(message.timestamp)), _id: `date-${messageDate}` });
      lastDate = messageDate;
    }
    grouped.push(message);
  });
  return grouped;
};



// Derive the base URL for API calls.  When running with Expo, the
// `EXPO_PUBLIC_DEV_URL` environment variable points to the Metro
// bundler (e.g. "http://192.168.1.10:8081").  We parse the hostname
// and always target port 5001 for our backend.  Android emulators cannot
// resolve `localhost`, so we use `10.0.2.2` if no dev host is detected.
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
// backend is deployed elsewhere.
const PRODUCTION_SERVER_URL = 'https://roomrentalnativeapp-383560472960.us-west2.run.app';
export const BASE_URL = __DEV__
  ? Platform.OS === 'android'
    ? (devHost && devHost !== 'localhost' ? `http://${devHost}:5001` : 'http://10.0.2.2:5001')
    : DEV_SERVER_URL
  : PRODUCTION_SERVER_URL;

export default function ChatScreen() {
  const router = useRouter();
  // --- MODIFICATION #1: Receive listingId ---
  const { chatId: initialChatId, otherUserId, recipientName, listingId } = useLocalSearchParams<{
    chatId?: string; otherUserId: string; recipientName?: string; listingId?: string; // <-- Receive listingId
  }>();
  
  const { firebaseUser } = useAuth();
  const theme = Colors[useColorScheme() || 'light'];

  const [chatId, setChatId]     = useState<string|undefined>(initialChatId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText]         = useState('');
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList<ChatListItemData>>(null);

  const isPlaceholder = !!(chatId && chatId === otherUserId);
  const groupedMessages = useMemo(() => groupMessagesByDate(messages), [messages]);

  const loadMessages = useCallback(async () => {
    if (!chatId || isPlaceholder || !firebaseUser) { setLoading(false); return; }
    setLoading(true);
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`${BASE_URL}/api/chat/${chatId}/messages`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(await res.text());
      const data: Message[] = await res.json();
      setMessages(data);
    } catch (err) {
      Alert.alert('Error', 'Could not load messages');
    } finally {
      setLoading(false);
    }
  }, [chatId, isPlaceholder, firebaseUser]);

  useEffect(() => { loadMessages(); }, [chatId, loadMessages]);

  useEffect(() => {
    if (!firebaseUser) return;
    let socket: Socket;
    (async () => {
      const token = await firebaseUser.getIdToken();
      socket = io(BASE_URL, { auth: { token }, transports: ['websocket'] });
      socketRef.current = socket;
      socket.on('connect', () => { if (chatId && !isPlaceholder) socket.emit('joinRoom', chatId); });
      socket.on('message', (newMsg: Message) => {
        if (isPlaceholder) return;
        setMessages(prev => {
          if (prev.some(m => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
      });
    })();
    return () => { socketRef.current?.disconnect(); };
  }, [firebaseUser, chatId, isPlaceholder]);
  
  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !firebaseUser || sending || !otherUserId) return;
    setSending(true);
    const tempMessageId = `temp_${Date.now()}`;
    if (isPlaceholder) {
      const tempMessage: Message = { _id: tempMessageId, chatId: 'temp-chat', sender: { _id: firebaseUser.uid }, text: trimmed, timestamp: new Date().toISOString() };
      setMessages([tempMessage]);
    }
    try {
      const token = await firebaseUser.getIdToken();
      // --- MODIFICATION #2: Add listingId to the request body ---
      const res = await fetch(`${BASE_URL}/api/chat/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          text: trimmed,
          otherUserId,
          chatId: isPlaceholder ? undefined : chatId,
          listingId: listingId // <-- Send listingId to the backend
        })
      });
      if (!res.ok) throw new Error(await res.text());
      if (isPlaceholder) {
        const newMsgFromServer: Message = await res.json();
        router.setParams({ chatId: newMsgFromServer.chatId });
        setChatId(newMsgFromServer.chatId);
        setMessages([newMsgFromServer]);
        socketRef.current?.emit('joinRoom', newMsgFromServer.chatId);
      }
      setText('');
    } catch (err) {
      Alert.alert('Error', 'Failed to send message');
      if (isPlaceholder) setMessages([]);
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }: { item: ChatListItemData }) => {
    if (isDateSeparator(item)) {
      return (
        <View style={styles.dateSeparatorContainer}>
          <Text style={[styles.dateSeparatorText, { color: theme.background, backgroundColor: theme.text + '30' }]}>{item.date}</Text>
        </View>
      );
    } else {
      const isMe = item.sender._id === firebaseUser?.uid;
      return (
        <View style={[ styles.bubble, isMe ? styles.myBubble : styles.theirBubble, { backgroundColor: isMe ? theme.primary : theme.text + '15' } ]}>
          <Text style={[styles.bubbleText, { color: isMe ? '#fff' : theme.text }]}>{item.text}</Text>
          <Text style={[styles.timestamp, { color: isMe ? '#ffffff99' : theme.text + '80' }]}>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <Stack.Screen options={{ title: recipientName || 'Chat', headerStyle: { backgroundColor: theme.background }, headerTitleStyle: { color: theme.text }, headerTintColor: theme.text, headerBackTitle: 'Back' }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90}>
        {loading ? (
          <View style={styles.centered}><ActivityIndicator size="large" color={theme.primary} /></View>
        ) : (
          <FlatList
            ref={flatListRef} data={groupedMessages} keyExtractor={item => item._id}
            renderItem={renderItem} contentContainerStyle={styles.listContentContainer}
            onContentSizeChange={() => { if (messages.length) { flatListRef.current?.scrollToEnd({ animated: false }); } }}
          />
        )}
        <View style={[styles.inputRow, { borderTopColor: theme.text + '20' }]}>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.text + '40' }]}
            placeholder="Type a message…" placeholderTextColor={theme.text + '50'}
            value={text} onChangeText={setText} multiline editable={!sending}
            blurOnSubmit={false} onSubmitEditing={handleSend}
          />
          <TouchableOpacity onPress={handleSend} disabled={!text.trim() || sending} style={[styles.sendButton, { opacity: sending ? 0.5 : 1 }]}>
            {sending ? <ActivityIndicator size="small" color={theme.primary}/> : <Ionicons name="send" size={24} color={theme.primary}/>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered:            { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContentContainer:{ paddingHorizontal: 12, flexGrow: 1, justifyContent: 'flex-end' },
  bubble:              { marginVertical: 6, padding: 12, borderRadius: 18, maxWidth: '80%' },
  myBubble:            { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  theirBubble:         { alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  bubbleText:          { fontSize: 16, lineHeight: 22 },
  timestamp:           { fontSize: 11, marginTop: 4, alignSelf: 'flex-end' },
  inputRow:            { flexDirection: 'row', padding: 10, borderTopWidth: 1, alignItems: 'center' },
  input:               { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, marginRight: 8 },
  sendButton:          { justifyContent: 'center', padding: 8 },
  dateSeparatorContainer: { alignItems: 'center', marginVertical: 12 },
  dateSeparatorText: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, fontSize: 12, fontWeight: '600', overflow: 'hidden' },
});