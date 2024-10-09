import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGlobalContext } from '../../../context/GlobalProvider';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { darkColors, lightColors } from '../../../constants/ThemeColors';
import URIQRCodeGenerator from '../../../components/improved-qr-code-generation';
import moment from 'moment';
import CustomAlert from '../../../components/CustomAlert';
import OTPDisplay from '../../../components/OTPDisplay';

interface InviteData {
  id: string;
  otp: string;
  visitor_name: string;
  start_date_time: string;
  end_date_time: string;
  members_checked_in: number;
}

const GroupInviteDetails: React.FC = () => {
  const { user } = useGlobalContext();
  const { invite, groupName } = useLocalSearchParams<{ invite: string; groupName: string }>();
  const viewShotRef = useRef<ViewShot>(null);
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? darkColors : lightColors;
  const [alertConfig, setAlertConfig] = useState<{ visible: boolean; type: 'success' | 'error'| ''; message: string }>({
    visible: false,
    type: '',
    message: '',
  });
  const [isSharing, setIsSharing] = useState<boolean>(false);

  useEffect(() => {
    if (invite) {
      try {
        setInviteData(JSON.parse(invite));
      } catch (error) {
        console.error('Error parsing invite data:', error);
        showAlert('error', 'Error loading invite data');
      }
    }
  }, [invite]);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlertConfig({ visible: true, type, message });
  };

  const handleShareOTP = async () => {
    if (inviteData?.otp) {
      setIsSharing(true);
      try {
        await Share.share({
          message: `Here is your OTP for ${groupName}: ${inviteData.otp}`,
        });
      } catch {
        showAlert('error', 'Failed to share OTP');
      } finally {
        setIsSharing(false);
      }
    } else {
      showAlert('error', 'OTP is not available');
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

  const { otp, id, visitor_name, start_date_time, end_date_time, members_checked_in } = inviteData;

  const qrCodeData = { id, otp };

  const formatDateTime = (dateTime: string) => moment(dateTime).format('MMM D, YYYY h:mm A') || 'N/A';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{groupName}</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>One Time Pin</Text>
          <OTPDisplay otp={otp} colors={colors} onCopy={() => showAlert('success', 'OTP copied to clipboard')} />
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
                <Text style={[styles.shareButtonText, styles.buttonLabel, { color: colors.surface }]}>Share OTP</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>QR Code</Text>
          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }}>
            <View style={styles.qrCodeWrapper}>
              <View style={[styles.qrCodeBackground]}>
                <Text style={[styles.qrInfoText]}>Hi, {user.username} is inviting you for a {visitor_name} visit!</Text>
                <Text style={[styles.qrInfoText]}>Your one-time code is {otp}</Text>
                <URIQRCodeGenerator inviteData={qrCodeData} />
                <Text style={[styles.qrInfoText]}>Please present your code at the estate gate to gain access</Text>
                <Text style={[styles.qrInfoText]}>Valid from {formatDateTime(start_date_time)} to {formatDateTime(end_date_time)}</Text>
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
                <Text style={[styles.shareButtonText, styles.buttonLabel, { color: colors.surface }]}>Share QR Code</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.infoText}>Please present your code at the estate gate to gain access</Text>
        <Text style={styles.membersCheckedIn}>Members Checked In: {members_checked_in}</Text>
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
    paddingBottom: 100, // Add extra padding at the bottom
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
  buttonLabel: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 44, // Same width as backButton
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
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
  },
  shareButtonText: {
    marginLeft: 10,
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  infoText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
  membersCheckedIn: {
    textAlign: 'center',
    marginTop: 10,
    color: '#666',
  },
});

export default GroupInviteDetails;
