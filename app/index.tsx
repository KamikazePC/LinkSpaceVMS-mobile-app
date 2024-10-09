import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '../context/GlobalProvider';
import { useTheme } from '../context/ThemeContext';
import { lightColors, darkColors } from '../constants/ThemeColors';

// Defining the type for the error state
type CheckError = string | null;

export default function LinkSpaceVMS() {
  const { isLoading, isLoggedIn } = useGlobalContext();
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? darkColors : lightColors;
  const [checkError, setCheckError] = useState<CheckError>(null); // Initialize as null

  useEffect(() => {
    const performInitialCheck = async () => {
      try {
        const { performPeriodicCheck } = await import('../lib/device-manager');
        await performPeriodicCheck();
      } catch (error) {
        console.error('Error performing initial device check:', error);
        setCheckError('Failed to perform device check. Please try again later.');
        // Consider sending this error to a logging service
      }
    };

    performInitialCheck();
  }, []);

  useEffect(() => {
    if (checkError) {
      Alert.alert('Error', checkError, [{ text: 'OK', onPress: () => setCheckError(null) }]);
    }
  }, [checkError]);

  if (!isLoading && isLoggedIn) return <Redirect href="/home" />;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.primary }]}>LinkSpaceVMS</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Visitor Management System</Text>
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/sign-in')}
            >
              <Text style={[styles.buttonText, { color: colors.surface }]}>Log In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton, { borderColor: colors.primary }]}
              onPress={() => router.push('/sign-up')}
            >
              <Text style={[styles.buttonText, { color: colors.primary }]}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 48,
    opacity: 0.8,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  button: {
    width: '100%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loader: {
    marginTop: 24,
  },
});
