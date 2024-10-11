import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { lightColors, darkColors } from '../../constants/ThemeColors';

// Define types for invite data
interface InviteData {
  visitor_name: string;
  visitor_phone?: string;
  resident_name: string;
  address: string;
  status: string;
  end_date_time: string;
  group_name?: string;
  members_checked_in?: number ;
  entry_time?: string;
  exit_time?: string;
}

const InviteDetailScreen: React.FC = () => {
  const { invite, actionType } = useLocalSearchParams<{ invite: string; actionType: string }>();
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? darkColors : lightColors;

  useEffect(() => {
    try {
      setInviteData(JSON.parse(invite));
    } catch (error) {
      console.error('Error parsing invite data:', error, 'Received data:', invite);
    }
  }, [invite]);

  if (!inviteData) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E5A88" />
        <Text style={styles.loadingText}>Loading invite data...</Text>
      </SafeAreaView>
    );
  }

  const handleConfirm = () => {
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${inviteData.status === 'checked-in' ? 'check in' : 'check out'} this visitor?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: () => {
            Alert.alert(`Invite ${inviteData.status === 'checked-in' ? 'checked in' : 'checked out'} successfully`);
            router.back();
          },
        },
      ]
    );
  };

  const DetailItem: React.FC<{ icon: keyof typeof Ionicons.glyphMap; label: string; value: string | number | undefined }> = ({ icon, label, value }) => (
    <View style={styles.detailItem}>
      <Ionicons name={icon} size={24} color="#2E5A88" style={styles.detailIcon} />
      <View>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Invite Details</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <DetailItem icon="person" label="Visitor Name" value={inviteData.visitor_name} />
          {inviteData.visitor_phone && (
            <DetailItem icon="call" label="Phone Number" value={inviteData.visitor_phone} />
          )}
          <DetailItem icon="home" label="Visiting" value={inviteData.resident_name} />
          <DetailItem icon="business" label="Residence" value={inviteData.address} />
          <DetailItem icon="information-circle" label="Status" value={inviteData.status} />
          <DetailItem 
            icon="calendar" 
            label="Expiration Date" 
            value={moment(inviteData.end_date_time).format('LLL')} 
          />
          {inviteData.group_name && (
            <DetailItem icon="people" label="Number of Visitors Checked In" value={inviteData.members_checked_in} />
          )}
          {inviteData.status === 'checked-in' && inviteData.entry_time && (
            <DetailItem 
              icon="enter" 
              label="Check-in Time" 
              value={moment(inviteData.entry_time).format('LLL')} 
            />
          )}
          {inviteData.status === 'checked-out' && inviteData.exit_time && (
            <DetailItem 
              icon="exit" 
              label="Check-out Time" 
              value={moment(inviteData.exit_time).format('LLL')} 
            />
          )}
        </View>
      </ScrollView>
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.confirmButton, { backgroundColor: colors.primary }]} onPress={handleConfirm}>
          <Text style={[styles.confirmButtonText, { color: colors.surface }]}>
            {actionType === 'checkin' ? 'Confirm Check-In' : 'Confirm Check-Out'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  backButton: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  detailIcon: {
    marginRight: 15,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  actions: {
    padding: 20,
  },
  confirmButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default InviteDetailScreen;
