// ThemeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themePreference, setThemePreference] = useState('system');
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');
 
  // useEffect(() => {
  //   loadThemePreference();
  // }, []);
  
  
  useEffect(() => {
    console.log('Current system color scheme:', systemColorScheme); // Add this log
    if (themePreference === 'system') {
      setIsDarkMode(systemColorScheme === 'dark');
    }
  }, [systemColorScheme, themePreference]);  

  // const loadThemePreference = async () => {
  //   try {
  //     const savedPreference = await AsyncStorage.getItem('themePreference');
  //     console.log('Saved preference:', savedPreference);  // Debugging line
  //     if (savedPreference !== null) {
  //       setThemePreference(savedPreference);  // Apply saved preference

  //       // If the preference is system, fall back to system theme
  //       if (savedPreference === 'system') {
  //         setIsDarkMode(systemColorScheme === 'dark');  // Match system color scheme
  //       } else {
  //         setIsDarkMode(savedPreference === 'dark');  // Use the saved theme (dark/light)
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Error loading theme preference:', error);
  //   }
  // };

  const setTheme = async (preference) => {
    setThemePreference(preference);
    try {
      await AsyncStorage.setItem('themePreference', preference);
      if (preference === 'system') {
        setIsDarkMode(systemColorScheme === 'dark');
      } else {
        setIsDarkMode(preference === 'dark');
      }
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, themePreference, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);