import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Animated, PanResponder, Dimensions, StyleSheet, GestureResponderEvent, PanResponderGestureState } from 'react-native';
import { logout, updateUserAfterAuth } from '../../../lib/auth';
import QRCode from 'react-native-qrcode-svg';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useGlobalContext } from '../../../context/GlobalProvider';
import { useTheme } from '../../../context/ThemeContext';
import { lightColors, darkColors } from '../../../constants/ThemeColors';
import CustomAlert from '../../../components/CustomAlert';
import { getActiveDevices } from '../../../lib/device-manager';
import { useAnimatedStyle, withSpring } from 'react-native-reanimated';


const { height } = Dimensions.get('window');
const SWIPE_THRESHOLD = 30;
const RESIDENT_PASS_PEEK_HEIGHT = 42;
const TAB_BAR_HEIGHT = 30;

interface Profile {
  username: string;
  address: string;
}

interface AlertConfig {
  visible: boolean;
  type: 'success' | 'error' | 'info' | 'confirm' |'';
  message: string;
  onConfirm?: () => void;
}

const ProfileScreen: React.FC = () => {
  const [profile, setProfile] = useState<Profile>({ username: '', address: '' });
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [devices, setDevices] = useState<any[]>([]);
  const { setUser, setIsLoggedIn, user } = useGlobalContext();
  const router = useRouter();
  const pan = useRef(new Animated.ValueXY({ x: 0, y: height - RESIDENT_PASS_PEEK_HEIGHT - TAB_BAR_HEIGHT })).current;
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? darkColors : lightColors;
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({ visible: false, type: '', message: '' });

  useEffect(() => {
    if (user) {
      setProfile(user);
      fetchDevices();
    }
  }, [user]);

  // useEffect(() => {
  //   // Add the listener when the component mounts
  //   const panYListener = pan.y.addListener(({ value }) => {
  //     const targetY = value > height / 2 
  //       ? { x: 0, y: height - RESIDENT_PASS_PEEK_HEIGHT - TAB_BAR_HEIGHT } 
  //       : { x: 0, y: 0 };
  
  //     Animated.spring(pan, {
  //       toValue: targetY,
  //       useNativeDriver: false,
  //     }).start();
  //   });
  
  //   // Cleanup the listener when the component unmounts
  //   return () => {
  //     pan.y.removeListener(panYListener);
  //   };
  // }, [pan, height]); // 

  
  const animateToPosition = (toValue: number) => {
    Animated.spring(pan.y, {
      toValue,
      useNativeDriver: false,
    }).start();
  };
  
  const handlePanResponderRelease = (e: GestureResponderEvent, gestureState: PanResponderGestureState) => {
    if (gestureState.dy < -SWIPE_THRESHOLD) {
      animateToPosition(0);
    } else if (gestureState.dy > SWIPE_THRESHOLD) {
      animateToPosition(height - RESIDENT_PASS_PEEK_HEIGHT - TAB_BAR_HEIGHT);
    }
  };
  
  // In your component:
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: Animated.event([null, { dy: pan.y }], { useNativeDriver: false }),
    onPanResponderRelease: handlePanResponderRelease,
  });
  

  const fetchDevices = async (): Promise<void> => {
    try {
      const activeDevices = await getActiveDevices(user.id);
      setDevices(activeDevices);
    } catch (error) {
      console.error('Error fetching devices:', error);
      setAlertConfig({
        visible: true,
        type: 'error',
        message: 'Failed to fetch active devices'
      });
    }
  };

  const handleChange = (field: keyof Profile, value: string): void => {
    setProfile({ ...profile, [field]: value });
  };

  const handleSaveChanges = async (): Promise<void> => {
    try {
      await updateUserAfterAuth(user.id, profile);
      setUser(profile);
      setIsEditing(false);
      setAlertConfig({
        visible: true,
        type: 'success',
        message: 'Profile updated successfully'
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      setAlertConfig({
        visible: true,
        type: 'error',
        message: 'Failed to update profile'
      });
    }
  };

  const handleLogout = (): void => {
    setAlertConfig({
      visible: true,
      type: 'confirm',
      message: 'Are you sure you want to logout?',
      onConfirm: performLogout
    });
  };

  const performLogout = async (): Promise<void> => {
    try {
      const result = await logout();
      if (result.success) {
        setUser(null);
        setIsLoggedIn(false);
        router.replace('sign-in');
      } else {
        throw new Error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
      setAlertConfig({
        visible: true,
        type: 'error',
        message: 'Failed to log out. Please try again.'
      });
    }
  };

  const handleAlertClose = (): void => {
    if (alertConfig.type === 'confirm' && alertConfig.onConfirm) {
      alertConfig.onConfirm();
    }
    setAlertConfig({ ...alertConfig, visible: false, onConfirm: undefined });
  };

  const handleDeviceManagement = (): void => {
    router.push('/deviceManagement');
  };

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.text }]}>Profile</Text>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.fieldContainer}>
            <MaterialIcons name="person" size={24} color={colors.primary} style={styles.icon} />
            <View style={styles.fieldContent}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Name</Text>
              <Text style={[styles.fieldValue, { color: colors.text }]}>{profile.username}</Text>
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <MaterialIcons name="location-on" size={24} color={colors.primary} style={styles.icon} />
            <View style={styles.fieldContent}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Address</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.input, { color: colors.text, borderBottomColor: colors.border }]}
                  value={profile.address}
                  onChangeText={(text) => handleChange('address', text)}
                  placeholder="Enter your address"
                  placeholderTextColor={colors.textSecondary}
                />
              ) : (
                <Text style={[styles.fieldValue, { color: colors.text }]}>{profile.address}</Text>
              )}
            </View>
          </View>
          {/* Estate Field */}
          {/* <View style={styles.fieldContainer}>
              <MaterialIcons name="location-on" size={24} color={colors.primary} style={styles.icon} />
              <View style={styles.fieldContent}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Estate</Text>
                <Text style={[styles.fieldValue, { color: colors.text }]}> {profile.estate_}</Text>
          </View> */}

          <TouchableOpacity
            style={[
              styles.button,
              isEditing ? { backgroundColor: colors.success } : { backgroundColor: colors.primary },
            ]}
            onPress={isEditing ? handleSaveChanges : () => setIsEditing(true)}
          >
            <Text style={[styles.buttonText, { color: colors.surface }]}>
              {isEditing ? 'Save Changes' : 'Edit Profile'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleDeviceManagement}
        >
          <Text style={[styles.buttonText, { color: colors.surface }]}>Device Management</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.error }]}
          onPress={handleLogout}
        >
          <Text style={[styles.buttonText, { color: colors.surface }]}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      <Animated.View
        style={[
          styles.residentPassContainer,
          {
            transform: [{ translateY: pan.y }],
            backgroundColor: colors.surface,
          }
        ]}
        {...panResponder.panHandlers}
      >
        <View style={[styles.residentPassHandle, { backgroundColor: colors.border }]} />
        <Text style={[styles.residentPassTitle, { color: colors.text }]}>Resident Pass</Text>
        <View style={styles.qrCodeContainer}>
          <QRCode
            value={JSON.stringify({ username: profile.username, household_Id: profile.address })}
            size={200}
            color={colors.text}
            backgroundColor={colors.surface}
          />
        </View>
        <Text style={[styles.residentPassText, { color: colors.textSecondary }]}>
          This is your personal resident pass. Do not share it with others.
        </Text>
      </Animated.View>
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
    backgroundColor: '#F0F4F8',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: RESIDENT_PASS_PEEK_HEIGHT + 20, // Add extra padding at the bottom
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E5A88',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    marginRight: 15,
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#4A6FA5',
    marginBottom: 5,
  },
  fieldValue: {
    fontSize: 16,
    color: '#2E5A88',
    fontWeight: '500',
  },
  input: {
    fontSize: 16,
    color: '#2E5A88',
    borderBottomWidth: 1,
    borderBottomColor: '#4A6FA5',
    paddingVertical: 5,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 5, 
  },
  editButton: {
    backgroundColor: '#4A6FA5',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  logoutButton: {
    backgroundColor: '#FF6B6B',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  residentPassContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: height - TAB_BAR_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  residentPassHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#D1D5DB',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 10,
  },
  residentPassTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E5A88',
    marginBottom: 200,
    textAlign: 'center',
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  residentPassText: {
    fontSize: 14,
    color: '#4A6FA5',
    textAlign: 'center',
  },
});

export default ProfileScreen;