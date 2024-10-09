import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { Stack, useNavigation, usePathname } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { darkColors, lightColors } from '../../constants/ThemeColors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomTabBar, TabIcon } from './(tabs)/_layout';

interface Route {
  key: string;
  name: string;
  title: string;
}



export default function ResidentLayout() {
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? darkColors : lightColors;
  const navigation = useNavigation();
  const pathname = usePathname();
  const [currentTabIndex, setCurrentTabIndex] = useState<number>(0);

  const routes: Route[] = [
    { key: 'home', name: 'home', title: 'Home' },
    { key: 'visitorLog', name: 'visitorLog', title: 'Visitors' },
    { key: 'invite', name: 'invite', title: 'Invite' },
    { key: 'profile', name: 'profile', title: 'Profile' },
    { key: 'help', name: 'help', title: 'Help' },
  ];

  const descriptors = {
    home: { options: { tabBarIcon: (props: any) => <TabIcon iconName="home-outline" name="Home" {...props} /> } },
    visitorLog: { options: { tabBarIcon: (props: any) => <TabIcon iconName="people-outline" name="Visitors" {...props} /> } },
    invite: { options: { tabBarIcon: (props: any) => <TabIcon iconName="mail-outline" name="Invite" {...props} /> } },
    profile: { options: { tabBarIcon: (props: any) => <TabIcon iconName="person-outline" name="Profile" {...props} /> } },
    help: { options: { tabBarIcon: (props: any) => <TabIcon iconName="help-circle-outline" name="Help" {...props} /> } },
  };

  useEffect(() => {
    const currentIndex = routes.findIndex((route) => pathname.includes(route.name));
    if (currentIndex !== -1) {
      setCurrentTabIndex(currentIndex);
    }
  }, [pathname]);

  const handleTabPress = (index: number) => {
    setCurrentTabIndex(index);
    navigation.navigate(routes[index].name as never);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="(invite)/groupInvite" options={{ headerShown: false }} />
          <Stack.Screen name="(invite)/groupInviteDetails" options={{ headerShown: false }} />
          <Stack.Screen name="(invite)/individualInvite" options={{ headerShown: false }} />
          <Stack.Screen name="(invite)/inviteDetail" options={{ headerShown: false }} />
          <Stack.Screen name="(invite)/utilityInvite" options={{ headerShown: false }} />
          <Stack.Screen name="(invite)/utilityInviteDetails" options={{ headerShown: false }} />
          <Stack.Screen name="(executive)/deviceManagement" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </View>
      <SafeAreaView
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.surface,
        }}
        edges={['bottom']}
      >
        <CustomTabBar
          state={{
            routes,
            index: currentTabIndex,
          }}
          descriptors={descriptors}
          navigation={navigation}
          onTabPress={handleTabPress}
        />
      </SafeAreaView>
    </View>
  );
}
