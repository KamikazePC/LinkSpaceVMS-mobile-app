import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import React, { useState } from 'react';
import icons from '../constants/icons';

// Define the props type for the FormField component
interface FormFieldProps {
  title: string | React.ReactNode; // title can be a string or any React node
  value: string;
  placeholder?: string; // placeholder is optional
  handleChangeText: (text: string) => void; // function to handle text changes
  otherStyles?: ViewStyle; // additional styles for the container
  [key: string]: any; // allows additional props
}

const FormField: React.FC<FormFieldProps> = ({ title, value, placeholder, handleChangeText, otherStyles, ...props }) => {
  const [showPassword, setShowPassword] = useState<boolean>(false); // specify type for useState

  const displayTitle = typeof title === 'string' ? title : JSON.stringify(title);

  return (
    <View style={[styles.container, otherStyles]}>
      <Text style={styles.title}>{displayTitle}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={value}
          placeholder={placeholder}
          placeholderTextColor="grey"
          onChangeText={handleChangeText}
          secureTextEntry={displayTitle === "Password" && !showPassword}
          {...props}
        />
        {displayTitle === "Password" && (
          <TouchableOpacity 
            onPress={() => setShowPassword(!showPassword)}
            accessible={true}
            accessibilityLabel={showPassword ? "Hide password" : "Show password"}
            style={styles.iconTouchable}
          >
            <Image 
              source={showPassword ? icons.eyeHide : icons.eye} 
              style={styles.icon} 
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#000',
  },
  iconTouchable: {
    padding: 8,
  },
  icon: {
    width: 24,
    height: 24,
    tintColor: '#666',
  },
});

export default FormField;
