import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '../../../context/GlobalProvider';
import { fetchAllInvites } from '../../../lib/invite';
import { Ionicons } from '@expo/vector-icons';
import SecurityVisitorCard from '../../../components/SecurityVisitorCard';
import { useTheme } from '../../../context/ThemeContext';
import { lightColors, darkColors } from '../../../constants/ThemeColors';

interface Invite {
  id: string;
  end_date_time: string;
  is_recurring: boolean;
  group_name?: string;
  status: string;
  visitor_name: string;
  address: string;
}

const VisitorManagement: React.FC = () => {
  const { user, filteredInvites, setFilteredInvites } = useGlobalContext();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('Visitor');
  const [visitorStatus, setVisitorStatus] = useState<string>('current');
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? darkColors : lightColors;

  const fetchData = async () => {
    try {
      const data = await fetchAllInvites();
      const sortedData = data.sort((a: Invite, b: Invite) => new Date(b.end_date_time).getTime() - new Date(a.end_date_time).getTime());
      setInvites(sortedData);
      filterInvites(sortedData, activeTab, searchTerm, visitorStatus);
    } catch (error) {
      console.error('Error fetching invites:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  useEffect(() => {
    filterInvites(invites, activeTab, searchTerm, visitorStatus);
  }, [activeTab, searchTerm, visitorStatus]);

  const filterInvites = (invites: Invite[], tab: string, searchTerm: string, status: string) => {
    let filtered: Invite[] = invites;

    if (tab === 'Utility') {
      filtered = filtered.filter((invite) => invite.is_recurring);
    }
    if (tab === 'Visitor') {
      filtered = filtered.filter((invite) => !invite.is_recurring || invite.group_name);
    }
    if (status === 'current') {
      filtered = filtered.filter((invite) => ['checked-in', 'active'].includes(invite.status));
    } else if (status === 'previous') {
      filtered = filtered.filter((invite) => ['checked-out', 'completed'].includes(invite.status));
    }
    if (searchTerm) {
      filtered = filtered.filter((invite) =>
        invite.visitor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invite.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredInvites(filtered);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const renderItem = ({ item }: { item: Invite }) => (
    <SecurityVisitorCard visitor={item} refreshInvites={fetchData} />
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Visitor Management</Text>
      <View style={[styles.tabContainer, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Visitor' && styles.activeTab, { backgroundColor: activeTab === 'Visitor' ? colors.primary : colors.surface }]}
          onPress={() => setActiveTab('Visitor')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'Visitor' ? colors.surface : colors.text }]}>Visitor</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Utility' && styles.activeTab, { backgroundColor: activeTab === 'Utility' ? colors.primary : colors.surface }]}
          onPress={() => setActiveTab('Utility')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'Utility' ? colors.surface : colors.text }]}>Utility</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <Ionicons name="search" size={24} color={colors.primary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search by visitor or address"
          placeholderTextColor={colors.textSecondary}
          value={searchTerm}
          onChangeText={handleSearch}
        />
        {searchTerm !== '' && (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <Ionicons name="close-circle" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.statusTabContainer}>
        <TouchableOpacity
          style={[styles.statusTab,  { backgroundColor: visitorStatus === 'current' ? colors.primary : colors.surface }]}
          onPress={() => setVisitorStatus('current')}
        >
          <Text style={[styles.statusTabText, { color: visitorStatus === 'current' ? colors.surface : colors.text }]}>Current</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statusTab, { backgroundColor: visitorStatus === 'previous' ? colors.primary : colors.surface }]}
          onPress={() => setVisitorStatus('previous')}
        >
          <Text style={[styles.statusTabText, { color: visitorStatus === 'previous' ? colors.surface : colors.text }]}>Previous</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={filteredInvites}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No visitors found</Text>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderRadius: 10,
  },
  tabText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  statusTabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statusTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTabText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VisitorManagement;
