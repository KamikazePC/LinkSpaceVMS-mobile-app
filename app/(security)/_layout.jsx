import React from 'react';
import { Stack } from 'expo-router';

export default function ResidentLayout() {
  return (
    <Stack>
    <Stack.Screen name="inputOTP" options={{ 
          headerShown: false 
        }}/>
    <Stack.Screen name="ScanQRScreen" options={{ 
          headerShown: false 
        }}/>
    <Stack.Screen name="inviteData" options={{ 
          headerShown: false 
        }}/>
    <Stack.Screen name="(tabs)"  options={{ 
          headerShown: false 
        }}  />
  </Stack>
  )
}
