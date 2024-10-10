import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, ScrollView, ViewStyle, TextStyle, Alert, ListRenderItemInfo } from 'react-native';;
import { SafeAreaView } from 'react-native-safe-area-context';
import Collapsible from 'react-native-collapsible';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeOutRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useGlobalContext } from '../../../context/GlobalProvider';
import { SwipeListView, RowMap } from 'react-native-swipe-list-view';
import { fetchInvites} from '../../../lib/invite';
import { useTheme } from '../../../context/ThemeContext';
import { lightColors, darkColors } from '../../../constants/ThemeColors';
import CustomAlert from '../../../components/CustomAlert';
import moment from 'moment';
import { deleteAllNotifications, deleteNotification, fetchNotifications, markNotificationAsRead } from '@context/lib/notifications';
import { supabase } from '@context/lib/supabase';

interface QuickActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  colors: typeof lightColors | typeof darkColors;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ icon, label, onPress, disabled, colors }) => (
  <TouchableOpacity 
    style={[styles.quickAction, { backgroundColor: colors.surface } as ViewStyle, disabled && styles.disabledAction]} 
    onPress={onPress}
    disabled={disabled}
  >
    <View style={[styles.quickActionIcon, { backgroundColor: colors.primary }]}>
      <Ionicons name={icon} size={24} color={colors.surface} />
    </View>
    <Text style={[styles.quickActionText, { color: disabled ? colors.textSecondary : colors.primary }]}>{label}</Text>
  </TouchableOpacity>
);

interface NotificationItemProps {
  notification: Notification;
  onPress: () => void;
  colors: typeof lightColors | typeof darkColors;
}

interface Notification {
  id: string;
  read: boolean;
  title: string;
  message: string;
  created_at: string;
}
const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onPress, colors }) => (
  <Animated.View
    exiting={FadeOutRight}
    style={[styles.notificationItem, { backgroundColor: colors.surface }]}
  >
    <TouchableOpacity onPress={onPress} style={styles.notificationContent}>
      <Ionicons 
        name={notification.read ? 'checkmark-circle-outline' : 'alert-circle-outline'} 
        size={24} 
        color={notification.read ? colors.textSecondary : colors.primary} 
      />
      <View style={styles.notificationTextContent}>
        <Text style={[styles.notificationTitle, { color: colors.text } as TextStyle, !notification.read && styles.unreadText]}>{notification.title}</Text>
        <Text style={[styles.notificationText, { color: colors.textSecondary }]}>{notification.message}</Text>
        <Text style={[styles.notificationTime, { color: colors.textSecondary }]}>{moment(notification.created_at).format('MMM DD, YYYY hh:mm A')}</Text>
      </View>
    </TouchableOpacity>
  </Animated.View>
);

interface Invite {
  id: string;
  visitor_name?: string;
  group_name?: string;
  start_date_time: string;
  status: string;
}

interface AlertConfig {
  visible: boolean;
  type: 'success' | 'error' | 'info' | '';
  message: string;
  onClose?: () => void;
  onConfirm?: () => void;
}



const HomeScreen: React.FC = () => {
  const { user } = useGlobalContext();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [upcomingVisits, setUpcomingVisits] = useState<Invite[]>([]);
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const { isDarkMode, themePreference, setTheme } = useTheme();
  const colors: typeof lightColors | typeof darkColors = isDarkMode ? darkColors : lightColors;
  const router = useRouter();
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({ visible: false, type: '', message: '' });

  const cycleTheme = () => {
    const themes = ['system', 'light', 'dark'];
    const nextIndex = (themes.indexOf(themePreference) + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const fetchData = useCallback(async () => {
    if (user && user.address) {
      try {
        const fetchedNotifications = await fetchNotifications(user.id);
        setNotifications(fetchedNotifications);
        
        const fetchedInvites = await fetchInvites(user.address, user.id);
        setInvites(fetchedInvites);
        
        const now = new Date();
        const upcomingVisits = fetchedInvites
          .filter(invite => 
            invite.status === 'pending' && new Date(invite.start_date_time) >= now
          )
          .sort((a, b) => moment(a.start_date_time).diff(moment(b.start_date_time)))
          .slice(0, 5);

        setUpcomingVisits(upcomingVisits);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }
  }, [user]);

  
  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData,  5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(intervalId);
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);


  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.read) {
      try {
        await markNotificationAsRead(notification.id);
        await deleteNotification(notification.id);
        setNotifications(prevNotifications => 
          prevNotifications.filter(n => n.id !== notification.id)
        );
      } catch (error) {
        console.error('Error handling notification:', error);
        Alert.alert('Error', 'Failed to process notification');
      }
    }
  };

  const handleDeleteAllNotifications = async () => {
    console.log('Handling notification clear...');

    if (notifications.length === 0) {
        console.log('No notifications to clear');
        return;
    }

    try {
        console.log('User ID:', user?.id);  // Log user ID

        if (!user?.id) {
            console.error('User ID is not available.');
            return;
        }

        // Log current notifications
        const { data: notificationsData, error: notificationsError } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id);

        if (notificationsError) {
            console.error('Error fetching notifications:', notificationsError);
        } else {
            console.log('Current notifications for user:', notificationsData);
        }

        await deleteAllNotifications(user.id);  // Attempt deletion

        setNotifications([]);  // Clear local notifications state

        setAlertConfig({
            visible: true,
            type: 'success',
            message: 'All notifications cleared successfully'
        });
    } catch (error) {
        console.error('Error clearing notifications:', error);
        setAlertConfig({
            visible: true,
            type: 'error',
            message: 'Failed to clear notifications'
        });
    }
};



  const handleDeleteNotification = async (id: string) => {
    try {
      await deleteNotification(id);
      setNotifications(prevNotifications => 
        prevNotifications.filter(n => n.id !== id)
      );
      setAlertConfig({
        visible: true,
        type: 'success',
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      setAlertConfig({
        visible: true,
        type: 'error',
        message: 'Failed to delete notification'
      });
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'view_visitor_log':
        router.push('/(tabs)/visitorLog');
        break;
      case 'create_invite':
        router.push('/(tabs)/invite');
        break;
      default:
        break;
    }
  };

  const renderHiddenItem = (
    rowData: ListRenderItemInfo<Notification>, 
    rowMap: RowMap<Notification>
  ) => {
    const { item } = rowData;  // Extract item from rowData
  
    return (
      <View style={[styles.rowBack, { backgroundColor: colors.error }]}>
        <TouchableOpacity
          style={[styles.backRightBtn, styles.backRightBtnRight]}
          onPress={() => handleDeleteNotification(item.id)}  // Use item.notification_Id
        >
          <Ionicons name="trash-outline" size={24} color={colors.surface} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderVisitItem = ({ item, index }: { item: Invite; index: number }) => (
    <View style={[styles.visitItem, { borderColor: colors.border }]}>
    <View style={[styles.visitIconContainer, { backgroundColor: colors.primaryDark }]}>
      <Ionicons name="person-outline" size={24} color={colors.surface} />
    </View>
    <View style={styles.visitInfo}>
      <Text style={[styles.visitName, { color: colors.text }]}>{item.visitor_name || item.group_name}</Text>
      <Text style={[styles.visitDate, { color: colors.textSecondary }]}>
        Starts on {moment(item.start_date_time).format('MMM DD, YYYY hh:mm A')}
      </Text>
      <Text style={[styles.visitTime, { color: colors.textSecondary }]}>
        {moment(item.start_date_time).fromNow()}
      </Text>
    </View>
  </View>

);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <SwipeListView
        ListHeaderComponent={() => (
          <>
           <View style={[styles.headerContainer, { backgroundColor: colors.primary }]}>
              <View>
                <Text style={[styles.welcome, { color: colors.surface }]}>Welcome back,</Text>
                <Text style={[styles.username, { color: colors.surface }]}>
                  { user?.username}
                </Text>
              </View>
              <TouchableOpacity onPress={cycleTheme} style={styles.themeToggle}>
                <Ionicons 
                  name={themePreference === 'system' ? 'phone-portrait' : (isDarkMode ? 'moon' : 'sunny')} 
                  size={24} 
                  color={colors.surface} 
                />
                <Text style={[styles.themeText, { color: colors.surface }]}>
                  {themePreference.charAt(0).toUpperCase() + themePreference.slice(1)}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.quickActionsContainer}>
              <QuickActionButton
                 icon="list-outline"
                 label="Visitor Log"
                 onPress={() => handleQuickAction('view_visitor_log')}
                 colors={colors}
               />
               <QuickActionButton
                 icon="add-circle-outline"
                 label="Create Invite"
                 onPress={() => handleQuickAction('create_invite')}
                 colors={colors}
               />
            </View>
            <View style={[styles.sectionContainer, { backgroundColor: colors.surface }]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Notifications</Text>
                {notifications.length > 0 && (
                  <TouchableOpacity onPress={handleDeleteAllNotifications}>
                    <Text style={[styles.clearAllText, { color: colors.primary }]}>Clear All</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </>
        )}
        data={notifications}
        renderItem={({ item }) => (
          <NotificationItem 
            notification={item} 
            onPress={() => handleNotificationPress(item)}
            colors={colors}
          />
        )}
        renderHiddenItem={renderHiddenItem}
        rightOpenValue={-75}
        previewRowKey={'0'}
        previewOpenValue={-40}
        previewOpenDelay={3000}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.textSecondary }]}>No new notifications</Text>}
        ListFooterComponent={() => (
          <View style={[styles.sectionContainer, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Visits</Text>
              {/* We can keep this icon for visual consistency if needed */}
              {/* <Ionicons name="chevron-up" size={24} color={colors.primary} /> */}
            </View>
            <ScrollView 
              style={styles.upcomingVisitsScrollView}
              contentContainerStyle={styles.upcomingVisitsContentContainer}
            >
              {upcomingVisits.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No upcoming visits</Text>
              ) : (
                upcomingVisits.map((visit, index) => (
                  <React.Fragment key={visit.id || index}>
                    {renderVisitItem({ item: visit, index })}
                  </React.Fragment>
                ))
              )}
            </ScrollView>
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      />
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        message={alertConfig.message}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
        onConfirm={alertConfig.onConfirm}
      />
    </SafeAreaView>
  );
};

interface Colors {
  border: string;
  primaryDark: string;
  surface: string;
  text: string;
  textSecondary: string;
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 80,
  },       
  headerContainer: {
    padding: 20,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcome: {
    fontSize: 18,
    fontWeight: '500',
  },
  username: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  quickAction: {
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    width: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  quickActionIcon: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionContainer: {
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationTextContent: {
    marginLeft: 12,
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  notificationText: {
    fontSize: 14,
    marginTop: 4,
  },
  notificationTime: {
    fontSize: 12,
    marginTop: 4,
  },
  unreadText: {
    fontWeight: 'bold',
  },
  rowBack: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingRight: 15,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
  },
  backRightBtn: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    width: 75,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  backRightBtnRight: {
    right: 0,
  },
  upcomingVisitsContainer: {
    maxHeight: 300, // Set a maximum height for the scrollable area
  },
  upcomingVisitsContent: {
    paddingBottom: 12,
  },
  visitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  visitIconContainer: {
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
  },
  visitInfo: {
    flex: 1,
  },
  visitName: {
    fontSize: 16,
    fontWeight: '600',
  },
  visitDate: {
    fontSize: 14,
    marginTop: 2,
  },
  visitTime: {
    fontSize: 12,
    marginTop: 2,
  },
  viewMoreContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  viewMoreText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  guestBadge: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  disabledAction: {
    opacity: 0.6,
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  upcomingVisitsScrollView: {
    maxHeight: 300, // Adjust this value as needed
  },
  upcomingVisitsContentContainer: {
    paddingBottom: 16, // Add some padding at the bottom for better scrolling
  },
});

export default HomeScreen;