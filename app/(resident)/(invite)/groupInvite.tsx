import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { useGlobalContext } from '../../../context/GlobalProvider';
import { createGroupInvite } from '../../../lib/invite';
import { darkColors, lightColors } from '../../../constants/ThemeColors';
import { useTheme } from '../../../context/ThemeContext';
import CustomAlert from '../../../components/CustomAlert';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';


interface GroupInviteResponse {
  otp: string;
  // other properties...
}

const GroupInvite: React.FC = () => {
  const { user, fetchAndSetInvites } = useGlobalContext();
  const router = useRouter();
  const [groupName, setGroupName] = useState<string>('');
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? darkColors : lightColors;
  const [alertConfig, setAlertConfig] = useState<{ visible: boolean; type: 'success' | 'error'| ''; message: string }>({
    visible: false,
    type: '',
    message: '',
  });
  const [createdInvite, setCreatedInvite] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [isInviteCreated, setIsInviteCreated] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<Date>(moment().add(1, 'minute').toDate());
  const [endTime, setEndTime] = useState<Date>(moment().add(1, 'hour').toDate());
  const [showStartTimePicker, setShowStartTimePicker] = useState<boolean>(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState<boolean>(false);

  const nigerianStartTime = moment(startTime).utcOffset('+0100').format('YYYY-MM-DD HH:mm:ss');
  const nigerianEndTime = moment(endTime).utcOffset('+0100').format('YYYY-MM-DD HH:mm:ss');
  const nigerianTime = moment().utcOffset('+0100').format('YYYY-MM-DD HH:mm:ss');

  const handleDateChange = (event: any, selected: Date | undefined) => {
    const currentDate = selected || selectedDate;
    setShowDatePicker(false);
    if (currentDate >= new Date()) {
      setSelectedDate(currentDate);
    }
  };

  const handleStartTimeChange = (event: any, selected: Date | undefined) => {
    setShowStartTimePicker(false);
    if (selected) {
      setStartTime(selected);
      // Set end time to 1 hour after the start time
      setEndTime(new Date(selected.getTime() + 60 * 60 * 1000));
    }
  };

  const handleEndTimeChange = (event: any, selected: Date | undefined) => {
    setShowEndTimePicker(false);
    if (selected && selected > startTime) {
      setEndTime(selected);
    }
  };

  const handleCreateInvite = async () => {
    // Validation for user
    if (!user) {
      setAlertConfig({ visible: true, type: 'error', message: 'User not logged in' });
      return;
    }

    // Validation for group name
    if (groupName.trim() === '') {
      setAlertConfig({ visible: true, type: 'error', message: 'Please enter a valid group name.' });
      return;
    }

    // Validate that start time is before end time
    if (startTime >= endTime) {
      setAlertConfig({ visible: true, type: 'error', message: 'Start time must be before end time.' });
      return;
    }

    //Validate that date is not in the past
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
      const date = nigerianTime;
      const formattedStartTime = nigerianStartTime;
      const formattedEndTime = nigerianEndTime;

      const groupInvite = await createGroupInvite(
        user.username,
        user.address,
        user.estate_id,
        user.id,
        date,
        formattedStartTime,
        formattedEndTime,
        groupName
      );
      fetchAndSetInvites(user.address, true);

      
      // if (!groupInvite?.otp) {
      //   throw new Error('Invalid group invite data');
      // }

      setCreatedInvite(groupInvite);
      setAlertConfig({ visible: true, type: 'success', message: 'Group invite created successfully' });
      setIsInviteCreated(true);
    } catch (error) {
      setAlertConfig({ visible: true, type: 'error', message: 'Failed to create invite. Please try again.' });
      console.error('Error creating invite:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAlertClose = () => {
    setAlertConfig({ ...alertConfig, visible: false });
    if (alertConfig.type === 'success' && createdInvite) {
      router.push({
        pathname: 'groupInviteDetails',
        params: { invite: JSON.stringify(createdInvite), groupName },
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
          <Text style={[styles.title, { color: colors.text }]}>Create Group Invite</Text>
        </View>
        <View style={styles.content}>
          <View style={styles.form}>
            <TextInput
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Group Name"
              placeholderTextColor={colors.textSecondary}
            />
            <View style={styles.dateContainer}>
              <TouchableOpacity
                style={[
                  styles.dateButton,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  selectedDate && { backgroundColor: colors.primary }
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
              (isSubmitting || !groupName || isInviteCreated) && styles.disabledButton
            ]}
            onPress={handleCreateInvite}
            disabled={isSubmitting || !groupName || isInviteCreated}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.surface }]}>
                {isInviteCreated ? 'Invite Created' : 'Create Group Invite'}
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
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  form: {
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  dateContainer: {
    marginBottom: 16,
  },
  dateButton: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 16,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  timeButton: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: '48%', // Adjust width to fit two buttons
  },
  timeButtonText: {
    fontSize: 16,
  },
  createButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default GroupInvite;
