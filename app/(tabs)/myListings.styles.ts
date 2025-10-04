import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: { // For ThemedView
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
  listContentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  myListingCard: { // Similar to ListingCard but might have an edit button
    borderRadius: 10,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2.5,
    // backgroundColor will be themed
  },
  cardContent: {
    flexDirection: 'row',
    overflow: 'hidden', // To ensure image corners are rounded with card
  },
  cardImage: {
    width: 100,
    height: 110, // Slightly taller to fit content better
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  infoContainer: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between', // Distribute content vertically
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold', // Or '600'
    marginBottom: 4,
  },
  details: {
    fontSize: 13,
    marginBottom: 2,
    // color will be themed (muted)
  },
  rent: {
    fontSize: 15,
    fontWeight: 'bold',
    // color will be themed (primary)
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Align edit button to the right
    alignItems: 'center',
    marginTop: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    // backgroundColor will be themed (primary or secondary)
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
    // color will be themed (e.g., white or primary text color)
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 10,
    // color will be themed
  },
  emptySubText: {
    fontSize: 14,
    textAlign: 'center',
    // color will be themed (muted)
  },
  postButton: { // For "Post your first listing"
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    // backgroundColor will be themed (primary)
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    // color will be themed (e.g., white)
  }
});