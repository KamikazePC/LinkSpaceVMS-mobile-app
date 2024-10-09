import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGlobalContext } from '../../../context/GlobalProvider';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import moment from 'moment';
import { useTheme } from '../../../context/ThemeContext';
import { darkColors, lightColors } from '../../../constants/ThemeColors';
import CustomAlert from '../../../components/CustomAlert';
import OTPDisplay from '../../../components/OTPDisplay';


const UtilityInviteDetails = () => {
  const { user } = useGlobalContext();
  const { invite } = useLocalSearchParams();
  const [inviteData, setInviteData] = useState(null);
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? darkColors : lightColors;
  const [alertConfig, setAlertConfig] = useState({ visible: false, type: '', message: '' });
  const [isSharing, setIsSharing] = useState(false);

  

  useEffect(() => {
    try {
      const parsedInvite = JSON.parse(invite);
      setInviteData(parsedInvite);
      // console.log('Parsed invite data:', parsedInvite);
    } catch (error) {
      console.error('Error parsing invite data:', error, 'Received data:', invite);
      setAlertConfig({
        visible: true,
        type: 'error',
        message: 'Error loading invite data'
      });
    }
  }, [invite]);

  const handleShareOTP = async () => {
    setIsSharing(true);
    try {
      await Share.share({
        message: `
Hi ${inviteData.visitor_name},

Your one-time code for utility access is ${inviteData.otp}

Date: ${moment(inviteData.end_date_time).format('LLL')}
Powered by LinkSpace Ltd
        `,
      });
    } catch (error) {
      setAlertConfig({
        visible: true,
        type: 'error',
        message: 'Failed to share OTP'
      });
    } finally {
      setIsSharing(false);
    }
  };

  if (!inviteData) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text>Loading invite data...</Text>
      </SafeAreaView>
    );
  }

  const handleCopyOTP = () => {
    setAlertConfig({
      visible: true,
      type: 'success',
      message: 'OTP copied to clipboard'
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
    <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Utility Invite Details</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Visitor Information</Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>Name: {inviteData?.visitor_name || 'N/A'}</Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>Phone: {inviteData?.visitor_phone || 'N/A'}</Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>Date: {moment(inviteData.date).format('LLL')}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface }]}>
       <Text style={[styles.cardTitle, { color: colors.text }]}>One Time Pin</Text>
          <OTPDisplay 
            otp={inviteData.otp} 
            colors={colors} 
            onCopy={handleCopyOTP}
          />
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

      <Text style={[styles.footer, { color: colors.textSecondary }]}>
        You have granted access to the utility visitor. Share the OTP for entry.
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
  infoText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  otpBox: {
    width: 50,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    backgroundColor: '#F9F9F9',
  },
  otpText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
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

export default UtilityInviteDetails;