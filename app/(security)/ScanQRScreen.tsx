import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import QRCodeScanner from '../../components/qr-code-scanner-expo-camera';
import { handleInviteScan } from '../../lib/invite';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { lightColors, darkColors } from '../../constants/ThemeColors';

// Define types for local search params
interface LocalSearchParams {
  actionType?: 'checkin' | 'checkout';
}

// Define types for the invite details object
interface InviteDetails {
  status: string;
  invite_type?: string;
}

// Define the processed invite type if needed
interface ProcessedInvite extends InviteDetails {
  [key: string]: any;
}

export default function ScanQRScreen() {
  const router = useRouter();
  const { actionType } = useLocalSearchParams() as LocalSearchParams;
  const [processing, setProcessing] = useState<boolean>(false);
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? darkColors : lightColors;

  const handleScan = async (data: string) => {
    if (processing) return;
    setProcessing(true);

    try {
      // First, fetch the invite details without performing any action
      const inviteDetails: InviteDetails = await handleInviteScan(data, 'fetch');

      let canProceed = false;

      if (actionType === 'checkin') {
        canProceed = ['pending', 'active'].includes(inviteDetails.status);
      } else if (actionType === 'checkout') {
        canProceed = ['checked-in', 'active'].includes(inviteDetails.status);
      }

      if (!canProceed) {
        throw new Error(`This invite cannot be used for ${actionType}.`);
      }

      // Process the invite with the correct action type
      const processedInvite: ProcessedInvite = await handleInviteScan(data, actionType as 'checkin' | 'checkout');

      router.push({
        pathname: '/inviteData',
        params: { invite: JSON.stringify(processedInvite), actionType },
      });
    } catch (error: any) {
      console.error('Error processing QR code:', error);
      Alert.alert('Error', error.message || 'Failed to process QR code');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <QRCodeScanner onScan={handleScan} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
