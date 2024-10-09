import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { deleteInvite } from '../lib/invite';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { lightColors, darkColors } from '../constants/ThemeColors';
import CustomAlert from './CustomAlert';

export default function VisitorCard({ visitor, onPress, refreshInvites }) {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? darkColors : lightColors;
  const [alertConfig, setAlertConfig] = useState({ visible: false, type: '', message: '', onConfirm: null });

  const handleCreateNewInvite = () => {
    console.log(visitor);
    router.push({
      pathname: '/individualInvite',
      params: { visitorName: visitor.visitor_name, visitorPhone: visitor.visitor_phone },
    });
  };

  const handleDeleteInvite = async () => {
    setAlertConfig({
      visible: true,
      type: 'confirm',
      message: 'Do you want to delete this invite?',
      onConfirm: async () => {
        try {
          await deleteInvite(visitor.id, visitor);
          refreshInvites();
          setAlertConfig({
            visible: true,
            type: 'success',
            message: 'Invite deleted successfully'
          });
        } catch (error) {
          setAlertConfig({
            visible: true,
            type: 'error',
            message: error.message || 'Failed to delete invite'
          });
        }
      }
    });
  };

  const handleAlertClose = () => {
    if (alertConfig.type === 'confirm' && alertConfig.onConfirm) {
      alertConfig.onConfirm();
    }
    setAlertConfig({ ...alertConfig, visible: false, onConfirm: null });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return colors.warning;
      case 'checked-in': return colors.success;
      case 'paused': return colors.info;
      case 'active': return colors.success;
      case 'checked-out': return colors.textSecondary;
      case 'completed': return colors.textSecondary;
      default: return colors.text;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return 'schedule';
      case 'checked-in': return 'login';
      case 'paused': return 'pause';
      case 'active': return 'person';
      case 'checked-out': return 'logout';
      case 'completed': return 'done';
      default: return 'help-outline';
    }
  };

  const statusColor = getStatusColor(visitor.status);
  const showAddButton = !['pending', 'checked-in', 'paused', 'active'].includes(visitor.status);
  const showDeleteButton = visitor.status === 'pending';

  return (
    <>
      <TouchableOpacity onPress={() => onPress(visitor)} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardContent}>
          <View style={styles.leftContent}>
            <View style={[styles.statusIndicator, { backgroundColor: statusColor }]}>
              <MaterialIcons name={getStatusIcon(visitor.status)} size={20} color={colors.surface} />
            </View>
            <View style={styles.textContainer}>
              {visitor.group_name ? (
                <Text style={[styles.groupName, { color: colors.text }]}>{visitor.group_name}</Text>
              ) : (
                <Text style={[styles.name, { color: colors.text }]}>{visitor.visitor_name}</Text>
              )}
              <Text style={[styles.status, { color: statusColor }]}>{visitor.status.charAt(0).toUpperCase() + visitor.status.slice(1)}</Text>
            </View>
          </View>
          <View style={styles.actions}>
            {showAddButton && (
              <TouchableOpacity 
                onPress={handleCreateNewInvite} 
                style={[styles.button, { backgroundColor: colors.primary }]}
              >
                <AntDesign name="plus" size={16} color={colors.surface} />
              </TouchableOpacity>
            )}
            {showDeleteButton && (
              <TouchableOpacity 
                onPress={handleDeleteInvite} 
                style={[styles.deleteButton, { backgroundColor: colors.error }]}
              >
                <AntDesign name="delete" size={16} color={colors.surface} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        message={alertConfig.message}
        onClose={handleAlertClose}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  status: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
  },
  button: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
});