// app/(tabs)/chats.styles.ts
import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
    safeArea: { 
        flex: 1 
    },
    // --- General Containers ---
    emptyContainer: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: 20,
        paddingBottom: 80, // Give more space from the tab bar
    },
    // --- Search Bar ---
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12, // Slightly more rounded
        height: 44,
        // Using shadow for depth instead of a border
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    // --- Chat List Item ---
    chatItemContainer: { 
        flexDirection: 'row', 
        paddingHorizontal: 16, 
        paddingVertical: 14, // Increased vertical padding
        alignItems: 'center',
    },
    avatar: { 
        width: 56, 
        height: 56, 
        borderRadius: 28, 
        marginRight: 14, 
    },
    textContainer: { 
        flex: 1, 
        justifyContent: 'center' 
    },
    recipientName: { 
        fontSize: 17, 
        fontWeight: '600', 
        marginBottom: 3,
    },
    // --- NEW: Style for the subtitle (e.g., "Listing: Cozy Apartment") ---
    chatSubtitle: {
        fontSize: 13,
        marginBottom: 4,
    },
    lastMessageText: { 
        fontSize: 14,
        fontWeight: '400',
    },
    metaContainer: { 
        alignItems: 'flex-end',
        justifyContent: 'space-between', // Align timestamp and badge
        height: '100%',
        paddingVertical: 2,
    },
    timestamp: { 
        fontSize: 12, 
    },
    unreadBadge: { 
        minWidth: 22, 
        height: 22, 
        borderRadius: 11, 
        justifyContent: 'center', 
        alignItems: 'center', 
        paddingHorizontal: 6,
        // Adding a subtle shadow to the badge
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
        elevation: 2,
    },
    unreadText: { 
        color: 'white', 
        fontSize: 12, 
        fontWeight: 'bold',
    },
    separator: { 
        height: StyleSheet.hairlineWidth, // Thinner separator
        marginLeft: 86, // Align with text content
        marginRight: 16,
    },
    // --- Empty State ---
    emptyText: { 
        fontSize: 18, 
        fontWeight: '500', 
        marginTop: 16,
        textAlign: 'center',
    },
    emptySubText: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
        maxWidth: '80%',
    },
    // --- NEW: Styles for Swipe-to-Delete Action ---
    deleteAction: {
        backgroundColor: '#FF3B30', // A standard iOS destructive red
        justifyContent: 'center',
        alignItems: 'center',
        width: 85,
    },
    deleteText: {
        color: 'white',
        fontSize: 12,
        marginTop: 4,
    }
});
