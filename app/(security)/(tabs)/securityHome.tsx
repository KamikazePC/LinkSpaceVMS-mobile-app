import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fetchAllInvites } from '../../../lib/invite';
import { useTheme } from '../../../context/ThemeContext';
import { lightColors, darkColors } from '../../../constants/ThemeColors';

interface Invite {
  id: string;
  visitor_name: string;
  resident_name: string;
  status: string;
  end_date_time: string;
  members_checked_in?: number;
}

const SecurityHomeScreen: React.FC = () => {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? darkColors : lightColors;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data: Invite[] = await fetchAllInvites();
      const sortedData = data.sort((a, b) => new Date(b.end_date_time).getTime() - new Date(a.end_date_time).getTime());
      const activeInvites = sortedData.filter(invite => ['checked-in', 'active', 'paused'].includes(invite.status));
      // console.log("Active invites:", activeInvites);
      setInvites(activeInvites);
    } catch (error) {
      console.error('Error fetching invites:', error);
      setError("Failed to fetch active invites");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  interface QuickActionButtonProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
  }

  const QuickActionButton: React.FC<QuickActionButtonProps> = ({ icon, label, onPress }) => (
    <TouchableOpacity style={[styles.quickAction, { backgroundColor: colors.surface }]} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: colors.primary }]}>
        <Ionicons name={icon} size={24} color={colors.surface} />
      </View>
      <Text style={[styles.quickActionText, { color: colors.primary }]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderInviteItem = ({ item }: { item: Invite }) => (
    <View style={[styles.inviteItem, { backgroundColor: colors.surface }]}>
      <View style={styles.inviteInfo}>
        <Text style={[styles.inviteName, { color: colors.primary }]}>{item.visitor_name}</Text>
        <Text style={[styles.inviteDetails, { color: colors.textSecondary }]}>Visiting: {item.resident_name}</Text>
        <Text style={[styles.inviteDetails, { color: colors.textSecondary }]}>Status: {item.status}</Text>
        {(item.status === 'checked-in' || item.status === 'active') && (
          <Text style={[styles.inviteDetails, { color: colors.textSecondary }]}>
            Number of Visitors : {item.members_checked_in}
          </Text>
        )}
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading active invites...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={fetchData}>
          <Text style={[styles.retryButtonText, { color: colors.surface }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Security Dashboard</Text>

      <View style={styles.quickActionsContainer}>
        <QuickActionButton
          icon="scan-outline"
          label="Verify Invite"
          onPress={() => router.push('verifyCode')}
        />
        <QuickActionButton
          icon="list-outline"
          label="Visitor Log"
          onPress={() => router.push('visitorManagement')}
        />
      </View>

      <View style={[styles.invitesContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Visitors ({invites.length})</Text>
        <FlatList
          data={invites}
          keyExtractor={(item) => item.id}
          renderItem={renderInviteItem}
          ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.textSecondary }]}>No active visitors</Text>}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickAction: {
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    borderRadius: 20,
    padding: 10,
    marginBottom: 10,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  invitesContainer: {
    flex: 1,
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  inviteItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  inviteInfo: {
    flex: 1,
  },
  inviteName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  inviteDetails: {
    fontSize: 14,
    marginBottom: 2,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});

export default SecurityHomeScreen;
