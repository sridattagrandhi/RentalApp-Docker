import { ChatListItem, Listing, Message, UserProfile } from './Types'; // Ensure Types.ts has all necessary fields

export let mockListings: Listing[] = [
  {
    id: '1', // This is a clean ID
    title: 'Spacious 2 BHK in Andheri East',
    city: 'Mumbai',
    locality: 'Andheri East',
    rent: 12000,
    type: 'Apartment',
    bedrooms: 2,
    bathrooms: 2,
    areaSqFt: 950,
    furnishingStatus: 'semi-furnished',
    preferredTenants: ['family', 'bachelors'],
    amenities: ['Parking', 'Elevator'],
    description: 'A well-ventilated 2 BHK apartment with ample sunlight. Close to metro and market.',
    additionalInfo: 'Society has 24/7 security.',
    image: 'https://placehold.co/600x400/EFEFEF/AAAAAA&text=Modern+2BHK',
    imageUris: [
        'https://placehold.co/600x400/EFEFEF/AAAAAA&text=Modern+2BHK',
        'https://placehold.co/600x400/EFEFEF/AAAAAA&text=Living+Room',
        'https://placehold.co/600x400/EFEFEF/AAAAAA&text=Bedroom+1'
    ],
    ownerId: 'owner_alice_001',
    isAvailable: true,
    postedDate: '2024-05-20',
  },
  // Ensure other mock listings also have clean IDs and valid image/imageUris
];

export const findListingById = (id: string | undefined): Listing | undefined => {
  if (!id) return undefined;
  return mockListings.find(listing => listing.id === id);
};

export const addMockListing = (newListingData: Omit<Listing, 'id' | 'ownerId'>): Listing => {
  const newId = `mock-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const listingWithId: Listing = {
    ...newListingData,
    id: newId,
    ownerId: MOCK_CURRENT_USER_ID, // Assign current user as owner
    // Ensure all required fields from Listing type are present in newListingData or defaulted here
    // For example, if 'imageUris' is required but not always in newListingData:
    imageUris: newListingData.imageUris || (newListingData.image ? [newListingData.image] : []),
    // Default other potentially missing required fields if necessary
    isAvailable: newListingData.isAvailable !== undefined ? newListingData.isAvailable : true,
    postedDate: newListingData.postedDate || new Date().toISOString(),
  };
  mockListings.unshift(listingWithId); // Add to the beginning to see it easily
  console.log('Added new listing to mockData:', listingWithId);
  return listingWithId;
};


export const MOCK_CURRENT_USER_ID = 'appUser123'; // ID for the person using the app

// Store messages in an object where keys are chat IDs (e.g., ownerId)
export let mockChatMessages: { [chatId: string]: Message[] } = {
  'owner_alice_001': [ // Example chat with owner_alice_001
    { id: 'msg1', text: 'Hi Alice, is your Andheri East flat still available?', senderId: MOCK_CURRENT_USER_ID, timestamp: new Date(Date.now() - 1000 * 60 * 10) },
    { id: 'msg2', text: 'Hello! Yes, it is. Are you interested in a viewing?', senderId: 'owner_alice_001', timestamp: new Date(Date.now() - 1000 * 60 * 9) },
    { id: 'msg3', text: 'Great! When would be a good time?', senderId: MOCK_CURRENT_USER_ID, timestamp: new Date(Date.now() - 1000 * 60 * 8) },
  ],
  'owner_bob_002': [ // Example chat with owner_bob_002
    { id: 'msg4', text: 'Hey Bob, that Bandra West place looks good.', senderId: MOCK_CURRENT_USER_ID, timestamp: new Date(Date.now() - 1000 * 60 * 5) },
  ],
  // Add more mock chats as needed
};

// Function to add a new message to a specific chat
export const addChatMessage = (chatId: string, messageText: string, senderId: string): Message => {
  if (!mockChatMessages[chatId]) {
    mockChatMessages[chatId] = []; // Initialize chat if it doesn't exist
  }
  const newMessage: Message = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    text: messageText,
    senderId: senderId,
    timestamp: new Date(),
  };
  mockChatMessages[chatId].push(newMessage);
  return newMessage;
};

export const mockUserProfile: UserProfile = {
  id: 'user_jane_doe_001',
  name: 'Jane Doe',
  email: 'jane.doe@example.com',
  phone: '555-123-4567',
  bio: 'Loves finding great places to stay and exploring new cities. Looking for quiet and clean roommates.',
  profileImageUrl: 'https://placehold.co/400x400/EFEFEF/AAAAAA&text=JD', // Placeholder image
};

export const updateMockUserProfile = (updatedProfileData: Partial<UserProfile>): UserProfile => {
  // In a real app, you'd send this to a backend.
  // For now, we merge with the existing mockUserProfile.
  // Note: This simple merge won't work if mockUserProfile is 'const'.
  // For a more robust in-memory update, you might re-assign or use a state management solution.
  // For this template, we'll assume for now that direct modification or a more complex state solution would handle this.
  // This example won't directly mutate mockUserProfile to keep it simple for the template.
  // Instead, the component will manage its own editable state.
  console.log("Simulating profile update with:", updatedProfileData);
  // This function would return the updated profile from a backend in a real scenario.
  // For the template, the component will handle its own state changes.
  return { ...mockUserProfile, ...updatedProfileData };
};

// --- NEW FUNCTION TO GET CHAT LIST ITEMS ---
export const getChatListItems = (): ChatListItem[] => {
  const chatList: ChatListItem[] = [];

  for (const chatId in mockChatMessages) {
    const messages = mockChatMessages[chatId];
    if (messages && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      
      // Attempt to find a listing associated with this chatId (ownerId)
      // to get a recipient name (e.g., the listing title or owner's name if available)
      // For this example, we'll try to find a listing owned by this chatId.
      // In a real app, you'd have better user data.
      const relatedListing = mockListings.find(listing => listing.ownerId === chatId);
      let recipientName = `Chat with User ${chatId.substring(0, 5)}`; // Default name
      let recipientAvatar = `https://placehold.co/100x100/777777/FFFFFF&text=${chatId.substring(0,1).toUpperCase()}`; // Default avatar

      if (relatedListing) {
        recipientName = relatedListing.title; // Use listing title as chat context
        // If you had owner names in listings or a separate users table:
        // recipientName = findUserNameById(chatId) || relatedListing.title;
      } else {
        // If no listing, maybe it's a direct chat with a user not tied to a listing
        // For now, we use a generic name.
        // If you had a mockUsers array:
        // const user = mockUsers.find(u => u.id === chatId);
        // if (user) recipientName = user.name;
      }


      chatList.push({
        chatId: chatId,
        recipientName: recipientName,
        recipientAvatar: recipientAvatar, // Placeholder, replace with actual user avatar logic
        lastMessageText: lastMessage.text,
        lastMessageTimestamp: lastMessage.timestamp,
        // unreadCount: calculateUnreadMessages(chatId), // Implement this if needed
      });
    }
  }
  // Sort chats by the most recent message
  chatList.sort((a, b) => b.lastMessageTimestamp.getTime() - a.lastMessageTimestamp.getTime());
  return chatList;
};

export const getMyMockListings = (): Listing[] => {
  return mockListings.filter(listing => listing.ownerId === MOCK_CURRENT_USER_ID)
                     .sort((a, b) => new Date(b.postedDate || 0).getTime() - new Date(a.postedDate || 0).getTime()); // Sort by most recent
};

export const updateMockListing = (
  listingId: string,
  updatedData: Partial<Omit<Listing, 'id' | 'ownerId'>> // Cannot change id or ownerId
): Listing | undefined => {
  const listingIndex = mockListings.findIndex(listing => listing.id === listingId && listing.ownerId === MOCK_CURRENT_USER_ID);
  if (listingIndex === -1) {
    console.warn(`Listing with ID ${listingId} not found or not owned by current user.`);
    return undefined; // Listing not found or not owned by current user
  }

  // Merge existing data with updated data
  const updatedListing = {
    ...mockListings[listingIndex],
    ...updatedData,
    // Ensure fields like imageUris are handled correctly if updatedData contains them
    imageUris: updatedData.imageUris || mockListings[listingIndex].imageUris,
    image: updatedData.image || mockListings[listingIndex].image,
  };

  mockListings[listingIndex] = updatedListing;
  console.log('Updated listing in mockData:', updatedListing);
  return updatedListing;
};
