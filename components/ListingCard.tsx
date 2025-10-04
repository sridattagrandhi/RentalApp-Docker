// components/ListingCard.tsx
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Listing } from '../constants/Types';
import { Colors } from '../constants/Colors';
import ThemedText from './ThemedText';

// The interface is updated to include props for the wishlist feature
interface ListingCardProps {
  listing: Listing;
  onPress: () => void;
  isFavorite: boolean; // True if the listing is in the user's wishlist
  onToggleFavorite: () => void; // Function to call when the heart icon is pressed
  themeColors: typeof Colors.light; // Pass theme colors for consistent styling
}

export default function ListingCard({
  listing,
  onPress,
  isFavorite,
  onToggleFavorite,
  themeColors,
}: ListingCardProps) {
  // This stops the main card's onPress from firing when the heart is tapped
  const handleHeartPress = (e: any) => {
    e.stopPropagation(); // Prevent event from bubbling up to the parent TouchableOpacity
    onToggleFavorite();
  };

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: themeColors.background }]} onPress={onPress}>
      <Image
        source={listing.image ? { uri: listing.image } : require('../assets/images/react-logo.png')}
        style={styles.image}
        onError={() => console.log("Failed to load image:", listing.image)}
      />
      
      {/* Heart (Wishlist) Icon */}
      <TouchableOpacity style={styles.favoriteIconContainer} onPress={handleHeartPress}>
        <Ionicons
          name={isFavorite ? 'heart' : 'heart-outline'}
          size={24}
          color={isFavorite ? '#E53935' : '#FFFFFF'} // Red when favorite, white when not
          style={styles.favoriteIcon}
        />
      </TouchableOpacity>

      <View style={styles.infoContainer}>
        <ThemedText style={[styles.price, { color: themeColors.primary }]}>
          ₹{listing.rent.toLocaleString()}
        </ThemedText>
        <ThemedText style={styles.title} numberOfLines={1}>
          {listing.title || `${listing.type}`}
        </ThemedText>
        {listing.address && (
          <ThemedText style={styles.details} numberOfLines={1}>
            {listing.address.locality}, {listing.address.city}
          </ThemedText>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: '#fff', // Default background
  },
  image: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: '#e0e0e0',
  },
  favoriteIconContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1, // Ensures the icon is tappable above the image
  },
  favoriteIcon: {
    // Add a subtle shadow to the icon to make it pop against any background
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  infoContainer: {
    padding: 14,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  details: {
    fontSize: 14,
    color: '#666',
  },
});
