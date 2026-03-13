
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Platform,
  Image,
  ImageSourcePropType,
  Modal,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { useUser } from '@/contexts/UserContext';
import { SERVICE_CATEGORIES } from '@/constants/data';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { apiCall } from '@/utils/api';
import { IconSymbol } from '@/components/IconSymbol';

// Helper to resolve image sources (handles both local require() and remote URLs)
function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

// Custom Modal for errors (cross-platform compatible)
function ErrorModal({ visible, title, message, onClose }: { visible: boolean; title: string; message: string; onClose: () => void }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? colors.cardDark : colors.card;
  const textColor = isDark ? colors.textDark : colors.text;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.errorModalOverlay}>
        <View style={[styles.errorModalContent, { backgroundColor: bgColor }]}>
          <Text style={[styles.errorModalTitle, { color: colors.error }]}>{title}</Text>
          <Text style={[styles.errorModalMessage, { color: textColor }]}>{message}</Text>
          <TouchableOpacity
            style={[styles.errorModalButton, { backgroundColor: colors.primary }]}
            onPress={onClose}
          >
            <Text style={styles.errorModalButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Success Modal with navigation callback
function SuccessModal({ visible, title, message, onClose }: { visible: boolean; title: string; message: string; onClose: () => void }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? colors.cardDark : colors.card;
  const textColor = isDark ? colors.textDark : colors.text;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.errorModalOverlay}>
        <View style={[styles.errorModalContent, { backgroundColor: bgColor }]}>
          <Text style={[styles.errorModalTitle, { color: colors.success }]}>{title}</Text>
          <Text style={[styles.errorModalMessage, { color: textColor }]}>{message}</Text>
          <TouchableOpacity
            style={[styles.errorModalButton, { backgroundColor: colors.primary }]}
            onPress={onClose}
          >
            <Text style={styles.errorModalButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function PostGigScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useUser();
  const mountedRef = useRef(true);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [category, setCategory] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [serviceDate, setServiceDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [serviceTime, setServiceTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [durationDays, setDurationDays] = useState('0');
  const [durationHours, setDurationHours] = useState('1');
  const [paymentOffer, setPaymentOffer] = useState('');
  const [preferredGender, setPreferredGender] = useState<'any' | 'male' | 'female'>('any');
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });
  const [successModal, setSuccessModal] = useState({ visible: false, title: '', message: '' });

  console.log('Post gig screen loaded');

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Clear any pending navigation timeouts
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = null;
      }
    };
  }, []);

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const primaryColor = isDark ? colors.primaryDark : colors.primary;
  const borderColor = isDark ? colors.borderDark : colors.border;
  const inputBg = isDark ? colors.cardDark : colors.card;

  const formatDate = (date: Date): string => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const dateDisplay = formatDate(serviceDate);
  const timeDisplay = formatTime(serviceTime);

  const showError = (title: string, message: string) => {
    if (mountedRef.current) {
      setErrorModal({ visible: true, title, message });
    }
  };

  const showSuccess = (title: string, message: string) => {
    if (mountedRef.current) {
      setSuccessModal({ visible: true, title, message });
    }
  };

  const handleSuccessClose = () => {
    console.log('Success modal closing, preparing to navigate to profile');
    
    // First, close the modal
    if (mountedRef.current) {
      setSuccessModal({ visible: false, title: '', message: '' });
    }
    
    // Wait for modal animation to complete before navigating (Android fix)
    navigationTimeoutRef.current = setTimeout(() => {
      if (!mountedRef.current) {
        console.log('Component unmounted, skipping navigation');
        return;
      }
      
      try {
        console.log('Navigating to profile screen');
        router.replace('/(tabs)/profile');
      } catch (navError) {
        console.error('Navigation error after gig post:', navError);
        // If navigation fails, try going back as fallback
        try {
          router.back();
        } catch (backError) {
          console.error('Fallback navigation also failed:', backError);
        }
      }
    }, 300); // 300ms delay to ensure modal is fully closed
  };

  const handlePostGig = async () => {
    console.log('Post gig button pressed');
    console.log('Current state:', { 
      category, 
      address, 
      description, 
      paymentOffer, 
      durationDays, 
      durationHours,
      serviceDate: serviceDate.toISOString(),
      serviceTime: timeDisplay
    });

    try {
      // Validation
      if (!category) {
        console.log('Validation failed: No category');
        showError('Error', 'Please select a service category');
        return;
      }

      if (!address || address.length > 30) {
        console.log('Validation failed: Invalid address');
        showError('Error', 'Address must be between 1 and 30 characters');
        return;
      }

      if (!description || description.length > 160) {
        console.log('Validation failed: Invalid description');
        showError('Error', 'Description must be between 1 and 160 characters');
        return;
      }

      const payment = parseInt(paymentOffer, 10);
      if (isNaN(payment) || payment < 1) {
        console.log('Validation failed: Invalid payment');
        showError('Error', 'Please enter a valid payment amount');
        return;
      }

      const days = parseInt(durationDays, 10);
      const hours = parseInt(durationHours, 10);
      if (isNaN(days) || isNaN(hours) || (days === 0 && hours === 0)) {
        console.log('Validation failed: Invalid duration');
        showError('Error', 'Duration must be at least 1 hour');
        return;
      }

      if (!user?.id) {
        console.log('Validation failed: No user ID');
        showError('Error', 'User not found. Please log in again.');
        return;
      }

      console.log('All validations passed, starting API call');
      setLoading(true);

      const requestBody = {
        clientId: user.id,
        category,
        serviceDate: serviceDate.toISOString(),
        serviceTime: timeDisplay,
        address,
        description,
        durationDays: days,
        durationHours: hours,
        paymentOffer: payment,
        ...(preferredGender !== 'any' ? { preferredGender: preferredGender.charAt(0).toUpperCase() + preferredGender.slice(1) } : {}),
      };

      console.log('Sending post gig request:', JSON.stringify(requestBody, null, 2));

      const data = await apiCall<{ id: string }>('/api/gigs', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      console.log('Gig posted successfully:', data);
      
      // Update loading state before showing success
      if (mountedRef.current) {
        setLoading(false);
        
        // Show success message - navigation will happen when user closes the modal
        showSuccess('Success', 'Gig posted successfully! View it in your profile.');
      }
    } catch (error) {
      console.error('Error in handlePostGig:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      if (mountedRef.current) {
        setLoading(false);
        showError(
          'Error',
          error instanceof Error ? error.message : 'Failed to post gig. Please try again.'
        );
      }
    }
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const { type } = event;
    console.log(`DatePicker onChange event: type=${type}, date=${selectedDate}`);
    
    // Always close picker on Android after any interaction
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    // Only update date if user confirmed selection
    if (type === 'set' && selectedDate && mountedRef.current) {
      setServiceDate(selectedDate);
      console.log('Service date selected:', selectedDate);
      
      // On iOS, close picker after selection
      if (Platform.OS === 'ios') {
        setShowDatePicker(false);
      }
    } else if (type === 'dismissed') {
      console.log('Date picker dismissed without selection');
    }
  };

  const onTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    const { type } = event;
    console.log(`TimePicker onChange event: type=${type}, time=${selectedTime}`);
    
    // Always close picker on Android after any interaction
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    
    // Only update time if user confirmed selection
    if (type === 'set' && selectedTime && mountedRef.current) {
      setServiceTime(selectedTime);
      console.log('Service time selected:', selectedTime);
      
      // On iOS, close picker after selection
      if (Platform.OS === 'ios') {
        setShowTimePicker(false);
      }
    } else if (type === 'dismissed') {
      console.log('Time picker dismissed without selection');
    }
  };

  const categoryPlaceholder = category || 'Select service category';

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Post a Gig',
          headerShown: true,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoHeader}>
            <Image
              source={resolveImageSource(require('@/assets/images/5f49e934-ff57-4afc-8f25-a70466c61855.png'))}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={[styles.label, { color: textColor }]}>Service Category</Text>
          <TouchableOpacity
            style={[styles.input, styles.selectInput, { backgroundColor: inputBg, borderColor }]}
            onPress={() => {
              console.log('Opening category modal');
              setShowCategoryModal(true);
            }}
          >
            <Text style={[styles.selectText, { color: category ? textColor : (isDark ? '#888' : '#999') }]}>
              {categoryPlaceholder}
            </Text>
            <IconSymbol
              ios_icon_name="chevron.down"
              android_material_icon_name="arrow-drop-down"
              size={24}
              color={textColor}
            />
          </TouchableOpacity>

          {/* Category Selection Modal */}
          <Modal
            visible={showCategoryModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowCategoryModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: bgColor }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: textColor }]}>Select Service Category</Text>
                  <TouchableOpacity
                    onPress={() => setShowCategoryModal(false)}
                    style={styles.closeButton}
                  >
                    <IconSymbol
                      ios_icon_name="xmark"
                      android_material_icon_name="close"
                      size={24}
                      color={textColor}
                    />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalScroll}>
                  {SERVICE_CATEGORIES.map((cat, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.categoryOption,
                        { borderBottomColor: borderColor },
                        category === cat && { backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0' }
                      ]}
                      onPress={() => {
                        console.log('Category selected:', cat);
                        setCategory(cat);
                        setShowCategoryModal(false);
                      }}
                    >
                      <Text style={[styles.categoryText, { color: textColor }]}>
                        {cat}
                      </Text>
                      {category === cat && (
                        <IconSymbol
                          ios_icon_name="checkmark"
                          android_material_icon_name="check"
                          size={20}
                          color={primaryColor}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>

          <Text style={[styles.label, { color: textColor }]}>Service Date</Text>
          <TouchableOpacity
            style={[styles.input, styles.selectInput, { backgroundColor: inputBg, borderColor }]}
            onPress={() => {
              console.log('Opening date picker');
              setShowDatePicker(true);
            }}
          >
            <Text style={{ color: textColor }}>{dateDisplay}</Text>
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="calendar-today"
              size={20}
              color={textColor}
            />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={serviceDate}
              mode="date"
              display="default"
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}

          <Text style={[styles.label, { color: textColor }]}>Service Time</Text>
          <TouchableOpacity
            style={[styles.input, styles.selectInput, { backgroundColor: inputBg, borderColor }]}
            onPress={() => {
              console.log('Opening time picker');
              setShowTimePicker(true);
            }}
          >
            <Text style={{ color: textColor }}>{timeDisplay}</Text>
            <IconSymbol
              ios_icon_name="clock"
              android_material_icon_name="access-time"
              size={20}
              color={textColor}
            />
          </TouchableOpacity>

          {showTimePicker && (
            <DateTimePicker
              value={serviceTime}
              mode="time"
              display="default"
              onChange={onTimeChange}
            />
          )}

          <Text style={[styles.label, { color: textColor }]}>
            Address (max 30 characters)
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor }]}
            placeholder="Enter gig address"
            placeholderTextColor={isDark ? '#888' : '#999'}
            value={address}
            onChangeText={setAddress}
            maxLength={30}
          />

          <Text style={[styles.label, { color: textColor }]}>
            Description (max 160 characters)
          </Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: inputBg, color: textColor, borderColor }]}
            placeholder="Describe the work needed"
            placeholderTextColor={isDark ? '#888' : '#999'}
            value={description}
            onChangeText={setDescription}
            maxLength={160}
            multiline
            numberOfLines={4}
          />

          <View style={styles.durationRow}>
            <View style={styles.durationInput}>
              <Text style={[styles.label, { color: textColor }]}>Days</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor }]}
                placeholder="0"
                placeholderTextColor={isDark ? '#888' : '#999'}
                value={durationDays}
                onChangeText={setDurationDays}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.durationInput}>
              <Text style={[styles.label, { color: textColor }]}>Hours</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor }]}
                placeholder="1"
                placeholderTextColor={isDark ? '#888' : '#999'}
                value={durationHours}
                onChangeText={setDurationHours}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <Text style={[styles.label, { color: textColor }]}>Preferred Gender (Optional)</Text>
          <View style={styles.genderRow}>
            <TouchableOpacity
              style={[
                styles.genderButton,
                { backgroundColor: inputBg, borderColor },
                preferredGender === 'male' && { backgroundColor: primaryColor, borderColor: primaryColor }
              ]}
              onPress={() => {
                console.log('Gender selected: Male');
                setPreferredGender('male');
              }}
            >
              <Text style={[
                styles.genderButtonText,
                { color: textColor },
                preferredGender === 'male' && { color: '#FFFFFF' }
              ]}>
                Male
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.genderButton,
                { backgroundColor: inputBg, borderColor },
                preferredGender === 'female' && { backgroundColor: primaryColor, borderColor: primaryColor }
              ]}
              onPress={() => {
                console.log('Gender selected: Female');
                setPreferredGender('female');
              }}
            >
              <Text style={[
                styles.genderButtonText,
                { color: textColor },
                preferredGender === 'female' && { color: '#FFFFFF' }
              ]}>
                Female
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.genderButton,
                { backgroundColor: inputBg, borderColor },
                preferredGender === 'any' && { backgroundColor: primaryColor, borderColor: primaryColor }
              ]}
              onPress={() => {
                console.log('Gender selected: Any');
                setPreferredGender('any');
              }}
            >
              <Text style={[
                styles.genderButtonText,
                { color: textColor },
                preferredGender === 'any' && { color: '#FFFFFF' }
              ]}>
                Any
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: textColor }]}>Payment Offer (KES)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor }]}
            placeholder="Enter amount in KES"
            placeholderTextColor={isDark ? '#888' : '#999'}
            value={paymentOffer}
            onChangeText={setPaymentOffer}
            keyboardType="number-pad"
          />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: primaryColor }]}
            onPress={handlePostGig}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Posting...' : 'Post Gig'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      {/* Error Modal */}
      <ErrorModal
        visible={errorModal.visible}
        title={errorModal.title}
        message={errorModal.message}
        onClose={() => setErrorModal({ visible: false, title: '', message: '' })}
      />

      {/* Success Modal */}
      <SuccessModal
        visible={successModal.visible}
        title={successModal.title}
        message={successModal.message}
        onClose={handleSuccessClose}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 48 : 20,
    paddingBottom: 40,
    gap: 12,
  },
  logoHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  logo: {
    width: 120,
    height: 120,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectText: {
    fontSize: 16,
    flex: 1,
  },
  textArea: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  durationRow: {
    flexDirection: 'row',
    gap: 16,
  },
  durationInput: {
    flex: 1,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  genderButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    maxHeight: 500,
  },
  categoryOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  categoryText: {
    fontSize: 16,
    flex: 1,
  },
  errorModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorModalContent: {
    width: '85%',
    padding: 24,
    borderRadius: 12,
    gap: 16,
  },
  errorModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorModalMessage: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorModalButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
</write file>

Now I need to update the iOS version as well to maintain consistency:

<write file="app/(tabs)/index.ios.tsx">
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  TextInput,
  Platform,
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@/contexts/UserContext';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useRouter, Stack } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SERVICE_CATEGORIES } from '@/constants/data';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'http://localhost:8082';

// Helper to resolve image sources (handles both local require() and remote URLs)
function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

// Custom Modal for messages (cross-platform compatible)
function MessageModal({ visible, title, message, onClose, isError }: { visible: boolean; title: string; message: string; onClose: () => void; isError?: boolean }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? colors.cardDark : colors.card;
  const textColor = isDark ? colors.textDark : colors.text;
  const titleColor = isError ? colors.error : colors.success;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.messageModalOverlay}>
        <View style={[styles.messageModalContent, { backgroundColor: bgColor }]}>
          <Text style={[styles.messageModalTitle, { color: titleColor }]}>{title}</Text>
          <Text style={[styles.messageModalMessage, { color: textColor }]}>{message}</Text>
          <TouchableOpacity
            style={[styles.messageModalButton, { backgroundColor: colors.primary }]}
            onPress={onClose}
          >
            <Text style={styles.messageModalButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function HomeScreen() {
  const { user, provider } = useUser();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const textColor = isDark ? colors.textDark : colors.text;
  const textSecondaryColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardColor = isDark ? colors.cardDark : colors.card;
  const primaryColor = isDark ? colors.primaryDark : colors.primary;
  const borderColor = isDark ? colors.borderDark : colors.border;
  const inputBg = isDark ? colors.cardDark : colors.card;

  const isClient = user?.userType === 'client';
  const isProvider = user?.userType === 'provider';

  // Client state - Post a Gig
  const [category, setCategory] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [serviceDate, setServiceDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [serviceTime, setServiceTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [durationDays, setDurationDays] = useState('0');
  const [durationHours, setDurationHours] = useState('1');
  const [preferredGender, setPreferredGender] = useState<'any' | 'male' | 'female'>('any');
  const [paymentOffer, setPaymentOffer] = useState('');

  // Provider state - Available Gigs
  const [availableGigs, setAvailableGigs] = useState<any[]>([]);
  const [loadingGigs, setLoadingGigs] = useState(false);
  const [postingGig, setPostingGig] = useState(false);

  // Message modal state
  const [messageModal, setMessageModal] = useState({ visible: false, title: '', message: '', isError: false });

  console.log('Home screen loaded (iOS)');

  // Fetch available gigs for providers
  const fetchAvailableGigs = useCallback(async () => {
    if (!provider?.id) return;

    setLoadingGigs(true);
    try {
      console.log('Fetching available gigs for provider:', provider.id);
      const response = await fetch(`${BACKEND_URL}/api/gigs/matches/${provider.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch gigs: ${response.status}`);
      }

      const data = await response.json();
      console.log('Available gigs response:', data);
      setAvailableGigs(data);
    } catch (error) {
      console.error('Error fetching gigs:', error);
      setAvailableGigs([]);
    } finally {
      setLoadingGigs(false);
    }
  }, [provider?.id]);

  useEffect(() => {
    if (isProvider && provider?.id && provider?.subscriptionStatus === 'active') {
      fetchAvailableGigs();
    }
  }, [isProvider, provider?.id, provider?.subscriptionStatus, fetchAvailableGigs]);

  const formatDate = (date: Date): string => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const dateDisplay = formatDate(serviceDate);
  const timeDisplay = formatTime(serviceTime);
  const categoryPlaceholder = category || 'Select service category';

  const showMessage = (title: string, message: string, isError: boolean = false) => {
    setMessageModal({ visible: true, title, message, isError });
  };

  const handlePostGig = async () => {
    console.log('Post gig button pressed from home tab (iOS)');
    console.log('Current state:', { 
      category, 
      address, 
      description, 
      paymentOffer, 
      durationDays, 
      durationHours,
      serviceDate: serviceDate.toISOString(),
      serviceTime: timeDisplay,
      userId: user?.id
    });

    try {
      // Validation
      if (!category) {
        console.log('Validation failed: No category');
        showMessage('Error', 'Please select a service category', true);
        return;
      }

      if (!address || address.length > 30) {
        console.log('Validation failed: Invalid address');
        showMessage('Error', 'Address must be between 1 and 30 characters', true);
        return;
      }

      if (!description || description.length > 160) {
        console.log('Validation failed: Invalid description');
        showMessage('Error', 'Description must be between 1 and 160 characters', true);
        return;
      }

      const payment = parseInt(paymentOffer, 10);
      if (isNaN(payment) || payment < 1) {
        console.log('Validation failed: Invalid payment');
        showMessage('Error', 'Please enter a valid payment amount', true);
        return;
      }

      const days = parseInt(durationDays, 10);
      const hours = parseInt(durationHours, 10);
      if (isNaN(days) || isNaN(hours) || (days === 0 && hours === 0)) {
        console.log('Validation failed: Invalid duration');
        showMessage('Error', 'Duration must be at least 1 hour', true);
        return;
      }

      if (!user?.id) {
        console.log('Validation failed: No user ID');
        showMessage('Error', 'User not found. Please log in again.', true);
        return;
      }

      console.log('All validations passed, starting API call');
      setPostingGig(true);

      const requestBody = {
        clientId: user.id,
        category,
        serviceDate: serviceDate.toISOString(),
        serviceTime: timeDisplay,
        address,
        description,
        durationDays: days,
        durationHours: hours,
        paymentOffer: payment,
        ...(preferredGender !== 'any' ? { preferredGender: preferredGender.charAt(0).toUpperCase() + preferredGender.slice(1) } : {}),
      };

      console.log('Sending post gig request:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${BACKEND_URL}/api/gigs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Post gig failed:', response.status, errorText);
        throw new Error(`Failed to post gig: ${response.status}`);
      }

      const data = await response.json();
      console.log('Post gig response:', data);

      showMessage('Success', 'Gig posted successfully!', false);
      
      // Reset form
      setCategory('');
      setServiceDate(new Date());
      setServiceTime(new Date());
      setAddress('');
      setDescription('');
      setDurationDays('0');
      setDurationHours('1');
      setPreferredGender('any');
      setPaymentOffer('');
    } catch (error) {
      console.error('Error in handlePostGig:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      showMessage('Error', error instanceof Error ? error.message : 'Failed to post gig. Please try again.', true);
    } finally {
      setPostingGig(false);
    }
  };

  const handleAcceptGig = async (gigId: string) => {
    console.log('Accepting gig', gigId);

    if (!provider?.id) {
      showMessage('Error', 'Provider not found. Please log in again.', true);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/gigs/${gigId}/accept`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ providerId: provider.id }),
      });

      if (!response.ok) {
        throw new Error(`Failed to accept gig: ${response.status}`);
      }

      const data = await response.json();
      console.log('Accept gig response:', data);

      showMessage('Success', 'Gig accepted successfully!', false);
      
      // Refresh available gigs
      fetchAvailableGigs();
    } catch (error) {
      console.error('Error accepting gig:', error);
      showMessage('Error', error instanceof Error ? error.message : 'Failed to accept gig. Please try again.', true);
    }
  };

  if (isClient) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Post a Gig',
            headerShown: true,
          }}
        />
        <SafeAreaView style={[styles.container, { backgroundColor: '#FFFFFF' }]} edges={['top']}>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <View style={styles.logoHeader}>
              <Image
                source={resolveImageSource(require('@/assets/images/5f49e934-ff57-4afc-8f25-a70466c61855.png'))}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <View style={styles.form}>
              <Text style={[styles.label, { color: textColor }]}>Service Category</Text>
              <TouchableOpacity
                style={[styles.input, styles.selectInput, { backgroundColor: inputBg, borderColor }]}
                onPress={() => {
                  console.log('Opening category modal');
                  setShowCategoryModal(true);
                }}
              >
                <Text style={[styles.selectText, { color: category ? textColor : (isDark ? '#888' : '#999') }]}>
                  {categoryPlaceholder}
                </Text>
                <IconSymbol
                  ios_icon_name="chevron.down"
                  android_material_icon_name="arrow-drop-down"
                  size={24}
                  color={textColor}
                />
              </TouchableOpacity>

              {/* Category Selection Modal */}
              <Modal
                visible={showCategoryModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCategoryModal(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={[styles.modalContent, { backgroundColor: '#FFFFFF' }]}>
                    <View style={styles.modalHeader}>
                      <Text style={[styles.modalTitle, { color: textColor }]}>Select Service Category</Text>
                      <TouchableOpacity
                        onPress={() => setShowCategoryModal(false)}
                        style={styles.closeButton}
                      >
                        <IconSymbol
                          ios_icon_name="xmark"
                          android_material_icon_name="close"
                          size={24}
                          color={textColor}
                        />
                      </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.modalScroll}>
                      {SERVICE_CATEGORIES.map((cat, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.categoryOption,
                            { borderBottomColor: borderColor },
                            category === cat && { backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0' }
                          ]}
                          onPress={() => {
                            console.log('Category selected:', cat);
                            setCategory(cat);
                            setShowCategoryModal(false);
                          }}
                        >
                          <Text style={[styles.categoryText, { color: textColor }]}>
                            {cat}
                          </Text>
                          {category === cat && (
                            <IconSymbol
                              ios_icon_name="checkmark"
                              android_material_icon_name="check"
                              size={20}
                              color={primaryColor}
                            />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </Modal>

              <Text style={[styles.label, { color: textColor }]}>Service Date</Text>
              <TouchableOpacity
                style={[styles.input, styles.selectInput, { backgroundColor: inputBg, borderColor }]}
                onPress={() => {
                  console.log('Opening date picker');
                  setShowDatePicker(true);
                }}
              >
                <Text style={{ color: textColor }}>{dateDisplay}</Text>
                <IconSymbol
                  ios_icon_name="calendar"
                  android_material_icon_name="calendar-today"
                  size={20}
                  color={textColor}
                />
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={serviceDate}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    console.log('DatePicker onChange event:', event.type, selectedDate);
                    if (Platform.OS === 'android') {
                      setShowDatePicker(false);
                    }
                    if (event.type === 'set' && selectedDate) {
                      setServiceDate(selectedDate);
                      console.log('Service date selected:', selectedDate);
                      if (Platform.OS === 'ios') {
                        setShowDatePicker(false);
                      }
                    } else if (event.type === 'dismissed') {
                      console.log('Date picker dismissed');
                    }
                  }}
                  minimumDate={new Date()}
                />
              )}

              <Text style={[styles.label, { color: textColor }]}>Service Time</Text>
              <TouchableOpacity
                style={[styles.input, styles.selectInput, { backgroundColor: inputBg, borderColor }]}
                onPress={() => {
                  console.log('Opening time picker');
                  setShowTimePicker(true);
                }}
              >
                <Text style={{ color: textColor }}>{timeDisplay}</Text>
                <IconSymbol
                  ios_icon_name="clock"
                  android_material_icon_name="access-time"
                  size={20}
                  color={textColor}
                />
              </TouchableOpacity>

              {showTimePicker && (
                <DateTimePicker
                  value={serviceTime}
                  mode="time"
                  display="default"
                  onChange={(event, selectedTime) => {
                    console.log('TimePicker onChange event:', event.type, selectedTime);
                    if (Platform.OS === 'android') {
                      setShowTimePicker(false);
                    }
                    if (event.type === 'set' && selectedTime) {
                      setServiceTime(selectedTime);
                      console.log('Service time selected:', selectedTime);
                      if (Platform.OS === 'ios') {
                        setShowTimePicker(false);
                      }
                    } else if (event.type === 'dismissed') {
                      console.log('Time picker dismissed');
                    }
                  }}
                />
              )}

              <Text style={[styles.label, { color: textColor }]}>
                Address (max 30 characters)
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor }]}
                placeholder="Enter gig address"
                placeholderTextColor={isDark ? '#888' : '#999'}
                value={address}
                onChangeText={setAddress}
                maxLength={30}
              />

              <Text style={[styles.label, { color: textColor }]}>
                Description (max 160 characters)
              </Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: inputBg, color: textColor, borderColor }]}
                placeholder="Describe the work needed"
                placeholderTextColor={isDark ? '#888' : '#999'}
                value={description}
                onChangeText={setDescription}
                maxLength={160}
                multiline
                numberOfLines={4}
              />

              <View style={styles.durationRow}>
                <View style={styles.durationInput}>
                  <Text style={[styles.label, { color: textColor }]}>Days</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor }]}
                    placeholder="0"
                    placeholderTextColor={isDark ? '#888' : '#999'}
                    value={durationDays}
                    onChangeText={setDurationDays}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.durationInput}>
                  <Text style={[styles.label, { color: textColor }]}>Hours</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor }]}
                    placeholder="1"
                    placeholderTextColor={isDark ? '#888' : '#999'}
                    value={durationHours}
                    onChangeText={setDurationHours}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <Text style={[styles.label, { color: textColor }]}>Preferred Gender (Optional)</Text>
              <View style={styles.genderRow}>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    { backgroundColor: inputBg, borderColor },
                    preferredGender === 'male' && { backgroundColor: primaryColor, borderColor: primaryColor }
                  ]}
                  onPress={() => {
                    console.log('Gender selected: Male');
                    setPreferredGender('male');
                  }}
                >
                  <Text style={[
                    styles.genderButtonText,
                    { color: textColor },
                    preferredGender === 'male' && { color: '#FFFFFF' }
                  ]}>
                    Male
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    { backgroundColor: inputBg, borderColor },
                    preferredGender === 'female' && { backgroundColor: primaryColor, borderColor: primaryColor }
                  ]}
                  onPress={() => {
                    console.log('Gender selected: Female');
                    setPreferredGender('female');
                  }}
                >
                  <Text style={[
                    styles.genderButtonText,
                    { color: textColor },
                    preferredGender === 'female' && { color: '#FFFFFF' }
                  ]}>
                    Female
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    { backgroundColor: inputBg, borderColor },
                    preferredGender === 'any' && { backgroundColor: primaryColor, borderColor: primaryColor }
                  ]}
                  onPress={() => {
                    console.log('Gender selected: Any');
                    setPreferredGender('any');
                  }}
                >
                  <Text style={[
                    styles.genderButtonText,
                    { color: textColor },
                    preferredGender === 'any' && { color: '#FFFFFF' }
                  ]}>
                    Any
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, { color: textColor }]}>Payment Offer (KES)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor }]}
                placeholder="Enter amount in KES"
                placeholderTextColor={isDark ? '#888' : '#999'}
                value={paymentOffer}
                onChangeText={setPaymentOffer}
                keyboardType="number-pad"
              />

              <TouchableOpacity
                style={[styles.button, { backgroundColor: primaryColor }]}
                onPress={handlePostGig}
                disabled={postingGig}
              >
                {postingGig ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Post Gig</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Message Modal */}
          <MessageModal
            visible={messageModal.visible}
            title={messageModal.title}
            message={messageModal.message}
            isError={messageModal.isError}
            onClose={() => setMessageModal({ visible: false, title: '', message: '', isError: false })}
          />
        </SafeAreaView>
      </>
    );
  }

  if (isProvider) {
    const needsSubscription = provider?.subscriptionStatus === 'expired';

    if (needsSubscription) {
      return (
        <>
          <Stack.Screen
            options={{
              title: 'Take a Gig',
              headerShown: true,
            }}
          />
          <SafeAreaView style={[styles.container, { backgroundColor: '#FFFFFF' }]} edges={['top']}>
            <View style={styles.centerContent}>
              <IconSymbol
                ios_icon_name="exclamationmark.circle.fill"
                android_material_icon_name="error"
                size={64}
                color={colors.warning}
              />
              <Text style={[styles.title, { color: textColor, textAlign: 'center', marginTop: 16 }]}>
                Subscription Required
              </Text>
              <Text style={[styles.subtitle, { color: textSecondaryColor, textAlign: 'center', marginTop: 8 }]}>
                Subscribe for KES 130/month to access gigs
              </Text>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: primaryColor, marginTop: 24 }]}
                onPress={() => router.push('/subscription-payment')}
              >
                <Text style={styles.buttonText}>Subscribe Now</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </>
      );
    }

    return (
      <>
        <Stack.Screen
          options={{
            title: 'Take a Gig',
            headerShown: true,
          }}
        />
        <SafeAreaView style={[styles.container, { backgroundColor: '#FFFFFF' }]} edges={['top']}>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <View style={styles.logoHeader}>
              <Image
                source={resolveImageSource(require('@/assets/images/5f49e934-ff57-4afc-8f25-a70466c61855.png'))}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <View style={styles.header}>
              <Text style={[styles.title, { color: textColor }]}>Available Gigs</Text>
              <Text style={[styles.subtitle, { color: textSecondaryColor }]}>
                Gigs matching your profile
              </Text>
            </View>

            {loadingGigs ? (
              <View style={[styles.card, { backgroundColor: cardColor }]}>
                <ActivityIndicator size="large" color={primaryColor} />
                <Text style={[styles.emptyText, { color: textSecondaryColor, marginTop: 16 }]}>
                  Loading available gigs...
                </Text>
              </View>
            ) : availableGigs.length === 0 ? (
              <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.emptyText, { color: textSecondaryColor }]}>
                  No gigs available at the moment. Check back soon!
                </Text>
              </View>
            ) : (
              <React.Fragment>
                {availableGigs.map((gig) => {
                  const gigDate = new Date(gig.serviceDate);
                  const formattedDate = gigDate.toLocaleDateString();
                  const duration = `${gig.durationDays}d ${gig.durationHours}h`;
                  
                  return (
                    <View key={gig.id} style={[styles.card, { backgroundColor: cardColor }]}>
                      <Text style={[styles.gigCategory, { color: primaryColor }]}>{gig.category}</Text>
                      <Text style={[styles.gigDescription, { color: textColor }]}>{gig.description}</Text>
                      <View style={styles.gigDetails}>
                        <Text style={[styles.gigDetailText, { color: textSecondaryColor }]}>
                          📍 {gig.address}
                        </Text>
                        <Text style={[styles.gigDetailText, { color: textSecondaryColor }]}>
                          📅 {formattedDate}
                        </Text>
                      </View>
                      <View style={styles.gigDetails}>
                        <Text style={[styles.gigDetailText, { color: textSecondaryColor }]}>
                          ⏱️ {duration}
                        </Text>
                        <Text style={[styles.gigDetailText, { color: textSecondaryColor }]}>
                          🕐 {gig.serviceTime}
                        </Text>
                      </View>
                      <Text style={[styles.gigPayment, { color: colors.success }]}>
                        KES {gig.paymentOffer.toLocaleString()}
                      </Text>
                      <TouchableOpacity
                        style={[styles.button, { backgroundColor: primaryColor, marginTop: 12 }]}
                        onPress={() => handleAcceptGig(gig.id)}
                      >
                        <Text style={styles.buttonText}>Accept Gig</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </React.Fragment>
            )}
          </ScrollView>

          {/* Message Modal */}
          <MessageModal
            visible={messageModal.visible}
            title={messageModal.title}
            message={messageModal.message}
            isError={messageModal.isError}
            onClose={() => setMessageModal({ visible: false, title: '', message: '', isError: false })}
          />
        </SafeAreaView>
      </>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 48 : 20,
    paddingBottom: 120,
    gap: 12,
  },
  logoHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  logo: {
    width: 120,
    height: 120,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  form: {
    gap: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectText: {
    fontSize: 16,
    flex: 1,
  },
  textArea: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  durationRow: {
    flexDirection: 'row',
    gap: 16,
  },
  durationInput: {
    flex: 1,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  genderButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
  },
  gigCategory: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  gigDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  gigDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  gigDetailText: {
    fontSize: 12,
  },
  gigPayment: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    maxHeight: 500,
  },
  categoryOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  categoryText: {
    fontSize: 16,
    flex: 1,
  },
  messageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageModalContent: {
    width: '85%',
    padding: 24,
    borderRadius: 12,
    gap: 16,
  },
  messageModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  messageModalMessage: {
    fontSize: 16,
    textAlign: 'center',
  },
  messageModalButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  messageModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
