// TelemetryService.js

import AsyncStorage from '@react-native-async-storage/async-storage';

const TELEMETRY_KEY = '@DeviceManagementTelemetry';

export class TelemetryService {
  static async recordEvent(eventName: string, success: boolean) {
    try {
      const telemetry = await this.getTelemetry();
      if (!telemetry[eventName]) {
        telemetry[eventName] = { success: 0, failure: 0 };
      }
      telemetry[eventName][success ? 'success' : 'failure']++;
      await AsyncStorage.setItem(TELEMETRY_KEY, JSON.stringify(telemetry));
    } catch (error) {
      console.error('Failed to record telemetry:', error);
    }
  }

  static async getTelemetry() {
    try {
      const telemetryString = await AsyncStorage.getItem(TELEMETRY_KEY);
      return telemetryString ? JSON.parse(telemetryString) : {};
    } catch (error) {
      console.error('Failed to get telemetry:', error);
      return {};
    }
  }

  static async getSuccessRate(eventName: string) {
    const telemetry = await this.getTelemetry();
    const event = telemetry[eventName];
    if (!event) return null;
    const total = event.success + event.failure;
    return total > 0 ? (event.success / total) * 100 : 0;
  }
}