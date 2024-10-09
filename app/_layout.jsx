import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
// import { PaperProvider } from 'react-native-paper';
import  GlobalProvider, { useGlobalContext }  from '../context/GlobalProvider';
import { NotificationProvider } from '../context/NotificationContext';
import { Slot, useRouter } from 'expo-router';
import { ThemeProvider } from '../context/ThemeContext';


export default function RootLayout() {

  return (
      <ThemeProvider>
      <GlobalProvider>
        {/* <NotificationProvider> */}
          <Slot />
        {/* </NotificationProvider> */}
      </GlobalProvider>
      </ThemeProvider>
  );
}
