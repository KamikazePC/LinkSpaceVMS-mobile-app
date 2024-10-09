import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  Share,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGlobalContext } from '../../../context/GlobalProvider';
import ViewShot from 'react-native-view-shot';
import type ViewShotRef  from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import moment from 'moment';
import URIQRCodeGenerator from '../../../components/improved-qr-code-generation';
import { useTheme } from '../../../context/ThemeContext';
import { darkColors, lightColors } from '../../../constants/ThemeColors';
import CustomAlert from '../../../components/CustomAlert';
import OTPDisplay from '../../../components/OTPDisplay';

// Interface for the invite data
interface InviteData {
  id: string;
  otp: string;
  visitor_name?: string;
  address: string;
  start_date_time?: string;
  end_date_time?: string;
}

interface AlertConfig {
  visible: boolean;
  type: 'error' | 'success' | '';
  message: string;
}

const InviteDetailScreen: React.FC = () => {
  const { user } = useGlobalContext();
  const { invite } = useLocalSearchParams();
  const viewShotRef = useRef<ViewShotRef>(null);
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? darkColors : lightColors;
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({
    visible: false,
    type: '',
    message: '',
  });
  const [isSharing, setIsSharing] = useState<boolean>(false);

  useEffect(() => {
    try {
      const parsedInvite = typeof invite === 'string' ? JSON.parse(invite) : (invite as unknown as InviteData);
      setInviteData(parsedInvite);
      console.log('Parsed invite data:', parsedInvite);
    } catch (error) {
      console.error('Error parsing invite data:', error, 'Received data:', invite);
      setAlertConfig({
        visible: true,
        type: 'error',
        message: 'Error loading invite data',
      });
    }
  }, [invite]);

  const handleShareOTP = async () => {
    setIsSharing(true);
    if (!inviteData) return;

    try {
      await Share.share({
        message: `
Hi ${inviteData.visitor_name},

Your one-time code is ${inviteData.otp}

Address: ${inviteData.address}
Powered by LinkSpace Ltd
        `,
      });
    } catch (error) {
      setAlertConfig({
        visible: true,
        type: 'error',
        message: 'Failed to share OTP',
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleShareQR = async () => {
    setIsSharing(true);
    if (!viewShotRef.current) return;
    if(viewShotRef.current  && typeof viewShotRef.current.capture === 'function') {
      try {
        const uri = await viewShotRef.current.capture();
        await Sharing.shareAsync(uri, {
          dialogTitle: 'Share QR code',
          mimeType: 'image/png',
        });
      } catch (error) {
        console.error('Error sharing QR code:', error);
        setAlertConfig({
          visible: true,
          type: 'error',
          message: 'Failed to share QR code',
        });
      } finally {
        setIsSharing(false);
      }
    };
   }
    

  if (!inviteData) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text>Loading invite data...</Text>
      </SafeAreaView>
    );
  }

  // Prepare the QR code data
  const qrCodeData = {
    id: inviteData.id,
    otp: inviteData.otp,
  };

  const handleCopyOTP = () => {
    setAlertConfig({
      visible: true,
      type: 'success',
      message: 'OTP copied to clipboard',
    });
  };

  const formatDateTime = (dateTime?: string): string => {
    return dateTime ? moment(dateTime).format('MMM D, YYYY h:mm A') : 'N/A';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Invite Details</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>One Time Pin</Text>
          <OTPDisplay otp={inviteData.otp} colors={colors} onCopy={handleCopyOTP} />
          <TouchableOpacity
            style={[styles.shareButton, { backgroundColor: colors.primary }, isSharing && styles.disabledButton]}
            onPress={handleShareOTP}
            disabled={isSharing}
          >
            {isSharing ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <>
                <MaterialIcons name="content-copy" size={18} color={colors.surface} />
                <Text style={[styles.buttonText, styles.buttonLabel, { color: colors.surface }]}>Share OTP</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>QR Code</Text>
          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }}>
            <View style={styles.qrCodeWrapper}>
              <View style={[styles.qrCodeBackground]}>
                <Text style={[styles.qrInfoText]}>Hi {inviteData.visitor_name}, {user.username} is inviting you!</Text>
                <Text style={[styles.qrInfoText]}>Your one-time code is {inviteData.otp}</Text>
                <URIQRCodeGenerator inviteData={qrCodeData} />
                <Text style={[styles.qrInfoText]}>
                  Please present your code at the estate gate to gain access
                </Text>
                <Text style={[styles.qrInfoText]}>
                  Valid from {formatDateTime(inviteData.start_date_time)} to {formatDateTime(inviteData.end_date_time)}
                </Text>
                <Text style={[styles.qrInfoText]}>Powered by LinkSpace Ltd</Text>
              </View>
            </View>
          </ViewShot>

          <TouchableOpacity
            style={[styles.shareButton, { backgroundColor: colors.primary }, isSharing && styles.disabledButton]}
            onPress={handleShareQR}
            disabled={isSharing}
          >
            {isSharing ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <>
                <Feather name="share-2" size={18} color={colors.surface} />
                <Text style={[styles.buttonText, styles.buttonLabel, { color: colors.surface }]}>Share QR Code</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={[styles.footer, { color: colors.textSecondary }]}>
          You have granted access to the visitor. Share the QR code or OTP.
        </Text>
      </ScrollView>
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        message={alertConfig.message}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F5',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 44,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  qrCodeWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrCodeBackground: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  qrInfoText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonText: {
    color: 'white',
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  footer: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
});

export default InviteDetailScreen;
