import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, RefreshControl, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import DateTimePicker from '@react-native-community/datetimepicker';
import VisitorCard from '../../../components/VisitorCard';
import VisitorDetailsModal from '../../../components/visitor-details-modal';
import { fetchInvites, scheduleExpiredInviteCleanup } from '../../../lib/invite';
import { useGlobalContext } from '../../../context/GlobalProvider';
import { useTheme } from '../../../context/ThemeContext';
import { lightColors, darkColors } from '../../../constants/ThemeColors';
import { ListRenderItem, ListRenderItemInfo } from 'react-native';
import { supabase } from '@context/lib/supabase';


interface Invite {
  id: string;
  visitor_name: string;
  otp: string;
  visitor_phone?: string;
  created_at: string;
  status: 'pending' | 'checked-in' | 'paused' | 'active' | 'checked-out' | 'completed';
  // Add other properties as needed
}

interface TabData {
  Expected: Invite[];
  Current: Invite[];
  Previous: Invite[];
}

const VisitorLog: React.FC = () => {
  const { user } = useGlobalContext();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<Date>(moment().startOf('day').toDate());
  const [filterEndDate, setFilterEndDate] = useState<Date>(moment().toDate());
  const [showStartDatePicker, setShowStartDatePicker] = useState<boolean>(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedVisitor, setSelectedVisitor] = useState<Invite | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const searchInputRef = useRef<TextInput | null>(null);
  const [activeTab, setActiveTab] = useState<keyof TabData>('Expected');
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? darkColors : lightColors;

  const fetchAndSetInvites = useCallback(async () => {
    if (!user || !user.address) return;
    try {
      const data = await fetchInvites(user.address, user.id);
      const sortedData = data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setInvites(sortedData);
    } catch (error) {
      console.error('Error fetching invites:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchAndSetInvites();

    const groupInviteSubscription = supabase
      .channel('public:group_invites')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_invites' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          fetchAndSetInvites(); // Fetch invites on any new or updated invite
        }
      })
      .subscribe();
    const oneTimeInviteSubscription = supabase
      .channel('public:individual_one_time_invite')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'individual_one_time_invite' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          fetchAndSetInvites(); // Fetch invites on any new or updated invite
        }
      })
      .subscribe();
    const recurringInviteSubscription = supabase
      .channel('public:individual_recurring_invites')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'individual_recurring_invites' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          fetchAndSetInvites(); // Fetch invites on any new or updated invite
        }
      })
      .subscribe();

    // Schedule cleanup of expired invites
    scheduleExpiredInviteCleanup(30); // Run every 30 minutes

    return () => {
      supabase.removeChannel(groupInviteSubscription);
      supabase.removeChannel(oneTimeInviteSubscription);
      supabase.removeChannel(recurringInviteSubscription);
    };
  }, [fetchAndSetInvites]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAndSetInvites();
    setRefreshing(false);
  }, [fetchAndSetInvites]);

  const filteredInvites = useMemo(() => {
    let filtered = invites;
  
    if (isSearching) {
      filtered = filtered.filter((invite) =>
        invite.visitor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invite.otp.includes(searchQuery) ||
        invite.visitor_phone?.includes(searchQuery)
      );
    } else {
      filtered = filtered.filter((invite) => {
        const inviteDate = moment(invite.created_at);
        const dateMatch = inviteDate.isBetween(moment(filterStartDate), moment(filterEndDate), 'day', '[]');
        return ['pending', 'active', 'checked-in'].includes(invite.status) || dateMatch;
      });
    }
  
    return filtered;
  }, [invites, searchQuery, filterStartDate, filterEndDate, isSearching]);


  const tabData = useMemo<TabData>(() => {
    const expected = filteredInvites.filter(invite => invite.status === 'pending');
    const current = filteredInvites.filter(invite => ['checked-in', 'active'].includes(invite.status));
    let previous = filteredInvites.filter(invite => ['checked-out', 'completed'].includes(invite.status));
    
    if (previous.length === 0 && !isSearching) {
      previous = invites
        .filter(invite => ['checked-out', 'completed'].includes(invite.status))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);
    }

    return { Expected: expected, Current: current, Previous: previous };
  }, [filteredInvites, isSearching, invites]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    setIsSearching(text.length > 0);
  };


  const renderDatePicker = (date: Date, onDateChange: (date: Date) => void, showPicker: boolean, setShowPicker: (show: boolean) => void) => (
    <TouchableOpacity 
      style={styles.datePickerButton} 
      onPress={() => setShowPicker(true)}
      disabled={isSearching}
    >
      <Text style={[styles.datePickerText, isSearching && { color: colors.textSecondary }]}>
        {moment(date).format('MMM DD, YYYY')}
      </Text>
      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(event: any, selectedDate?: Date) => {
            setShowPicker(false);
            if (selectedDate && selectedDate <= new Date()) {
              onDateChange(selectedDate);
            }
          }}
          maximumDate={new Date()}
        />
      )}
    </TouchableOpacity>
  );


  const handleVisitorPress = (visitor: Invite) => {
    setSelectedVisitor(visitor);
    setModalVisible(true);
  };

  type ListRenderItem<T> = (info: { item: T, index: number, separators: any }) => React.ReactElement<any> | null;
  const renderItem: ListRenderItem<Invite> = ({ item }) => {
    return (
      <VisitorCard 
        visitor={item} 
        onPress={handleVisitorPress} 
        refreshInvites={fetchAndSetInvites} 
      />
    );
  };
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Visitor Log</Text>
      <View style={styles.filterContainer}>
        <TextInput
          ref={searchInputRef}
          style={[styles.searchBar, { backgroundColor: colors.surface, color: colors.text }]}
          placeholder="Search visitors, OTP, or phone"
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={handleSearch}
          onFocus={() => setIsSearching(true)}
          onBlur={() => {
            if (searchQuery.length === 0) {
              setIsSearching(false);
            }
          }}
        />
        {isSearching && (
          <TouchableOpacity 
            style={styles.clearButton} 
            onPress={() => {
              setSearchQuery('');
              setIsSearching(false);
              Keyboard.dismiss();
            }}
          >
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
        {!isSearching && (
          <View style={styles.datePickerContainer}>
            {renderDatePicker(filterStartDate, setFilterStartDate, showStartDatePicker, setShowStartDatePicker)}
            <Text style={[styles.dateRangeSeparator, { color: colors.textSecondary }]}>to</Text>
            {renderDatePicker(filterEndDate, setFilterEndDate, showEndDatePicker, setShowEndDatePicker)}
          </View>
        )}
      </View>
      <View style={[styles.tabContainer, { backgroundColor: colors.surface }]}>
        {['Expected', 'Current', 'Previous'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && [styles.activeTab, { backgroundColor: colors.primary }]
            ]}
            onPress={() => setActiveTab(() => tab as keyof TabData)}
          >
            <Text
              style={[
                styles.tabText,
                { color: colors.textSecondary },
                activeTab === tab && [styles.activeTabText, { color: colors.surface }]
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={tabData[activeTab]}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.textSecondary }]}>No visitors in this category</Text>}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
      <VisitorDetailsModal
        isVisible={modalVisible}
        onClose={() => setModalVisible(false)}
        visitor={selectedVisitor}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
    padding: 16,
    paddingBottom: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1A3B5D',
  },
  filterContainer: {
    marginBottom: 16,
  },
  searchBar: {
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePickerButton: {
    flex: 1,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  datePickerText: {
    color: '#4A6FA5',
  },
  dateRangeSeparator: {
    marginHorizontal: 8,
    color: '#4A6FA5',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#2E5A88',
    borderRadius: 8,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4A6FA5',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  emptyText: {
    textAlign: 'center',
    color: '#4A6FA5',
    marginTop: 16,
    fontStyle: 'italic',
  },
  clearButton: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
});

export default VisitorLog;