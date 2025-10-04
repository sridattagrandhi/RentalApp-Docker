import { Link, Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

// Assuming your ThemedText component is located here:
import ThemedText from '../components/ThemedText';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

export default function NotFoundScreen() {
  const colorScheme = useColorScheme() || 'light';
  const currentThemeColors = Colors[colorScheme];

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={[styles.container, { backgroundColor: currentThemeColors.background }]}>
        {/* Use ThemedText with style prop, not type prop */}
        <ThemedText style={styles.title}>This screen doesn't exist.</ThemedText>

        <Link href="/" asChild>
          <TouchableOpacity style={styles.link}>
            <Text style={[styles.linkText, { color: currentThemeColors.primary }]}>
              Go to home screen!
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});