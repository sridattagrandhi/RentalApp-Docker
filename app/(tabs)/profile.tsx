// app/(tabs)/profile.tsx
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import { signOut, updateEmail, updateProfile } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { FIREBASE_AUTH } from '../../constants/firebaseConfig';

import ThemedText from '../../components/ThemedText';
import ThemedView from '../../components/ThemedView';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { useColorScheme } from '../../hooks/useColorScheme';
import { styles } from './profile.styles';

// ✅ One source of truth for API URL
import { BASE_URL } from '../../constants/api';

interface EditableFieldProps {
  label: string;
  value?: string;
  onSave: (v: string) => Promise<void>;
  placeholder?: string;
  keyboardType?: any;
  multiline?: boolean;
  themeColors: typeof Colors.light | typeof Colors.dark;
}

const EditableField: React.FC<EditableFieldProps> = ({
  label, value, onSave, placeholder, keyboardType, multiline, themeColors
}) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => { setVal(value || ''); }, [value]);

  const save = async () => {
    setSaving(true);
    try {
      await onSave(val);
      setEditing(false);
    } catch (e: any) {
      Alert.alert('Update failed', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.infoItem, editing && styles.infoItemEditable]}>
      <View style={{ flex: 1 }}>
        <ThemedText style={[styles.label, { color: themeColors.text + '99' }]}>
          {label}
        </ThemedText>
        {editing ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              style={[
                styles.textInput,
                multiline && styles.bioInput,
                { borderBottomColor: themeColors.primary, color: themeColors.text }
              ]}
              value={val}
              onChangeText={setVal}
              placeholder={placeholder || ''}
              placeholderTextColor={themeColors.text + '70'}
              keyboardType={keyboardType}
              multiline={multiline}
              autoFocus
              editable={!saving}
            />
            <TouchableOpacity onPress={save} disabled={saving} style={styles.saveButtonContainer}>
              <View style={[
                styles.saveButton,
                { backgroundColor: saving ? themeColors.tabIconDefault : themeColors.primary }
              ]}>
                <Text style={[styles.saveButtonText, { color: themeColors.background }]}>
                  {saving ? 'Saving...' : 'Save'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <ThemedText style={[styles.valueText, { color: themeColors.text }]}>
              {value || ''}
            </ThemedText>
            <TouchableOpacity onPress={() => setEditing(true)} style={styles.editIconTouchable}>
              <Ionicons name="pencil-outline" size={20} color={themeColors.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

export default function ProfileScreen() {
  const router = useRouter();
  const theme = Colors[useColorScheme() || 'light'];
  const { firebaseUser, mongoUser, isLoading } = useAuth();
  const [uri, setUri] = useState<string | undefined>(
    mongoUser?.profileImageUrl || firebaseUser?.photoURL || undefined
  );

  useEffect(() => {
    setUri(mongoUser?.profileImageUrl || firebaseUser?.photoURL);
  }, [mongoUser, firebaseUser]);

  const patchProfile = async (body: Record<string, any>) => {
    const token = await firebaseUser!.getIdToken();
    const res = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
  };

  const pickAsync = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5
    });
    if (!res.canceled && res.assets.length > 0 && firebaseUser) {
      const newUri = res.assets[0].uri;
      setUri(newUri);

      try {
        await updateProfile(firebaseUser, { photoURL: newUri });
        await patchProfile({ profileImageUrl: newUri });
        Alert.alert('Profile picture updated');
      } catch {
        Alert.alert('Cannot update picture');
        setUri(mongoUser?.profileImageUrl || firebaseUser.photoURL!);
      }
    }
  };

  if (isLoading) {
    return (
      <ActivityIndicator
        style={{ flex: 1 }}
        size="large"
        color={theme.primary}
      />
    );
  }

  const logout = async () => {
    try {
      await signOut(FIREBASE_AUTH);
      router.replace('/(auth)/login');
    } catch {
      Alert.alert('Logout failed');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: 'My Profile',
          headerStyle: { backgroundColor: theme.background },
          headerTitleStyle: { color: theme.text },
          headerShadowVisible: Platform.OS === 'ios'
        }}
      />
      <ThemedView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={pickAsync} style={styles.avatarContainer}>
            <Image
              source={uri ? { uri } : require('../../assets/images/avatar.png')}
              style={[styles.profileImage, { borderColor: theme.primary }]}
            />
            <View style={styles.cameraIconOverlay}>
              <Ionicons name="camera-outline" size={20} color={theme.primary} />
            </View>
          </TouchableOpacity>

          <ThemedText style={[styles.userName, { color: theme.text }]}>
            {mongoUser?.name || firebaseUser?.displayName || ''}
          </ThemedText>
          <ThemedText style={[styles.userEmail, { color: theme.text + 'AA' }]}>
            {mongoUser?.email || firebaseUser?.email || ''}
          </ThemedText>

          <View style={styles.infoSection}>
            <EditableField
              label="Full Name"
              value={mongoUser?.name || firebaseUser?.displayName}
              onSave={async v => {
                await updateProfile(firebaseUser!, { displayName: v });
                await patchProfile({ name: v });
              }}
              placeholder="Your name"
              themeColors={theme}
            />

            <EditableField
              label="Email"
              value={mongoUser?.email || firebaseUser?.email}
              onSave={async v => {
                await updateEmail(firebaseUser!, v); // requires recent login in some cases
                await patchProfile({ email: v });
              }}
              keyboardType="email-address"
              placeholder="you@example.com"
              themeColors={theme}
            />
          </View>

          <View style={styles.actionsSection}>
            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
              <Ionicons name="log-out-outline" size={22} color={theme.accent} />
              <Text style={[styles.logoutText, { color: theme.accent }]}>
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}
