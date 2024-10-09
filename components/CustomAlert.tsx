import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { lightColors, darkColors } from '../constants/ThemeColors';

interface CustomAlertProps {
  visible: boolean;
  type: 'success' | 'error' | 'info' | 'confirm' | '';
  message: string;
  onClose: () => void;
  onConfirm?: () => void;

}

const CustomAlert: React.FC<CustomAlertProps> = ({ visible, type, message, onClose }) => {
  const { isDarkMode } = useTheme();
  const colors: typeof lightColors | typeof darkColors = isDarkMode ? darkColors : lightColors;

  const getAlertStyle = (): ViewStyle => {
    switch (type) {
      case 'success':
        return { backgroundColor: colors.success };
      case 'error':
        return { backgroundColor: colors.error };
      default:
        return { backgroundColor: colors.primary };
    }
  };

  const getIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'success':
        return 'checkmark-circle-outline';
      case 'error':
        return 'alert-circle-outline';
      default:
        return 'information-circle-outline';
    }
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      animationType="fade"
    >
      <View style={styles.centeredView}>
        <View style={[styles.modalView, { backgroundColor: colors.surface }]}>
          <View style={[styles.iconContainer, getAlertStyle()]}>
            <Ionicons name={getIcon()} size={40} color={colors.surface} />
          </View>
          <Text style={[styles.modalText, { color: colors.text }]}>{message}</Text>
          <TouchableOpacity
            style={[styles.button, getAlertStyle()]}
            onPress={onClose}
          >
            <Text style={[styles.textStyle, { color: colors.surface }]}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
  },
  iconContainer: {
    borderRadius: 50,
    padding: 15,
    marginBottom: 15,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 18,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    minWidth: 100,
  },
  textStyle: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default CustomAlert;