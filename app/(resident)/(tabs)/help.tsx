import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ViewStyle, TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { darkColors, lightColors } from '../../../constants/ThemeColors';
import CustomAlert from '../../../components/CustomAlert';

interface FAQProps {
  question: string;
  answer: string;
  colors: typeof lightColors | typeof darkColors;
}

const FAQ: React.FC<FAQProps> = ({ question, answer, colors }) => (
  <View style={{ backgroundColor: colors.surface, marginBottom: 16, borderRadius: 8, padding: 16 }}>
    <Text style={{ fontWeight: '600', fontSize: 18, marginBottom: 8, color: colors.text }}>{question}</Text>
    <Text style={{ color: colors.textSecondary }}>{answer}</Text>
  </View>
);

interface AlertConfig {
  visible: boolean;
  type: 'success' | 'error' | 'info' | '';
  message: string;
}


const HelpPage: React.FC = () => {
  const [feedback, setFeedback] = useState<string>('');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? darkColors : lightColors;
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({ visible: false, type: '', message: '' });

  const handleSendFeedback = () => {
    if (feedback.trim() === '') {
      setAlertConfig({
        visible: true,
        type: 'error',
        message: 'Please enter your feedback before sending.'
      });
    } else {
      setAlertConfig({
        visible: true,
        type: 'success',
        message: 'Your feedback has been sent successfully!'
      });
      setFeedback('');
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const renderSection = (title: string, content: JSX.Element) => (
    <View style={{ marginBottom: 24 }}>
      <TouchableOpacity
        style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          backgroundColor: colors.primary, 
          padding: 16, 
          borderRadius: 8 
        }}
        onPress={() => toggleSection(title)}
      >
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.surface }}>{title}</Text>
        <Ionicons
          name={expandedSection === title ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={colors.surface}
        />
      </TouchableOpacity>
      {expandedSection === title && (
        <View style={{ marginTop: 8, backgroundColor: colors.surface, borderRadius: 8, padding: 16 }}>
          {content}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={{ padding: 24 }}>
        <Text style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 24, textAlign: 'center', color: colors.text }}>Help & Support</Text>
        
        {renderSection('Frequently Asked Questions', (
          <>
            <FAQ
              question="How do I create an invite?"
              answer="Go to the 'Create Invite' section from the home screen and fill in the required details."
              colors={colors}
            />
            <FAQ
              question="How can I view my visitor logs?"
              answer="Navigate to the 'Visitor Log' section from the home screen to view all your visitor logs."
              colors={colors}
            />
            <FAQ
              question="How do I edit my profile?"
              answer="Go to the 'Profile' section, click on 'Edit Profile', make your changes, and save them."
              colors={colors}
            />
          </>
        ))}

        {renderSection('Contact Us', (
          <>
            <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>If you have any questions or need further assistance, feel free to contact us:</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="mail-outline" size={20} color={colors.primary} />
              <Text style={{ color: colors.text, marginLeft: 8 }}>support@yourapp.com</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="call-outline" size={20} color={colors.primary} />
              <Text style={{ color: colors.text, marginLeft: 8 }}>+1 234 567 890</Text>
            </View>
          </>
        ))}

        {renderSection('Send Us Your Feedback', (
          <>
            <TextInput
              style={{ 
                borderWidth: 1, 
                borderColor: colors.border, 
                borderRadius: 8, 
                padding: 12, 
                marginBottom: 12, 
                backgroundColor: colors.surface,
                color: colors.text
              }}
              multiline
              numberOfLines={4}
              placeholder="Enter your feedback here..."
              placeholderTextColor={colors.textSecondary}
              value={feedback}
              onChangeText={setFeedback}
            />
            <TouchableOpacity
              onPress={handleSendFeedback}
              style={{
                backgroundColor: colors.success,
                padding: 12,
                borderRadius: 8,
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <Text style={{ color: colors.surface, fontSize: 18, fontWeight: '600' }}>Send Feedback</Text>
            </TouchableOpacity>
          </>
        ))}
      </ScrollView>
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        message={alertConfig.message}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </SafeAreaView>
  );
}
export default HelpPage;