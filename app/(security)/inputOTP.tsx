import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { handleInviteScan } from '../../lib/invite';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { lightColors, darkColors } from '../../constants/ThemeColors';
import CustomAlert from '@context/components/CustomAlert';

interface AlertConfig {
  visible: boolean;
  type: 'success' | 'error' | '';
  message: string;
}


export default function InputOTPScreen() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { actionType } = useLocalSearchParams() as { actionType: 'fetch' | 'checkin' | 'checkout' };
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? darkColors : lightColors;
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({
    visible: false,
    type: '',
    message: '',
  });

  const handleAlertClose = useCallback(() => {
    setAlertConfig((prevConfig) => ({ ...prevConfig, visible: false }));
  }, []);

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setAlertConfig({
        visible: true,
        type: 'error',
        message: 'Invalid OTP',
      })
        return;
    }

    setLoading(true);
    try {
        const inviteDetails = await handleInviteScan(otp, actionType);
        // console.log(inviteDetails);

            router.push({
                pathname: '/inviteData',
                params: { invite: JSON.stringify(inviteDetails), actionType },
            });
    } catch (error: any) { // Update the type of error) {
        setAlertConfig({
            visible: true,
            type: 'error',
            message: error.message || 'Failed to verify OTP',
        })
        console.error('Error verifying OTP:', error); // Log error details for debugging
    } finally {
        setLoading(false);
    }
};


return (
  <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
      <Ionicons name="arrow-back" size={24} color={colors.primary} />
    </TouchableOpacity>
    <View style={styles.content}>
      <Ionicons name="key-outline" size={80} color={colors.primary} style={styles.icon} />
      <Text style={[styles.title, { color: colors.text }]}>Enter OTP</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Please enter the 6-digit OTP provided to the visitor
      </Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
        value={otp}
        onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, ''))}
        keyboardType="numeric"
        placeholder="000000"
        placeholderTextColor={colors.textSecondary}
        maxLength={6}
      />
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: colors.primary }, otp.length !== 6 && styles.buttonDisabled]}
        onPress={handleVerifyOTP}
        disabled={otp.length !== 6 || loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.surface} />
        ) : (
          <Text style={[styles.buttonText, { color: colors.surface }]}>Verify OTP</Text>
        )}
      </TouchableOpacity>
    </View>
    <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        message={alertConfig.message}
        onClose={handleAlertClose}
      />
  </SafeAreaView>
);
};

const styles = StyleSheet.create({
container: {
  flex: 1,
},
backButton: {
  margin: 20,
},
content: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 20,
},
icon: {
  marginBottom: 20,
},
title: {
  fontSize: 28,
  marginBottom: 10,
  fontWeight: 'bold',
},
subtitle: {
  fontSize: 16,
  textAlign: 'center',
  marginBottom: 30,
},
input: {
  width: '100%',
  padding: 15,
  borderWidth: 1,
  borderRadius: 10,
  marginBottom: 20,
  fontSize: 24,
  textAlign: 'center',
  letterSpacing: 8,
},
button: {
  width: '100%',
  padding: 15,
  borderRadius: 10,
  alignItems: 'center',
},
buttonDisabled: {
  opacity: 0.5,
},
buttonText: {
  fontSize: 18,
  fontWeight: 'bold',
},
});