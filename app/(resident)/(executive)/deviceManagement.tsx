import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, ListRenderItem } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useGlobalContext } from '../../../context/GlobalProvider';
import { useTheme } from '../../../context/ThemeContext';
import { lightColors, darkColors } from '../../../constants/ThemeColors';
import { getActiveDevices, getCurrentDeviceId, removeDevice } from '../../../lib/device-manager';
import { MaterialIcons } from '@expo/vector-icons';
import CustomAlert from '../../../components/CustomAlert';

interface Device {
  device_id?: string;
  last_login?: string;
}

interface AlertConfig {
  visible: boolean;
  type: 'success' | 'error' | 'info' | 'confirm' | '';
  message: string;
  onConfirm?: () => void;
}

const DeviceManagement: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const { user } = useGlobalContext();
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? darkColors : lightColors;
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({ visible: false, type: '', message: '' });

  useEffect(() => {
    fetchDevices();
    fetchCurrentDeviceId();
  }, []);

  const fetchDevices = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const activeDevices = await getActiveDevices(user.id);
      // Filter out devices with undefined deviceId
    const validDevices = activeDevices.filter(device => device.device_id);
    setDevices(validDevices);
    } catch (error) {
      console.error('Error fetching devices:', error);
      setAlertConfig({
        visible: true,
        type: 'error',
        message: 'Failed to fetch active devices'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCurrentDeviceId = async (): Promise<void> => {
    try {
      const deviceId = await getCurrentDeviceId();
      setCurrentDeviceId(deviceId);
    } catch (error) {
      console.error('Error fetching current device ID:', error);
    }
  };

  const handleRemoveDevice = (deviceId: string): void => {
    setAlertConfig({
      visible: true,
      type: 'confirm',
      message: 'Are you sure you want to remove this device?',
      onConfirm: () => performRemoveDevice(deviceId)
    });
  };

  const performRemoveDevice = async (deviceId: string): Promise<void> => {
    try {
      console.log(`Attempting to remove device: ${deviceId}`);
      await removeDevice(user.id, deviceId);
      setDevices(devices.filter(device => device.device_id !== deviceId));
      setAlertConfig({
        visible: true,
        type: 'success',
        message: 'Device removed and session ended successfully'
      });
    } catch (error) {
      console.error('Error removing device:', error);
      setAlertConfig({
        visible: true,
        type: 'error',
        message: `Failed to remove device and end session: ${(error as Error).message}`
      });
    }
  };

  const handleAlertClose = (): void => {
    if (alertConfig.type === 'confirm' && alertConfig.onConfirm) {
      alertConfig.onConfirm();
    }
    setAlertConfig({ ...alertConfig, visible: false, onConfirm: undefined });
  };

  const renderDeviceItem: ListRenderItem<Device> = ({ item }) => (
    <View style={[styles.deviceItem, { backgroundColor: colors.surface }]}>
      <View style={styles.deviceInfo}>
        <MaterialIcons name="devices" size={24} color={colors.primary} style={styles.deviceIcon} />
        <View>
          <Text style={[styles.deviceName, { color: colors.text }]}>
            {item.device_id === currentDeviceId ? 'Current Device' : 
             (item.device_id ? `Device ${item.device_id.slice(0, 8)}` : 'Unknown Device')}
          </Text>
          <Text style={[styles.lastLogin, { color: colors.textSecondary }]}>
            Last login: {item.last_login ? new Date(item.last_login).toLocaleString() : 'Unknown'}
          </Text>
        </View>
      </View>
      {item.device_id && item.device_id !== currentDeviceId && (
        <TouchableOpacity
          style={[styles.removeButton, { backgroundColor: colors.error }]}
          onPress={() => handleRemoveDevice(item.device_id!)}
        >
          <Text style={[styles.removeButtonText, { color: colors.surface }]}>Remove</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Device Management</Text>
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Active Devices: {devices.length}/3
          </Text>
          <FlatList
            data={devices}
            renderItem={renderDeviceItem}
            keyExtractor={(item, index) => `device-${index}`}
            contentContainerStyle={styles.listContainer}
          />
        </>
      )}
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
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 10,
  },
  listContainer: {
    flexGrow: 1,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceIcon: {
    marginRight: 10,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  lastLogin: {
    fontSize: 12,
  },
  removeButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default DeviceManagement;