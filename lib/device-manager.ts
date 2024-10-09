import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';
import { LoggingService } from './LoggingService';
import { TelemetryService } from './TelemetryService';
import { FeatureFlags } from './FeatureFlags';
import moment from 'moment';

const DEVICE_ID_KEY = '@DeviceId';
const LAST_CHECK_KEY = '@LastInactiveDeviceCheck';
const INACTIVITY_THRESHOLD = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

const generateUniqueId = () => uuidv4();

export const getActiveDevices = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('active_devices')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data;
  } catch (error) {
    LoggingService.error('Error fetching active devices:', error);
    throw error;
  }
};

export const addDevice = async (userId: string, deviceId: string) => {
  try {
    LoggingService.info(`Adding device for user: ${userId}, deviceId: ${deviceId}`);

    if (!userId || !deviceId) {
      throw new Error('Invalid userId or deviceId');
    }

    const { data: existingDevice, error: fetchError } = await supabase
      .from('active_devices')
      .select('*')
      .eq('user_id', userId)
      .eq('device_id', deviceId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (!existingDevice) {
      const devices = await getActiveDevices(userId);
      if (devices.length >=3) {
        throw new Error('Maximum number of devices reached. Please remove a device before adding a new one.');
      }

           const { data: newDevice, error: insertError } = await supabase
             .from('active_devices')
             .insert({
               id: generateUniqueId().toString(),
               user_id: userId,
               device_id: deviceId,
               last_login: moment().toISOString(),
             })
             .single();
     
           if (insertError) throw insertError;
           LoggingService.info(`Device document created: ${JSON.stringify(newDevice)}`);
         } else {
           const { data: updatedDevice, error: updateError } = await supabase
             .from('active_devices')
             .update({ last_login: new Date().toISOString() })
             .eq('id', existingDevice.id)
             .single();
     
           if (updateError) throw updateError;
           LoggingService.info(`Device document updated: ${JSON.stringify(updatedDevice)}`);
         }

   LoggingService.info(`Device added/updated successfully: ${deviceId}`);
    return true;
  } catch (error) {
    LoggingService.error('Error adding device:', error);
    throw error;
  }
};

export const getCurrentDeviceId = async () => {
  try {
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = generateUniqueId().toString();
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  } catch (error) {
    LoggingService.error('Error getting device ID:', error);
    return generateUniqueId(); // Fallback to generating a new ID if AsyncStorage fails
  }
};

export const isDeviceActive = async (userId: string) => {
  try {
    const deviceId = await getCurrentDeviceId();
    const { data, error } = await supabase
      .from('active_devices')
      .select('*')
      .eq('user_id', userId)
      .eq('device_id', deviceId);

    if (error) throw error;
    return data.length > 0;
  } catch (error) {
    LoggingService.error('Error checking if device is active:', error);
    throw error;
  }
};

export const unifiedDeviceRemoval = async (userId: string, deviceId: string, isAutomatedCleanup = false) => {
  try {
    LoggingService.info(`Attempting to remove device for userId: ${userId}, deviceId: ${deviceId}`);

    const { error: deleteError } = await supabase
      .from('active_devices')
      .delete()
      .eq('user_id', userId)
      .eq('device_id', deviceId);

    if (deleteError) throw deleteError;

    LoggingService.info(`Removed device ${deviceId} from active devices`);

    // End the session
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) throw signOutError;

    LoggingService.info(`Ended session for device: ${deviceId}`);

    TelemetryService.recordEvent('deviceRemoval', true);
    return true;
  } catch (error) {
    LoggingService.error('Error removing device and ending session:', error);
    TelemetryService.recordEvent('deviceRemoval', false);
    throw error;
  }
};

export const removeDevice = async (userId: string, deviceId: string) => {
  try {
    await unifiedDeviceRemoval(userId, deviceId);
    return true;
  } catch (error) {
    LoggingService.error('Error removing device:', error);
    throw error;
  }
  
}
export const removeInactiveDevices = async () => {
  const now = new Date();
  const inactivityThreshold = new Date(now.getTime() - INACTIVITY_THRESHOLD);

  try {
    const { data: inactiveDevices, error: fetchError } = await supabase
      .from('active_devices')
      .select('*')
      .lt('last_login', inactivityThreshold.toISOString());

    if (fetchError) throw fetchError;

    LoggingService.info(`Found ${inactiveDevices.length} inactive devices`);

    const removalPromises = inactiveDevices.map(device => 
      unifiedDeviceRemoval(device.userId, device.deviceId, true)
        .catch(error => {
          LoggingService.error(`Failed to remove device ${device.id}:`, error);
          return null;
        })
    );

    const results = await Promise.all(removalPromises);
    const successfulRemovals = results.filter(result => result !== null).length;

    LoggingService.info(`Successfully removed ${successfulRemovals} out of ${inactiveDevices.length} inactive devices`);
    TelemetryService.recordEvent('deviceRemoval', successfulRemovals === inactiveDevices.length);
  } catch (error) {
    LoggingService.error('Error removing inactive devices:', error);
    TelemetryService.recordEvent('deviceRemoval', false);
  }
};

export const performPeriodicCheck = async () => {
  if (!(await FeatureFlags.getFlag('enableDeviceManagement'))) {
    LoggingService.info('Device management is disabled');
    return;
  }

  try {
    const lastCheck = await AsyncStorage.getItem(LAST_CHECK_KEY);
    const now = new Date();
    
    if (!lastCheck || (now.getTime() - new Date(lastCheck).getTime()) > 24 * 60 * 60 * 1000) {
      LoggingService.info('Performing periodic check for inactive devices');
      await removeInactiveDevices();
      await AsyncStorage.setItem(LAST_CHECK_KEY, now.toISOString());
      TelemetryService.recordEvent('periodicCheck', true);
    } else {
      LoggingService.info('Skipping periodic check, last check was recent');
    }
  } catch (error) {
    LoggingService.error('Error performing periodic check:', error);
    TelemetryService.recordEvent('periodicCheck', false);
    console.error('Error during periodic check:', error);
  }
};

// Uncomment and modify if needed
// const getDeviceInfo = () => {
//   return {
//     os: Platform.OS,
//     version: Platform.Version,
//     brand: Platform.select({
//       android: 'Android Device',
//       ios: 'iOS Device',
//       default: 'Unknown'
//     }),
//     model: 'Not Available'
//   };
// };