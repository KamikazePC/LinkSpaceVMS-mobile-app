import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kcdkomqaxsrylywjhypz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjZGtvbXFheHNyeWx5d2poeXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjczNTMzMTUsImV4cCI6MjA0MjkyOTMxNX0.IqsKsggUgz2OAA03xKlmjeb65urzgqTrWhNg2qAaMXY'
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }   
  },
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})


const subscribeToInvites = (callback: (eventType: string, payload: any) => void) => {
  const channel = supabase.channel('invite-updates');

  const tables = ['group_invites', 'individual_one_time_invites', 'individual_recurring_invites'];

  tables.forEach((table) => {
    channel.on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: table,
    }, (payload) => {
      callback('INSERT', payload.new);
    });

    channel.on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: table,
      filter: `status=in.(pending,checked-in,checked-out,active,completed)`,
    }, (payload) => {
      callback('UPDATE', payload.new);
    });
  });

  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('Subscribed to invite updates');
    } else if (status === 'CLOSED') {
      console.log('Subscription to invite updates closed');
    } else if (status === 'CHANNEL_ERROR') {
      console.error('Error in invite updates channel');
    }
  });

  return () => {
    supabase.removeChannel(channel);
  };
};

const subscribeToGroupInviteMemberCount = (groupInviteId: string, callback: (count: number) => void) => {
  const channel = supabase.channel('group_invites');
  channel.on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'group_invites',
  }, (payload) => {
    if (payload.new.id === groupInviteId) {
      callback(payload.new.members_checked_in);
    }
  });

  channel.subscribe();
  return () => supabase.removeChannel(channel);
};

const subscribeToNotifications = (userId: string, callback: (payload: any) => void) => {
  const channel = supabase.channel(`user-${userId}`);
  channel.on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
  }, (payload) => {
    callback(payload.new);
  });

  channel.subscribe();
  return () => supabase.removeChannel(channel);
}