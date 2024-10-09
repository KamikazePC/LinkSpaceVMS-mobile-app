import React, { useRef, useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Share, ActivityIndicator, ScrollView, TouchableWithoutFeedback } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import moment from 'moment';
import { useTheme } from '../context/ThemeContext';
import { darkColors, lightColors } from '../constants/ThemeColors';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import URIQRCodeGenerator from './improved-qr-code-generation';

const VisitorDetailsModal = ({ isVisible, onClose, visitor }) => {
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? darkColors : lightColors;
  const viewShotRef = useRef();
  const [isSharing, setIsSharing] = useState(false);

  const shareOTP = async () => {
    setIsSharing(true);
    try {
      await Share.share({
        message: `Hi ${visitor.visitor_name},\n\nYour one-time code is ${visitor.otp}\n\nAddress: ${visitor.address}\nPowered by LinkSpace Ltd`,
      });
    } catch (error) {
      console.error('Error sharing OTP:', error.message);
    } finally {
      setIsSharing(false);
    }
  };

  const shareQRCode = async () => {
    setIsSharing(true);
    try {
      if (!viewShotRef.current) {
        throw new Error('viewShotRef.current is undefined');
      }

      const uri = await viewShotRef.current.capture();
      await Sharing.shareAsync(uri, {
        dialogTitle: 'Share QR code',
        mimeType: 'image/png',
      });
    } catch (error) {
      console.error('Error sharing QR code:', error);
    } finally {
      setIsSharing(false);
    }
  };

  if (!visitor) return null;

  const formatDateTime = (dateTime) => {
    return dateTime ? moment(dateTime).format('MMM D, YYYY h:mm A') : 'N/A';
  };

  const canShareCode = visitor.status !== 'checked-in' && visitor.status !== 'checked-out';
  const isUtilityInvite = visitor.is_recurring;

  // Prepare the QR code data
  const qrCodeData = {
    id: visitor.id,
    otp: visitor.otp
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.centeredView}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalView, { backgroundColor: colors.surface }]}>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Visitor Details</Text>
              <ScrollView style={styles.scrollView}>
                <DetailRow label="Name" value={visitor.visitor_name} colors={colors} />
                <DetailRow label="Status" value={visitor.status} colors={colors} />
                {visitor.status === 'pending' && (
                  <DetailRow label="Expires On" value={moment(visitor.end_date_time).format('MMM DD, hh:mm A')} colors={colors} />
                )}
                <DetailRow label="Entry Time" value={formatDateTime(visitor.entry_time)} colors={colors} />
                <DetailRow label="Exit Time" value={formatDateTime(visitor.exit_time)} colors={colors} />
                <DetailRow label="Visit Code" value={visitor.otp} colors={colors} />
                {visitor.status === 'active' && (
                  <DetailRow label="Number of Visitors" value={visitor.membersCheckedIn.toString()} colors={colors} />
                )}
                {canShareCode && (
                  <View style={styles.shareButtonsContainer}>
                    <TouchableOpacity 
                      style={[styles.shareButton, { backgroundColor: colors.primary }, isSharing && styles.disabledButton]} 
                      onPress={shareOTP}
                      disabled={isSharing}
                    >
                      {isSharing ? (
                        <ActivityIndicator color={colors.surface} />
                      ) : (
                        <>
                          <MaterialIcons name="content-copy" size={18} color={colors.surface} />
                          <Text style={[styles.shareButtonText, { color: colors.surface }]}>Share OTP</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    {!isUtilityInvite && (
                      <TouchableOpacity 
                        style={[styles.shareButton, { backgroundColor: colors.primary }, isSharing && styles.disabledButton]} 
                        onPress={shareQRCode}
                        disabled={isSharing}
                      >
                        {isSharing ? (
                          <ActivityIndicator color={colors.surface} />
                        ) : (
                          <>
                            <Feather name="share-2" size={18} color={colors.surface} />
                            <Text style={[styles.shareButtonText, { color: colors.surface }]}>Share QR Code</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                {!isUtilityInvite && (
                  <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }} style={{ opacity: 0, position: 'absolute', top: -9999, left: -9999 }}>
                    <View style={styles.qrCodeWrapper}>
                      <View style={styles.qrCodeBackground}>
                        <Text style={styles.qrInfoText}>Hi {visitor.visitor_name}, you're invited!</Text>
                        <Text style={styles.qrInfoText}>The address is {visitor.address}</Text>
                        <Text style={styles.qrInfoText}>Your one-time code is {visitor.otp}</Text>
                        <URIQRCodeGenerator inviteData={qrCodeData} />
                        <Text style={styles.qrInfoText}>Please present your code at the estate gate to gain access</Text>
                        <Text style={styles.qrInfoText}>Valid from {formatDateTime(visitor.start_date_time)} to {formatDateTime(visitor.end_date_time)}</Text>
                        <Text style={styles.qrInfoText}>Powered by LinkSpace Ltd</Text>
                      </View>
                    </View>
                  </ViewShot>
                )}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const DetailRow = ({ label, value, colors }) => (
  <View style={styles.detailRow}>
    <Text style={[styles.label, { color: colors.text }]}>{label}:</Text>
    <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
    maxHeight: '80%',
  },
  scrollView: {
    width: '100%',
  },
  closeButton: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  value: {
    fontSize: 16,
  },
  shareButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 15,
  },
  shareButton: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
  },
  shareButtonText: {
    fontWeight: 'bold',
    marginLeft: 5,
  },
  disabledButton: {
    opacity: 0.6,
  },
  qrCodeWrapper: {
    alignItems: 'center',
    marginTop: 20,
  },
  qrCodeBackground: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  qrInfoText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default VisitorDetailsModal;