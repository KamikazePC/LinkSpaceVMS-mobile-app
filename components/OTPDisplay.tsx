import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

// Define types for props
interface OTPDisplayProps {
  otp: string; // The OTP string to display
  colors: {
    border: string; // Border color
    background: string; // Background color
    text: string; // Text color
    primary: string; // Primary color for the copy button icon
  };
  onCopy: () => void; // Callback function to be called when OTP is copied
}

const OTPDisplay: React.FC<OTPDisplayProps> = ({ otp, colors, onCopy }) => {
  const handleCopy = async () => {
    await Clipboard.setStringAsync(otp);
    onCopy();
  };

  return (
    <View style={styles.otpContainer}>
      <View style={styles.otpBoxesContainer}>
        {otp.split('').map((digit, index) => (
          <View
            key={index}
            style={[styles.otpBox, { borderColor: colors.border, backgroundColor: colors.background }]}
          >
            <Text style={[styles.otpText, { color: colors.text }]}>{digit}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity onPress={handleCopy} style={styles.copyButton}>
        <MaterialIcons name="content-copy" size={24} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  otpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  otpBoxesContainer: {
    flexDirection: 'row',
  },
  otpBox: {
    width: 40,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  otpText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  copyButton: {
    marginLeft: 10,
    padding: 10,
  },
});

export default OTPDisplay;
