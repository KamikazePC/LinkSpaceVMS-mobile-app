import React from 'react';
import { Stack } from 'expo-router';

const ResidentLayout: React.FC = () => {
  return (
    <Stack>
      <Stack.Screen name="inputOTP" options={{ headerShown: false }} />
      <Stack.Screen name="ScanQRScreen" options={{ headerShown: false }} />
      <Stack.Screen name="inviteData" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
};

export default ResidentLayout;
