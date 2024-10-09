import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Platform, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { darkColors, lightColors } from '../../../constants/ThemeColors';

interface TabIconProps {
  iconName: keyof typeof Ionicons.glyphMap;
  color: string;
  name: string;
  focused: boolean;
}

export const TabIcon: React.FC<TabIconProps> = ({ iconName, color, name, focused }) => {
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
      <Text style={{ color, fontWeight: focused ? '600' : '400', fontSize: 10, marginTop: 4 }}>
        {name}
      </Text>
    </Animated.View>
  );
};

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
  onTabPress: (index: number) => void;
}

export const CustomTabBar: React.FC<CustomTabBarProps> = ({ state, descriptors, navigation, onTabPress }) => {
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <View style={[styles.tabBarContainer, { backgroundColor: colors.surface }]}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel || options.title || route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          if (!isFocused) {
            onTabPress(index);
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
              size: 24 
            })}
            {isFocused && <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};



const TabsLayout: React.FC = () => {
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View style={styles.container}>
        <Tabs
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarShowLabel: false,
            tabBarStyle: [
              styles.tabBarContainer,
              { backgroundColor: colors.surface }
            ] as ViewStyle,
            contentStyle: {
              paddingBottom: 60,
            },
          })}
          tabBar={(props) => <CustomTabBar {...props} onTabPress={(index) => props.navigation.navigate(props.state.routes[index].name)} />}
        >
          <Tabs.Screen 
            name="home"
            options={{ 
              title: "Home",
              tabBarIcon: (props) => <TabIcon iconName="home-outline" name="Home" {...props} />,
            }}
          />
          <Tabs.Screen 
            name="visitorLog"
            options={{ 
              title: "Visitors",
              tabBarIcon: (props) => <TabIcon iconName="people-outline" name="Visitors" {...props} />,
            }}
          />
          <Tabs.Screen 
            name="invite"
            options={{ 
              title: "Invite",
              tabBarIcon: (props) => <TabIcon iconName="mail-outline" name="Invite" {...props} />,
            }}
          />
          <Tabs.Screen 
            name="profile"
            options={{ 
              title: "Profile",
              tabBarIcon: (props) => <TabIcon iconName="person-outline" name="Profile" {...props} />,
            }}
          />
          <Tabs.Screen 
            name="help"
            options={{ 
              title: "Help",
              tabBarIcon: (props) => <TabIcon iconName="help-circle-outline" name="Help" {...props} />,
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    height: 60,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
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
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
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

export default TabsLayout;