import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme() || 'light';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        tabBarInactiveTintColor: Colors[colorScheme].tabIconDefault,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors[colorScheme].background,
          borderTopColor: Colors[colorScheme].text + '20',
        }
      }}>
      <Tabs.Screen
        name="home" // HomeScreen
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="chats" // ChatsListScreen
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} color={color} size={size} />
          ),
        }}
      />

      {/* NEW "MY LISTINGS" TAB */}
      <Tabs.Screen
        name="myListings" // This will look for app/(tabs)/myListings.tsx
        options={{
          title: 'My Listings',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'list-circle' : 'list-circle-outline'} color={color} size={size} />
          ),
        }}
      />

      {/* --- NEW WISHLIST TAB --- */}
      <Tabs.Screen
        name="wishlist" // This will render app/(tabs)/wishlist.tsx
        options={{
          title: 'Wishlist',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'heart' : 'heart-outline'} color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile" // ProfileScreen
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
