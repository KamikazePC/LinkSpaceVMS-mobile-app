import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { logout } from '../../../lib/auth';
import { useGlobalContext } from '../../../context/GlobalProvider';
import { useTheme } from '../../../context/ThemeContext';
import { lightColors, darkColors } from '../../../constants/ThemeColors';

const SecurityProfileScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useGlobalContext();
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? darkColors : lightColors;

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await logout();
              router.push('sign-in');
            } catch (error) {
              Alert.alert('Error', 'Failed to log out');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
      <View style={styles.profileInfo}>
        <Text style={[styles.name, { color: colors.text }]}>{user.name}</Text>
        <Text style={[styles.role, { color: colors.textSecondary }]}>Security Personnel</Text>
      </View>
      <View style={[styles.infoSection, { backgroundColor: colors.surface }]}>
        <InfoItem icon="mail" label="Email" value={user.email} colors={colors} />
      </View>
      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: colors.secondary }]}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={24} color={colors.surface} />
        <Text style={[styles.logoutButtonText, { color: colors.surface }]}>Log Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

interface InfoItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  colors: typeof lightColors | typeof darkColors;
}

const InfoItem: React.FC<InfoItemProps> = ({ icon, label, value, colors }) => (
  <View style={styles.infoItem}>
    <Ionicons name={icon} size={24} color={colors.primary} style={styles.infoIcon} />
    <View>
      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  role: {
    fontSize: 16,
  },
  infoSection: {
    borderRadius: 10,
    padding: 20,
    marginBottom: 30,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoIcon: {
    marginRight: 15,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
  },
  logoutButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default SecurityProfileScreen;
