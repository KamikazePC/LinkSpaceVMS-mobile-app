import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RouteParamInput, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { lightColors, darkColors } from '../../../constants/ThemeColors';

const VerifyCodeScreen: React.FC = () => {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? darkColors : lightColors;

  const handleNavigate = (path: string, params?: RouteParamInput<string>  ) => {
    router.push({ pathname: path,  params: params || {}  });
  };

  type ActionButtonProps = {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
  };

  const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, onPress }) => (
    <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={onPress}>
      <Ionicons name={icon} size={24} color={colors.surface} />
      <Text style={[styles.buttonText, { color: colors.surface }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Verify Code</Text>
      <View style={styles.content}>
        <View style={[styles.panel, { backgroundColor: colors.surface }]}>
          <Text style={[styles.panelTitle, { color: colors.text }]}>Check In</Text>
          <ActionButton 
            icon="key-outline" 
            label="Input OTP" 
            onPress={() => handleNavigate('inputOTP', { actionType: 'checkin' })} 
          />
          <ActionButton 
            icon="qr-code-outline" 
            label="Scan QR Code" 
            onPress={() => handleNavigate('ScanQRScreen', { actionType: 'checkin' })} 
          />
        </View>
        <View style={[styles.panel, { backgroundColor: colors.surface }]}>
          <Text style={[styles.panelTitle, { color: colors.text }]}>Check Out</Text>
          <ActionButton 
            icon="key-outline" 
            label="Input OTP" 
            onPress={() => handleNavigate('inputOTP', { actionType: 'checkout' })} 
          />
          <ActionButton 
            icon="qr-code-outline" 
            label="Scan QR Code" 
            onPress={() => handleNavigate('ScanQRScreen', { actionType: 'checkout' })} 
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  panel: {
    width: '100%',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default VerifyCodeScreen;
