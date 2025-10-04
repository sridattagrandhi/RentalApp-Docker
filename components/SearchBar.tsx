// components/SearchBar.tsx
import React from 'react';
import { View, TextInput, StyleSheet, TextInputProps } from 'react-native'; // TextInputProps can be useful
import { Colors } from '../constants/Colors'; // Assuming you use your Colors

// 1. Define the type for the props SearchBar will receive
// We can extend TextInputProps if we want to allow all standard TextInput props to be passed.
// However, explicitly defining what you use is often cleaner.
type SearchBarProps = {
  placeholder?: string;                       // Already recognized, good to keep it explicit
  onSearchChange: (query: string) => void;   // The function to call when search text changes
  initialValue?: string;                      // Optional: if you want to set an initial search query
  // Add any other specific props SearchBar needs
};

// 2. Use this type for your component's props
export default function SearchBar({
  placeholder,
  onSearchChange,
  initialValue = '', // Default to empty string
}: SearchBarProps) {
  // If you need to manage the text input's state within SearchBar itself
  // (e.g., for debouncing or complex interactions), you can add a useState here.
  // For simple pass-through to onSearchChange, it's not strictly necessary.

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder || "Search..."} // Default placeholder text
        onChangeText={onSearchChange} // This directly calls the function from HomeScreen
        defaultValue={initialValue} // Sets the initial text in the input
        placeholderTextColor={Colors.text} // Use a muted version of your text color if needed
      />
      {/* You could add a search icon here if desired */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background, // Or a slightly off-white for visual separation
    borderRadius: 8,
    paddingHorizontal: 10,
    // Add subtle shadow or border if you like
    // borderWidth: 1,
    // borderColor: Colors.primaryMuted, // if you have such a color
  },
  input: {
    flex: 1,
    height: 45, // A bit taller for better touch target
    color: Colors.text,
    fontSize: 16,
  },
  // Style for a search icon if you add one
});