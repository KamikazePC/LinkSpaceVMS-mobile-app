import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useGlobalContext } from '../context/GlobalProvider';
import { deleteInvite, endInvite, pauseInvite, resumeInvite } from '../lib/invite';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import { useTheme } from '../context/ThemeContext';
import { lightColors, darkColors } from '../constants/ThemeColors';

export default function SecurityVisitorCard({ visitor, refreshInvites }) {
  const { user } = useGlobalContext();
  const [loading, setLoading] = useState(false);
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? darkColors : lightColors;


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
        {visitor.status === 'checked-in' && (
          <Text style={styles.detailText}>
            <Ionicons name="time-outline" size={16} color="#666" />
            {' '}Check-in: {moment(visitor.entryTime).format('LLL')}
          </Text>
        )}
        {visitor.status === 'active' && (
          <>
          <Text style={styles.detailText}>
            <Ionicons name="time-outline" size={16} color="#666" />
            {' '}Check-in: {moment(visitor.entryTime).format('LLL')}
          </Text><Text style={styles.detailText}>
          <Ionicons name="people-outline" size={16} color="#666" />
          {' '}Number of Visitors: {visitor.members_checked_in}
        </Text>
        </>
        )}
        {visitor.status === 'checked-out' && (
          <Text style={styles.detailText}>
            <Ionicons name="time-outline" size={16} color="#666" />
            {' '}Check-out: {moment(visitor.exit_time).format('LLL')}
          </Text>
        )}
      </View>
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