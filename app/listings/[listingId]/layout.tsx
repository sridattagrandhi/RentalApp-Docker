// app/listings/[listingId]/layout.tsx
import React from 'react'
import { Slot, Stack, useLocalSearchParams } from 'expo-router'

export default function ListingDetailLayout() {
  // grab the dynamic param if you want to e.g. set the header title
  const { listingId } = useLocalSearchParams<{ listingId: string }>()

  return (
    <Stack>
      {/* you can customize the header here if you want */}
      <Stack.Screen 
        name="index"
        options={{ 
          headerBackTitle: 'Back',
          // title: `Listing ${listingId}` // if you want
        }}
      />
      <Stack.Screen 
        name="edit"
        options={{ 
          headerBackTitle: 'Back',
          title: 'Edit Listing'
        }}
      />
      <Slot />
    </Stack>
  )
}
