import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, KeyboardTypeOptions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { signIn } from '../../lib/auth';
import { useGlobalContext } from '../../context/GlobalProvider';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { lightColors, darkColors } from '../../constants/ThemeColors';
import CustomAlert from '../../components/CustomAlert';
import { isDeviceActive } from '../../lib/device-manager';
import { IconName } from '../../types';

interface FormState {
  email: string;
  password: string;
}

interface ErrorState {
  email: string;
  password: string;
}

interface AlertConfig {
  visible: boolean;
  type: 'success' | 'error' | 'info' | '';
  message: string;
}

// const keyboardTypeValue = 'email-address';

const SignIn: React.FC = () => {
  const [form, setForm] = useState<FormState>({ email: '', password: '' });
  const [errors, setErrors] = useState<ErrorState>({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({ visible: false, type: '', message: '' });
  const { setIsLoggedIn, setUser } = useGlobalContext();
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? darkColors : lightColors;

  const validateForm = () => {
    let isValid = true;
    const newErrors = { email: '', password: '' };

    if (!form.email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Email is invalid';
      isValid = false;
    }

    if (!form.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;
  
    setIsSubmitting(true);
  
    try {
      const result = await signIn(form.email, form.password);
      const user = result.user;
  
      // Check if the user object is retrieved
      if (!user) {
        throw new Error('Failed to get user information');
      }
  
      setUser(user);
      setIsLoggedIn(true);
  
      // Check if the user is active
        const deviceIsActive = await isDeviceActive(user.id);
        if (!deviceIsActive) {
          throw new Error('This device is not authorized. Please sign in on an authorized device or remove an existing device.');
        }
        router.replace('/(resident)/home');
  
  
      // Alert for successful sign-in
      setAlertConfig({
        visible: true,
        type: 'success',
        message: 'Signed in successfully!'
      });
    } catch (error) {
      // Improved error handling
      console.error('Sign-in error:', error);
  
      // Customize the error message based on the error
      let errorMessage = 'An error occurred during sign-in';
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
  
      // Set the alert configuration for error
      setAlertConfig({
        visible: true,
        type: 'error',
        message: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  

  const handleAlertClose = () => {
    setAlertConfig({ ...alertConfig, visible: false });
  };

  const renderInput = (key: keyof FormState, placeholder: string, icon: IconName, keyboardType : KeyboardTypeOptions = 'default', secureTextEntry = false) => {
    return (
      <View style={styles.inputContainer}>
      <Ionicons name={icon} size={24} color={colors.primary} style={styles.inputIcon} />
      <TextInput
        style={[styles.input, { color: colors.text }]}
        value={form[key]}
        onChangeText={(text) => {
          setForm(prev => ({ ...prev, [key]: text }));
          setErrors(prev => ({ ...prev, [key]: '' }));
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={key === 'email' ? 'email-address' : keyboardType}
        secureTextEntry={secureTextEntry && !showPassword}
        autoCapitalize={key === 'email' ? 'none' : 'sentences'}
        editable={!isSubmitting}
      />
      {key === 'password' && (
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
          <Ionicons 
            name={showPassword ? 'eye-off' : 'eye'} 
            size={24} 
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      )}
    </View>
    )
    
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.innerContainer} >
          <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Sign in to continue</Text>
          {renderInput('email', 'Email', 'mail-outline', 'email-address')}
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
          {renderInput('password', 'Password', 'lock-closed-outline', 'default', true)}
          {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }, isSubmitting && styles.buttonDisabled]}
            onPress={handleSignIn}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.surface }]}>Sign In</Text>
            )}
          </TouchableOpacity>
          <View style={styles.linkContainer}>
            <Text style={[styles.linkText, { color: colors.textSecondary }]}>Don't have an account?</Text>
            <Link href="/sign-up" style={[styles.link, { color: colors.primary }]}>
              Sign Up
            </Link>
          </View>
          <View style={styles.linkContainer}>
            {/* <Text style={[styles.linkText, { color: colors.textSecondary }]}>Sign in as security</Text> */}
            <Link href="/sign-in-as-security" style={[styles.link, { color: colors.primary }]}>
            Sign in as security
            </Link>
          </View>
          {/* <TouchableOpacity onPress={() => router.push('/forgot-password')}>
            <Text style={[styles.forgotPassword, { color: colors.primary }]}>Forgot Password?</Text>
          </TouchableOpacity> */}
        </View>
      </ScrollView>
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        message={alertConfig.message}
        onClose={handleAlertClose}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  innerContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  linkText: {
    fontSize: 16,
  },
  link: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  forgotPassword: {
    fontSize: 16,
    marginTop: 15,
  },
});

export default SignIn;