import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';
import { darkColors, lightColors } from '../../../constants/ThemeColors';

interface InviteButtonProps {
  icon: 'map' | 'filter' | 'at' | 'person-outline' | 'people-outline' | 'construct-outline';
  label: string;
  description: string;
  onPress: () => void;
  colors: {
    primary: string;
    surface: string;
  };
}

const InviteButton: React.FC<InviteButtonProps> = ({ icon, label, description, onPress, colors }) => (
  <TouchableOpacity 
    style={[styles.button, { backgroundColor: colors.primary }]} 
    onPress={onPress}
  >
    <View style={styles.buttonContent}>
      <Ionicons name={icon} size={24} color={colors.surface} style={styles.buttonIcon} />
      <View style={styles.buttonTextContainer}>
        <Text style={[styles.buttonLabel, { color: colors.surface }]}>{label}</Text>
        <Text style={[styles.buttonDescription, { color: colors.surface }]}>{description}</Text>
      </View>
    </View>
    <Ionicons name="chevron-forward" size={24} color={colors.surface} />
  </TouchableOpacity>
);

const InviteScreen: React.FC = () => {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? darkColors : lightColors;

  const handlePress = (route: string) => {
    router.push(route);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.text }]}>Generate an Invite</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Select the type of invite you want to create:</Text>
        <View style={styles.buttonContainer}>
          <InviteButton
            icon="person-outline"
            label="Individual"
            description="Generate a one-time invite for an individual"
            onPress={() => handlePress('individualInvite')}
            colors={colors}
          />
          <InviteButton
            icon="people-outline"
            label="Group Invite"
            description="Create a single invite for a group of visitors"
            onPress={() => handlePress('groupInvite')}
            colors={colors}
          />
          <InviteButton
            icon="construct-outline"
            label="Utility"
            description="Generate an invite for utility services"
            onPress={() => handlePress('utilityInvite')}
            colors={colors}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 30,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  buttonIcon: {
    marginRight: 15,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  buttonDescription: {
    fontSize: 14,
  },
});

export default InviteScreen;
