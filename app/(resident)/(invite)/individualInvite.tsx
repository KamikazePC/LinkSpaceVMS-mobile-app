import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams  } from 'expo-router';
import { useGlobalContext } from '../../../context/GlobalProvider';
import { createInvite } from '../../../lib/invite';
import { darkColors, lightColors } from '../../../constants/ThemeColors';
import { useTheme } from '../../../context/ThemeContext';
import CustomAlert from '../../../components/CustomAlert';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment-timezone';

// Define the alert config state type
interface AlertConfig {
  visible: boolean;
  type: 'success' | 'error' | '';
  message: string;
}

// Define the invite type (could be expanded based on your API's response)
interface Invite {
  id: string;
  [key: string]: any;
}


const IndividualInviteScreen: React.FC = () => {
  const { user, fetchAndSetInvites } = useGlobalContext();
  const router = useRouter();
  const {cardVisitorName, cardVisitorPhone } = useLocalSearchParams();
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? darkColors : lightColors;

  // Define state types
  const [visitorName, setVisitorName] = useState<string>('');
  const [visitorPhone, setVisitorPhone] = useState<string>('');
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({
    visible: false,
    type: '',
    message: '',
  });
  const [createdInvite, setCreatedInvite] = useState<Invite | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isInviteCreated, setIsInviteCreated] = useState<boolean>(false);

  const [selectedDate, setSelectedDate] = useState<Date>(moment().toDate());
  const [startTime, setStartTime] = useState<Date>(moment().add(1, 'minute').toDate());
  const [endTime, setEndTime] = useState<Date>(
    moment().add(1, 'hour').toDate()
  );

  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState<boolean>(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState<boolean>(false);

  const nigerianStartTime = moment(startTime).utcOffset('+0100').format('YYYY-MM-DD HH:mm:ss');
  const nigerianEndTime = moment(endTime).utcOffset('+0100').format('YYYY-MM-DD HH:mm:ss');
  const nigerianTime = moment().utcOffset('+0100').format('YYYY-MM-DD HH:mm:ss');

  useEffect(() => {
    // console.log('cardVisitorName', cardVisitorName);
    // console.log('cardVisitorPhone', cardVisitorPhone);
    if (cardVisitorName) {
      console.log(cardVisitorName);
      setVisitorName(cardVisitorName as string);
      console.log(visitorName);
    }
    if (cardVisitorPhone) {
      setVisitorPhone(cardVisitorPhone as string);
    }

    console.log(nigerianStartTime)
  }, [cardVisitorName, cardVisitorPhone]);

  const handleDateChange = (event: any, selected?: Date | undefined) => {
    const currentDate = selected || selectedDate;
    setShowDatePicker(false);
    if (currentDate >= new Date()) {
      setSelectedDate(currentDate);

    }
  };

  const handleStartTimeChange = (event: any, selected?: Date | undefined) => {
    setShowStartTimePicker(false);
    if (selected) {
      setStartTime(selected);
      if (selected <= endTime) {
        setEndTime(new Date(selected.getTime()));
        console.log(startTime);
      }
    }
  };

  const handleEndTimeChange = (event: any, selected?: Date | undefined) => {
    setShowEndTimePicker(false);
    if (selected && selected > startTime) {
      setEndTime(new Date(selected.getTime()));
      console.log(endTime);
    }
  };

  

  const handleCreateInvite = async () => {
    if (!user) {
      setAlertConfig({ visible: true, type: 'error', message: 'User not logged in' });
      return;
    }

    if (visitorName === '' || visitorPhone === '') {
      setAlertConfig({ visible: true, type: 'error', message: 'All fields are required' });
      return;
    }

    if (visitorPhone.length !== 11) {
      setAlertConfig({ visible: true, type: 'error', message: 'Phone number must be 11 digits' });
      return;
    }

    // Validate that start time is before end time
    if (startTime >= endTime) {
      setAlertConfig({ visible: true, type: 'error', message: 'Start time must be before end time.' });
      return;
    }

    //Validate that start time is not in the past
    if (moment(selectedDate).isSame(new Date(), 'day')) {
      // If the selected date is today, compare the times
      if (startTime < new Date()) {
        setAlertConfig({ visible: true, type: 'error', message: 'Please select a future time.' });
        return;
      }
    } else if (moment(selectedDate).isBefore(new Date(), 'day')) {
      // If the selected date is before today, it's also invalid
      setAlertConfig({ visible: true, type: 'error', message: 'Please select a future date.' });
      return;
    }
    setIsSubmitting(true);

    try {
     
      // const date = nigerianTime;
      // const formattedStartTime = moment(startTime).format('HH:mm');
      // const formattedEndTime = moment(endTime).format('HH:mm');

      const startDateTime = moment(` ${nigerianStartTime}`);
      const endDateTime = moment(`${nigerianEndTime}`);
      
      console.log('Before invite creation');
      const newInvite = await createInvite(
        user.username,
        visitorName as string,
        visitorPhone as string,
        user.address,
        user.estate_id,
        user.id,
        startDateTime,
        endDateTime,
        false
      );

      
      setCreatedInvite(newInvite);
      fetchAndSetInvites(user.address, user.id);

      setAlertConfig(prevConfig => ({
        ...prevConfig,
        visible: true,
        type: 'success',
        message: 'Individual invite created successfully',
      }));
      setIsInviteCreated(true);
    } catch (error) {
      setAlertConfig({ visible: true, type: 'error', message: 'Failed to create invite. Please try again.' });
      console.error('Error creating invite:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAlertClose = useCallback(() => {
    setAlertConfig((prevConfig) => ({ ...prevConfig, visible: false }));
  }, []);

  useEffect(() => {
    if (!alertConfig.visible && alertConfig.type === 'success' && createdInvite) {
      router.push({
        pathname: '/inviteDetail',
        params: { invite: JSON.stringify(createdInvite) },
      });
    }
  }, [alertConfig, createdInvite, router]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Create Individual Invite</Text>
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
                style={[
                  styles.dateButton,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  selectedDate && { backgroundColor: colors.primary },
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={[styles.dateButtonText, { color: selectedDate ? colors.surface : colors.text }]}>
                  {selectedDate ? moment(selectedDate).format('MMM D, YYYY') : 'Select Date'}
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
          </View>
          <TouchableOpacity
            style={[
              styles.createButton,
              { backgroundColor: colors.primary },
              (isSubmitting || !visitorName || !visitorPhone || isInviteCreated) && styles.disabledButton,
            ]}
            onPress={handleCreateInvite}
            disabled={isSubmitting || !visitorName || !visitorPhone || isInviteCreated}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.surface }]}>
                {isInviteCreated ? 'Invite Created' : 'Create Individual Invite'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
          textColor={colors.text}
        />
      )}
      {showStartTimePicker && (
        <DateTimePicker
          value={startTime}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={handleStartTimeChange}
          textColor={colors.text}
        />
      )}
      {showEndTimePicker && (
        <DateTimePicker
          value={endTime}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={handleEndTimeChange}
          textColor={colors.text}
        />
      )}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        message={alertConfig.message}
        onClose={handleAlertClose}
      />
    </SafeAreaView>
  );
};

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

export default IndividualInviteScreen;
