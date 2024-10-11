import 'react-native-gesture-handler';
import React from 'react';
// import { PaperProvider } from 'react-native-paper';
import GlobalProvider, { useGlobalContext } from '../context/GlobalProvider';
import { Slot } from 'expo-router';
import { ThemeProvider } from '../context/ThemeContext';

const RootLayout: React.FC = () => {
  return (
    <ThemeProvider>
      <GlobalProvider>
          <Slot />
      </GlobalProvider>
    </ThemeProvider>
  );
}

export default RootLayout;
