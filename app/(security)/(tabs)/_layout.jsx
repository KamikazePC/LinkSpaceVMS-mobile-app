import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Platform, SafeAreaView } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { lightColors } from '../../../constants/ThemeColors';

const TabIcon = ({ iconName, color, name, focused }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1.2 : 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(opacityAnim, {
        toValue: focused ? 1 : 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        opacity: opacityAnim,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={iconName} size={24} color={color} />
      <Text style={{ color, fontWeight: focused ? '600' : '400', fontSize: 10, marginTop: 4 }}>{name}</Text>
    </Animated.View>
  );
};


const CustomTabBar = ({ state, descriptors, navigation }) => {
  const colors = lightColors;

  return (
    <View style={[styles.tabBarContainer, { backgroundColor: colors.surface }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel || options.title || route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={styles.tabItem}
          >
            {options.tabBarIcon({
              focused: isFocused,
              color: isFocused ? colors.primary : colors.textSecondary,
              size: 24,
            })}
            {isFocused && <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default function TabsLayout() {
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? lightColors : lightColors;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View style={styles.container}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarShowLabel: false,
            tabBarStyle: [styles.tabBarContainer, { backgroundColor: lightColors.surface }],
            contentStyle: {
              paddingBottom: 60, // Adjust this value to match your tab bar height
            },
          }}
          tabBar={(props) => <CustomTabBar {...props} />}
        >
          <Tabs.Screen
            name="securityHome"
            options={{
              title: 'Dashboard',
              tabBarIcon: (props) => <TabIcon iconName="grid-outline" name="Dashboard" {...props} />,
            }}
          />
          <Tabs.Screen
            name="verifyCode"
            options={{
              title: 'Verify',
              tabBarIcon: (props) => <TabIcon iconName="qr-code-outline" name="Verify" {...props} />,
            }}
          />
          <Tabs.Screen
            name="visitorManagement"
            options={{
              title: 'Visitors',
              tabBarIcon: (props) => <TabIcon iconName="people-outline" name="Visitors" {...props} />,
            }}
          />
          <Tabs.Screen
            name="security-profile-screen"
            options={{
              title: 'Profile',
              tabBarIcon: (props) => <TabIcon iconName="person-outline" name="Profile" {...props} />,
            }}
          />
        </Tabs>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  tabBarContainer: {
    flexDirection: 'row',
    height: 60,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    width: '50%',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
});
