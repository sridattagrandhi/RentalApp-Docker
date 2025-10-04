// app/(tabs)/index.styles.ts
import { StyleSheet, Platform } from 'react-native';
// Colors will be used dynamically in the component for theme-awareness

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  contentWrapper: { // New main wrapper for content
    flex: 1,
    paddingHorizontal: 25,
    paddingTop: Platform.OS === 'ios' ? 20 : 30, // More top padding
    paddingBottom: 20,
  },
  headerSection: {
    marginBottom: 30, // Space below header text
    alignItems: 'center', // Center header text
  },
  welcomeTitle: {
    fontSize: 28, // Larger title
    fontWeight: 'bold', // Use font weights (e.g. '700')
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    // Use a slightly lighter text color from your theme if available
  },
  searchSection: {
    marginBottom: 30,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12, // More rounded corners
    paddingHorizontal: 15,
    height: 55, // Taller search bar
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  clearIconContainer: {
    paddingLeft: 10,
  },
  cityPickerSection: {
    marginBottom: 30,
    // alignItems: 'center', // if CityPicker itself doesn't handle centering its chips
  },
  popularCitiesTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 15,
    textAlign: 'center',
  },
  // You'll need to update styles within CityPicker.tsx for its buttons
  // to look like chips (e.g., more padding, rounded corners, distinct background/border).

  footerSection: {
    marginTop: 'auto', // Pushes the button to the bottom
  },
  viewListingsButton: {
    paddingVertical: 18, // Taller button
    borderRadius: 12,    // More rounded
    alignItems: 'center',
    justifyContent: 'center',
    // Add shadow for a "sleek" effect (platform-specific)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 3,
  },
  viewListingsButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});