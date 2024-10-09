import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { account } from '../../lib/auth';
import CustomAlert from '../../components/CustomAlert';
// import { validateEmail } from '../../utils/validation';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, type: '', message: '' });
  const router = useRouter();

  const showAlert = useCallback((type, message) => {
    setAlertConfig({ visible: true, type, message });
  }, []);

  const handleSendOTP = useCallback(async () => {
    if (!email) {
      showAlert('error', 'Please enter your email address');
      return;
    }

    // if (!validateEmail(email)) {
    //   showAlert('error', 'Please enter a valid email address');
    //   return;
    // }

    setIsSubmitting(true);
    try {
      await account.createRecovery(email, '');
      showAlert('success', 'Recovery email sent. Check your inbox for the OTP.');
      router.push({ pathname: '/reset-password', params: { email } });
    } catch (error) {
      showAlert('error', error.message || 'Failed to send recovery email');
    } finally {
      setIsSubmitting(false);
    }
  }, [email, router, showAlert]);

  const closeAlert = useCallback(() => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCompleteType="email"
        textContentType="emailAddress"
      />
      <TouchableOpacity
        style={[styles.button, isSubmitting && styles.disabledButton]}
        onPress={handleSendOTP}
        disabled={isSubmitting}
      >
        <Text style={styles.buttonText}>
          {isSubmitting ? 'Sending...' : 'Send Recovery Email'}
        </Text>
      </TouchableOpacity>
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        message={alertConfig.message}
        onClose={closeAlert}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ForgotPassword;