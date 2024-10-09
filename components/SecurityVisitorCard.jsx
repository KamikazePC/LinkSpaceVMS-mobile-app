import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useGlobalContext } from '../context/GlobalProvider';
import { deleteInvite, endInvite, pauseInvite, resumeInvite } from '../lib/invite';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import { useTheme } from '../context/ThemeContext';
import { lightColors, darkColors } from '../constants/ThemeColors';

export default function SecurityVisitorManagement({ visitor, refreshInvites }) {
  const { user } = useGlobalContext();
  const [loading, setLoading] = useState(false);
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? darkColors : lightColors;

  const handleEndInvite = async () => {
    Alert.alert(
      'End Visit',
      'Are you sure you want to end this visit?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Visit',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await endInvite(visitor.id);
              refreshInvites();
              Alert.alert('Success', 'Visit ended successfully');
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to end visit');
            } finally {
              setLoading(false);
            }
          }
        },
      ],
      { cancelable: true }
    );
  };

  const handlePauseResumeInvite = async () => {
    setLoading(true);
    try {
      if (visitor.status === 'paused') {
        await resumeInvite(visitor.id);
        Alert.alert('Success', 'Visit resumed successfully');
      } else {
        await pauseInvite(visitor.id);
        Alert.alert('Success', 'Visit paused successfully');
      }
      refreshInvites();
    } catch (error) {
      Alert.alert('Error', `Failed to ${visitor.status === 'paused' ? 'resume' : 'pause'} visit`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    switch (visitor.status) {
      case 'checked-in' || 'active': return colors.success;
      case 'checked-out': return colors.error;
      default: return colors.textSecondary;
    }
  };
  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.name, { color: colors.text }]}>{visitor.group_name || visitor.visitor_name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={[styles.statusText, { color: colors.surface }]}>{visitor.status.replace('-', ' ')}</Text>
        </View>
      </View>
      <View style={styles.details}>
        <Text style={[styles.detailText, { color: colors.textSecondary }]}>
          <MaterialCommunityIcons name="home-account" size={16} color={colors.textSecondary} />
          {' '}Address: {visitor.address}
        </Text>
        {/* ... (other detail texts) */}
      </View>
      {visitor.invite_type === 'utility' && visitor.status !== 'checked-out' && (
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={handlePauseResumeInvite}
            style={[styles.button, { backgroundColor: visitor.status === 'paused' ? colors.success : colors.warning }]}
            disabled={loading}
          >
            <MaterialCommunityIcons 
              name={visitor.status === 'paused' ? 'play' : 'pause'} 
              size={20} 
              color={colors.surface} 
            />
            <Text style={[styles.buttonText, { color: colors.surface }]}>
              {visitor.status === 'paused' ? 'Resume' : 'Pause'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleEndInvite}
            style={[styles.button, { backgroundColor: colors.error }]}
            disabled={loading}
          >
            <MaterialCommunityIcons name="exit-to-app" size={20} color={colors.surface} />
            <Text style={[styles.buttonText, { color: colors.surface }]}>End Visit</Text>
          </TouchableOpacity>
        </View>
      )}
      {loading && <ActivityIndicator style={styles.loading} size="large" color={colors.primary} />}
    </View>
  );
}


const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  details: {
    marginBottom: 16,
  },
  detailText: {
    fontSize: 14,
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  buttonText: {
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loading: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});