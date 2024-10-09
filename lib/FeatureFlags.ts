// FeatureFlags.js

import AsyncStorage from '@react-native-async-storage/async-storage';

const FEATURE_FLAGS_KEY = '@FeatureFlags';

export class FeatureFlags {
  static async getFlag(flagName: string) {
    try {
      const flags = await this.getAllFlags();
      return !!flags[flagName];
    } catch (error) {
      console.error('Error getting feature flag:', error);
      return false;
    }
  }

  static async setFlag(flagName: string, value: boolean) {
    try {
      const flags = await this.getAllFlags();
      flags[flagName] = value;
      await AsyncStorage.setItem(FEATURE_FLAGS_KEY, JSON.stringify(flags));
    } catch (error) {
      console.error('Error setting feature flag:', error);
    }
  }

  static async getAllFlags() {
    try {
      const flagsString = await AsyncStorage.getItem(FEATURE_FLAGS_KEY);
      return flagsString ? JSON.parse(flagsString) : {};
    } catch (error) {
      console.error('Error getting all feature flags:', error);
      return {};
    }
  }
}

// Initialize default flags
FeatureFlags.setFlag('enableDeviceManagement', true);