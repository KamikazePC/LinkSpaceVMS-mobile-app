import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import QRCodeScanner from '../../components/qr-code-scanner-expo-camera';
import { handleInviteScan } from '../../lib/invite';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { lightColors, darkColors } from '../../constants/ThemeColors';

export default function ScanQRScreen() {
  const router = useRouter();
  const { actionType } = useLocalSearchParams();
  const [processing, setProcessing] = useState(false);
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? darkColors : lightColors;

  const handleScan = async (data) => {
    if (processing) return;
    setProcessing(true);

    try {
      // First, fetch the invite details without performing any action
      const inviteDetails = await handleInviteScan(data, 'fetch');

      // // Check if it's a utility invite
      // if (inviteDetails.invite_type === 'utility') {
      //   throw new Error('QR code scanning is not supported for utility invites.');
      // }

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
      const processedInvite = await handleInviteScan(data, actionType);

      router.push({
        pathname: '/inviteData',
        params: { invite: JSON.stringify(processedInvite), actionType },
      });
    } catch (error) {
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