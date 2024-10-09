// LoggingService.js

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOG_KEY = '@AppLogs';
const MAX_LOGS = 100;

export class LoggingService {
  static async log(level: string, message: string, error: any = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      error: error instanceof Error ? error.toString() : null,
      platform: Platform.OS,
      // Add any other relevant info (e.g., app version, user ID if logged in)
    };

    try {
      let logs = await this.getLogs();
      logs.unshift(logEntry);
      logs = logs.slice(0, MAX_LOGS);
      await AsyncStorage.setItem(LOG_KEY, JSON.stringify(logs));

      // In a real-world scenario, you'd send this to a centralized logging service
      console.log(`[${level}] ${message}`, error);
    } catch (e) {
      console.error('Failed to save log:', e);
    }
  }

  static async getLogs() {
    try {
      const logsString = await AsyncStorage.getItem(LOG_KEY);
      return logsString ? JSON.parse(logsString) : [];
    } catch (e) {
      console.error('Failed to get logs:', e);
      return [];
    }
  }

  static info(message: string) {
    this.log('INFO', message);
  }

  static warn(message: string) {
    this.log('WARN', message);
  }

  static error(message: string, error: any = null) {
    this.log('ERROR', message, error);
  }

  // Method to send logs to a centralized service
  static async sendLogsToServer() {
    const logs = await this.getLogs();
    // Implement the logic to send logs to your server
    // Clear logs after successful send
    // await AsyncStorage.setItem(LOG_KEY, JSON.stringify([]));
  }
}