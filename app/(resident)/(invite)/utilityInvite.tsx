import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useGlobalContext } from '../../../context/GlobalProvider';
import { createInvite } from '../../../lib/invite';
import { useTheme } from '../../../context/ThemeContext';
import { darkColors, lightColors } from '../../../constants/ThemeColors';
import CustomAlert from '../../../components/CustomAlert';
import moment from 'moment';

interface AlertConfig {
  visible: boolean;
  type: 'success' | 'error' | '';
  message: string;
}

interface Invite {
  // Define the invite structure according to your API response
  id: string;
  visitor_name: string;
  visitor_phone: string;
  start_date_time: string;
  end_date_time: string;
  // Add any other relevant fields
}

export default function ImprovedUtilityInvite() {
  const { user, fetchAndSetInvites } = useGlobalContext();
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? darkColors : lightColors;

  const [visitorName, setVisitorName] = useState<string>('');
  const [visitorPhone, setVisitorPhone] = useState<string>('');
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({ visible: false, type: '', message: '' });
  const [createdInvite, setCreatedInvite] = useState<Invite | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isInviteCreated, setIsInviteCreated] = useState<boolean>(false);

  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState<Date>(moment().add(1, 'minute').toDate());
  const [endTime, setEndTime] = useState<Date>(moment().add(1, 'hour').toDate());

  const [showStartDatePicker, setShowStartDatePicker] = useState<boolean>(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState<boolean>(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState<boolean>(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState<boolean>(false);

  const nigerianStartTime = moment(startTime).utcOffset('+0100').format('YYYY-MM-DD HH:mm:ss');
  const nigerianEndTime = moment(endTime).utcOffset('+0100').format('YYYY-MM-DD HH:mm:ss');
  const nigerianTime = moment().utcOffset('+0100').format('YYYY-MM-DD HH:mm:ss');
  
  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || startDate;
    setShowStartDatePicker(false);
    if (currentDate >= new Date()) {
      setStartDate(currentDate);
      if (currentDate > endDate) {
        setEndDate(currentDate);
      }
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || endDate;
    setShowEndDatePicker(false);
    if (currentDate >= startDate) {
      setEndDate(currentDate);
    }
  };

  const handleStartTimeChange = (event: any, selectedTime?: Date) => {
    setShowStartTimePicker(false);
    if (selectedTime) {
      setStartTime(selectedTime);
      if (selectedTime >= endTime) {
        setEndTime(new Date(selectedTime.getTime() + 60 * 60 * 1000)); // Set end time 1 hour after start time
      }
    }
  };

  const handleEndTimeChange = (event: any, selectedTime?: Date) => {
    setShowEndTimePicker(false);
    if (selectedTime && selectedTime > startTime) {
      setEndTime(selectedTime);
    } else {
      console.error('End time cannot be before start time');
      setAlertConfig({
        visible: true,
        type: 'error',
        message: 'End time must be after start time',
      });
    }
  };


  const handleCreateInvite = async () => {
    if (!user) {
      setAlertConfig({ visible: true, type: 'error', message: 'User not logged in' });
      return;
    }

    if (visitorName.trim() === '' || visitorPhone.trim() === '') {
      setAlertConfig({ visible: true, type: 'error', message: 'All fields are required' });
      return;
    }

    if (visitorPhone.length !== 11) {
      setAlertConfig({ visible: true, type: 'error', message: 'Phone number must be 11 digits' });
      return;
    }

    // Validate that date is not in the past
    if (moment(startDate).isSame(new Date(), 'day')) {
      // If the selected date is today, compare the times
      if (startTime < new Date()) {
        setAlertConfig({ visible: true, type: 'error', message: 'Please select a future time.' });
        return;
      }
    } else if (moment(startDate).isBefore(new Date(), 'day')) {
      // If the selected date is before today, it's also invalid
      setAlertConfig({ visible: true, type: 'error', message: 'Please select a future date.' });
      return;
    }
    

    setIsSubmitting(true);

    try {
      const startDateTime = moment(` ${nigerianStartTime}`);
      const endDateTime = moment(`${nigerianEndTime}`);
      
      const newInvite = await createInvite(
        user.username,
        visitorName,
        visitorPhone,
        user.address,
        user.estate_id,
        user.id,
        startDateTime,
        endDateTime,
        true // isRecurring is always true for utility invites
      );


      if (newInvite) {
        setCreatedInvite(newInvite); // Assuming API returns an array
        fetchAndSetInvites(user.address, true);
        setAlertConfig({ 
          visible: true, 
          type: 'success', 
          message: 'Utility invite created successfully' 
        });
        setIsInviteCreated(true);
      } else {
        throw new Error('Invite creation failed, newInvite is null');
      }
    } catch (error) {
      console.error('Error creating utility invite:', error);
      setAlertConfig({ visible: true, type: 'error', message: 'Failed to create utility invite. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAlertClose = () => {
    setAlertConfig({ ...alertConfig, visible: false });
    if (alertConfig.type === 'success' && createdInvite) {
      // console.log('Navigating to utilityInviteDetails...');
      router.push({
        pathname: "/utilityInviteDetails",
        params: { invite: JSON.stringify(createdInvite) }
      });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Create Utility Invite</Text>
        </View>
        <View style={styles.content}>
          <View style={styles.form}>
            <TextInput
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
              value={visitorName}
              onChangeText={setVisitorName}
              placeholder="Visitor Name"
              placeholderTextColor={colors.textSecondary}
            />
            <TextInput
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
              value={visitorPhone}
              onChangeText={setVisitorPhone}
              placeholder="Visitor Phone (11 digits)"
              placeholderTextColor={colors.textSecondary}
              keyboardType="phone-pad"
              maxLength={11}
            />
            <View style={styles.dateContainer}>
              <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text style={[styles.dateButtonText, { color: colors.text }]}>
                  Start Date: {moment(startDate).format('MMM D, YYYY')}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.dateContainer}>
              <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text style={[styles.dateButtonText, { color: colors.text }]}>
                  End Date: {moment(endDate).format('MMM D, YYYY')}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.timeContainer}>
              <TouchableOpacity
                style={[styles.timeButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setShowStartTimePicker(true)}
              >
                <Text style={[styles.timeButtonText, { color: colors.text }]}>
                  Start: {moment(startTime).format('h:mm A')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.timeButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Text style={[styles.timeButtonText, { color: colors.text }]}>
                  End: {moment(endTime).format('h:mm A')}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
            style={[
              styles.createButton, 
              { backgroundColor: colors.primary },
              (isSubmitting || !visitorName || !visitorPhone || isInviteCreated) && styles.disabledButton
            ]} 
            onPress={handleCreateInvite}
            disabled={isSubmitting || !visitorName || !visitorPhone || isInviteCreated}
             >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <Text style={[styles.buttonText, { color: colors.surface }]}>
                {isInviteCreated ? 'Invite Created' : 'Create Invite'}
              </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
        {showStartDatePicker && (
          <DateTimePicker value={startDate} mode="date" display="default" onChange={handleStartDateChange} />
        )}
        {showEndDatePicker && (
          <DateTimePicker value={endDate} mode="date" display="default" onChange={handleEndDateChange} />
        )}
        {showStartTimePicker && (
          <DateTimePicker value={startTime} mode="time" display="default" onChange={handleStartTimeChange} />
        )}
        {showEndTimePicker && (
          <DateTimePicker value={endTime} mode="time" display="default" onChange={handleEndTimeChange} />
        )}
      </ScrollView>
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        message={alertConfig.message}
        onClose={handleAlertClose}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  backButton: {
    padding: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  form: {
    marginBottom: 32,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  createButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  dateContainer: {
    marginBottom: 16,
  },
  dateButton: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  dateButtonText: {
    fontSize: 16,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeButton: {
    flex: 1,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  timeButtonText: {
    fontSize: 16,
  },
});
