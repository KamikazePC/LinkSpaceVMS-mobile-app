import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, KeyboardTypeOptions } from 'react-native';
import { createUser } from '../../lib/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { lightColors, darkColors } from '../../constants/ThemeColors';
import CustomAlert from '../../components/CustomAlert';
import { useGlobalContext } from '../../context/GlobalProvider';

interface FormState {
  email: string;
  password: string;
  username: string;
  address: string;
  phone_number: string;
  registration_code: string;
}

interface ErrorState extends FormState {}

interface AlertConfig {
  visible: boolean;
  type: 'success' | 'error' | '';
  message: string;
}

const SignUpScreen: React.FC = () => {
  const { setUser, setIsLoggedIn } = useGlobalContext();
  const [form, setForm] = useState<FormState>({
    email: '',
    password: '',
    username: '',
    address: '',
    phone_number: '',
    registration_code: ''
  });
  const [errors, setErrors] = useState<ErrorState>({
    email: '',
    password: '',
    username: '',
    address: '',
    phone_number: '',
    registration_code: ''
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({ visible: false, type: '', message: '' });
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? darkColors : lightColors;

  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors: ErrorState = { ...errors };

    if (!form.username) {
      newErrors.username = 'Username is required';
      isValid = false;
    } else if (!/^[a-zA-Z ]{3,}$/.test(form.username)) {
      newErrors.username = 'Username must be at least 3 characters long and contain only letters and spaces';
      isValid = false;
    } else if (form.username.trim().split(' ').length < 2) {
      newErrors.username = 'Please enter both a first name and a last name';
      isValid = false;
    }

    if (!form.email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Email is invalid';
      isValid = false;
    }

    if (!form.phone_number) {
      newErrors.phone_number = 'Phone number is required';
      isValid = false;
    } else if (!/^\d{11}$/.test(form.phone_number)) {
      newErrors.phone_number = 'Phone number must be 11 digits';
      isValid = false;
    }

    if (!form.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (!/^[A-Za-z\d@$!%*?&]{6,}$/.test(form.password)) {
      newErrors.password = 'Password must be at least 6 characters long and can contain letters, numbers, and special characters';
      isValid = false;
    }

    if (!form.address) {
      newErrors.address = 'Address is required';
      isValid = false;
    }

    if (!form.registration_code) {
      newErrors.registration_code = 'Estate Code is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSignUp = async (): Promise<void> => {
    console.log('Form submitted:', form);
    if (!validateForm()) return;


    setIsSubmitting(true);

    try {
      console.log('Creating user...');
      const newUser = await createUser(
        form.email,
        form.password,
        form.username,
        form.registration_code,
        //address are lower case, remove whitespace, remove all non-alphanumeric characters
        form.address.toLowerCase(),
        form.phone_number
      );

      // console.log('User created:', newUser);

      setUser(newUser);
      setIsLoggedIn(true);
      setAlertConfig({
        visible: true,
        type: 'success',
        message: 'Account created successfully!',
      });
    } catch (error: any) {
      console.error('Error during sign up:', error);
      setAlertConfig({
        visible: true,
        type: 'error',
        message: error.message || 'Something went wrong during sign up',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAlertClose = (): void => {
    setAlertConfig({ ...alertConfig, visible: false });
    if (alertConfig.type === 'success') {
      router.replace('/home');
    }
  };

  const renderInput = (
    key: keyof FormState,
    placeholder: string,
    icon: keyof typeof Ionicons.glyphMap,
    keyboardType: KeyboardTypeOptions = 'default',
    secureTextEntry: boolean = false
  ) => (
    <View style={styles.inputContainer}>
      <Ionicons name={icon} size={24} color={colors.primary} style={styles.inputIcon} />
      <TextInput
        style={[styles.input, { color: colors.text }]}
        value={form[key]}
        onChangeText={(text) => {
          if (key === 'phone_number' && text.length > 11) {
            return; // Do not update if phone number is longer than 11 digits
          }
          setForm((prev) => ({ ...prev, [key]: text }));
          setErrors((prev) => ({ ...prev, [key]: '' }));
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry && !showPassword}
        autoCapitalize={key === 'email' ? 'none' : 'sentences'}
        maxLength={key === 'phone_number' ? 11 : undefined}
      />
      {key === 'password' && (
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
          <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={24} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
        {renderInput('username', 'Username', 'person-outline')}
        {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}
        {renderInput('email', 'Email', 'mail-outline', 'email-address')}
        {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
        {renderInput('phone_number', 'Phone Number', 'call-outline', 'phone-pad')}
        {errors.phone_number ? <Text style={styles.errorText}>{errors.phone_number}</Text> : null}
        {renderInput('password', 'Password', 'lock-closed-outline', 'default', true)}
        {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
        {renderInput('address', 'Number Street Name', 'home-outline')}
        {errors.address ? <Text style={styles.errorText}>{errors.address}</Text> : null}
        {renderInput('registration_code', 'Estate Code', 'barcode-outline')}
        {errors.registration_code ? <Text style={styles.errorText}>{errors.registration_code}</Text> : null}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }, isSubmitting && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={[styles.buttonText, { color: colors.surface }]}>Sign Up</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/sign-in')} style={styles.linkContainer}>
          <Text style={[styles.linkText, { color: colors.textSecondary }]}>Already have an account? </Text>
          <Text style={[styles.link, { color: colors.primary }]}>Sign In</Text>
        </TouchableOpacity>
      </ScrollView>
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
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 15,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  button: {
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
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 10,
  },
});

export default SignUpScreen;
