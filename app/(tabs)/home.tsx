// app/(tabs)/index.tsx
import { Ionicons } from '@expo/vector-icons'; // For icons
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Keyboard,
  SafeAreaView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import CityPicker from '../../components/CityPicker'; // Your existing component
import ThemedText from '../../components/ThemedText'; // Assuming this is styled for body text
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme'; // If you want theme-aware elements

import { styles } from './home.styles'; // We'll imagine new styles here

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() || 'light';
  const currentThemeColors = Colors[colorScheme]; // For theme-aware styling

  const [selectedCity, setSelectedCity] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>(''); // For the search bar input

  const handleCitySelection = useCallback((city: string) => {
    setSelectedCity(city);
    setSearchQuery(city); // Update search bar text when a chip is pressed
    Keyboard.dismiss();
  }, []);

  const handleViewListings = () => {
    const cityToSearch = selectedCity || searchQuery; // Prefer selectedCity, fallback to searchQuery
    if (cityToSearch.trim()) {
      router.push({
        pathname: '/rentals/explore', // Assuming this is the correct path
        params: { city: cityToSearch.trim() },
      });
    } else {
      alert('Please select or enter a city first.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentThemeColors.background }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      <View style={styles.contentWrapper}>
        <View style={styles.headerSection}>
          <ThemedText style={[styles.welcomeTitle, { color: currentThemeColors.text }]}>
            Find Your Next Stay
          </ThemedText>
          <ThemedText style={[styles.welcomeSubtitle, { color: currentThemeColors.text }]}>
            Search for rooms in your desired city.
          </ThemedText>
        </View>

        <View style={styles.searchSection}>
          <View style={[styles.searchInputContainer, { backgroundColor: currentThemeColors.background, borderColor: currentThemeColors.primary /* or a muted border */ }]}>
            <Ionicons name="search-outline" size={22} color={currentThemeColors.text} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: currentThemeColors.text }]}
              placeholder="Enter city name..."
              placeholderTextColor={currentThemeColors.tabIconDefault} // Muted color
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                // If user clears search after selecting a city chip, clear selectedCity too
                if (selectedCity && text !== selectedCity) {
                  setSelectedCity('');
                }
              }}
              // onSubmitEditing could also trigger handleViewListings if you want search on enter
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => { setSearchQuery(''); setSelectedCity(''); }} style={styles.clearIconContainer}>
                <Ionicons name="close-circle" size={22} color={currentThemeColors.tabIconDefault} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={styles.cityPickerSection}>
          <ThemedText style={[styles.popularCitiesTitle, { color: currentThemeColors.text }]}>
            Or select a popular city:
          </ThemedText>
          {/* CityPicker will need its internal button styles updated to look like chips */}
          <CityPicker
            onCitySelect={handleCitySelection}
            currentCity={selectedCity}
            // You might pass availableCities prop here if CityPicker is adapted
          />
        </View>

        <View style={styles.footerSection}>
          <TouchableOpacity
            style={[
              styles.viewListingsButton,
              { backgroundColor: (selectedCity.trim() || searchQuery.trim()) ? currentThemeColors.primary : currentThemeColors.tabIconDefault } // Dim if no city
            ]}
            onPress={handleViewListings}
            disabled={!(selectedCity.trim() || searchQuery.trim())}
          >
            <Text style={[styles.viewListingsButtonText, { color: currentThemeColors.background }]}>
              View Listings
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}