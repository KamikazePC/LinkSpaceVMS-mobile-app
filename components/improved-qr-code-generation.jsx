import React from 'react';
import QRCode from 'react-native-qrcode-svg';
import { View, Text } from 'react-native';

const URIQRCodeGenerator = ({ inviteData }) => {
  console.log('QR Code Generator received data:', JSON.stringify(inviteData, null, 2));

  if (!inviteData || (!inviteData.id && !inviteData.id) || !inviteData.otp) {
    console.error('Invalid invite data for QR code generation:', inviteData);
    return (
      <View style={{ alignItems: 'center', padding: 20 }}>
        <Text style={{ color: 'red' }}>Error: Unable to generate QR code</Text>
        <Text style={{ color: 'red' }}>Received data: {JSON.stringify(inviteData)}</Text>
      </View>
    );
  }

  const qrData = `gatekeeper://invite?id=${inviteData.id || inviteData.id }&otp=${inviteData.otp}`;

  return (
    <View style={{ alignItems: 'center', padding: 20 }}>
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

export default URIQRCodeGenerator;