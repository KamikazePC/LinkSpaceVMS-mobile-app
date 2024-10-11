import React from 'react';
import QRCode from 'react-native-qrcode-svg';
import { View, Text, StyleSheet } from 'react-native';

// Define the type for inviteData
interface InviteData {
  id?: string; // id is optional
  otp?: string; // otp is optional
}

interface URIQRCodeGeneratorProps {
  inviteData: InviteData; // props should have inviteData of type InviteData
}

const URIQRCodeGenerator: React.FC<URIQRCodeGeneratorProps> = ({ inviteData }) => {
  console.log('QR Code Generator received data:', JSON.stringify(inviteData, null, 2));

  if (!inviteData || (!inviteData.id && !inviteData.otp)) {
    console.error('Invalid invite data for QR code generation:', inviteData);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: Unable to generate QR code</Text>
        <Text style={styles.errorText}>Received data: {JSON.stringify(inviteData)}</Text>
      </View>
    );
  }

  const qrData = `gatekeeper://invite?id=${inviteData.id || ''}&otp=${inviteData.otp || ''}`;

  return (
    <View style={styles.container}>
      <QRCode
        value={qrData}
        size={250}
        color="#000000"
        backgroundColor="#ffffff"
        ecl="M"  // Error correction level
      />
    </View>
  );
};

// Styles for the component
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
  },
});

export default URIQRCodeGenerator;
