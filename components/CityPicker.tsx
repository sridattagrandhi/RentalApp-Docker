// components/CityPicker.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'; // Add necessary imports
import { Colors } from '../constants/Colors'; // Assuming you might use Colors

// 1. Define the type for the props CityPicker will receive
type CityPickerProps = {
  onCitySelect: (city: string) => void; // The function to call when a city is selected
  currentCity: string | null;          // The currently selected city, to optionally highlight it
  // You can add any other props this component might need below
  // e.g., availableCities?: string[];
};

// 2. Use this type for your component's props
export default function CityPicker({ onCitySelect, currentCity }: CityPickerProps) {
  // This is a placeholder for your actual city picking UI.
  // You'll replace this with your buttons ("Mumbai", "Bangalore"), search input for cities, etc.
  const exampleCities = ["Mumbai", "Bangalore", "Delhi", "Chennai", "Hyderabad", "Pune"]; // Replace with your actual city list or logic

  return (
    <View style={styles.container}>
      {/* Example: Simple list of buttons for city selection */}
      {exampleCities.map((city) => (
        <TouchableOpacity
          key={city}
          style={[
            styles.cityButton,
            currentCity === city && styles.selectedCityButton // Highlight if selected
          ]}
          onPress={() => onCitySelect(city)}
        >
          <Text
            style={[
              styles.cityButtonText,
              currentCity === city && styles.selectedCityButtonText
            ]}
          >
            {city}
          </Text>
        </TouchableOpacity>
      ))}
      {/* Add a text input here if you want to search for cities within CityPicker */}
      {/* Or a dropdown component, etc. */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Add styles for your CityPicker layout
    flexDirection: 'row', // Example: if you want buttons side-by-side
    flexWrap: 'wrap',    // Example: if you want buttons to wrap
    justifyContent: 'space-around',
  },
  cityButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: Colors.background, // Use a subtle background
    borderColor: Colors.primary,
    borderWidth: 1,
    borderRadius: 20, // Make them pill-shaped
    margin: 5,
  },
  selectedCityButton: {
    backgroundColor: Colors.primary, // Highlight selected city with primary color
  },
  cityButtonText: {
    color: Colors.primary, // Text color for non-selected
    textAlign: 'center',
  },
  selectedCityButtonText: {
    color: Colors.background, // Text color for selected (e.g., white)
    fontWeight: 'bold',
  },
  // Add more styles as needed for your specific UI (e.g., an input field)
});