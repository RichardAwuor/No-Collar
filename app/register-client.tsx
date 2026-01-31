
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Platform,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { useUser } from '@/contexts/UserContext';
import { COUNTIES, County } from '@/constants/counties';
import { IconSymbol } from '@/components/IconSymbol';

// Custom Modal for confirmations (cross-platform compatible)
function ConfirmModal({ 
  visible, 
  title, 
  message, 
  onConfirm, 
  onCancel 
}: { 
  visible: boolean; 
  title: string; 
  message: string; 
  onConfirm: () => void; 
  onCancel: () => void; 
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const primaryColor = isDark ? colors.primaryDark : colors.primary;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.confirmModalContent, { backgroundColor: bgColor }]}>
          <Text style={[styles.confirmModalTitle, { color: textColor }]}>{title}</Text>
          <Text style={[styles.confirmModalMessage, { color: textColor }]}>{message}</Text>
          <View style={styles.confirmModalButtons}>
            <TouchableOpacity
              style={[styles.confirmModalButton, styles.confirmModalButtonCancel]}
              onPress={onCancel}
            >
              <Text style={styles.confirmModalButtonTextCancel}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmModalButton, { backgroundColor: primaryColor }]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmModalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function RegisterClientScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { setUser } = useUser();

  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [organizationType, setOrganizationType] = useState<'individual' | 'organization'>('individual');
  const [organizationName, setOrganizationName] = useState('');
  const [selectedCounty, setSelectedCounty] = useState<County>(COUNTIES[46]); // Default to Nairobi
  const [loading, setLoading] = useState(false);
  const [showCountyModal, setShowCountyModal] = useState(false);
  const [countySearch, setCountySearch] = useState('');
  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });

  console.log('Client registration screen loaded');

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const primaryColor = isDark ? colors.primaryDark : colors.primary;
  const cardColor = isDark ? colors.cardDark : colors.card;
  const borderColor = isDark ? colors.borderDark : colors.border;
  const inputBg = isDark ? colors.cardDark : colors.card;

  // Check if emails match and both are filled
  const emailsMatch = email.length > 0 && confirmEmail.length > 0 && email === confirmEmail;
  const emailsDontMatch = confirmEmail.length > 0 && email !== confirmEmail;

  // Filter counties based on search
  const filteredCounties = COUNTIES.filter(county =>
    county.countyName.toLowerCase().includes(countySearch.toLowerCase())
  );

  const showError = (title: string, message: string) => {
    setErrorModal({ visible: true, title, message });
  };

  const handleRegister = async () => {
    console.log('Client registration initiated', { 
      email, 
      firstName, 
      lastName, 
      organizationType
    });

    if (!email || !confirmEmail || !firstName || !lastName) {
      showError('Error', 'Please fill in all required fields');
      return;
    }

    if (!email.includes('@')) {
      showError('Error', 'Please enter a valid email address');
      return;
    }

    if (email !== confirmEmail) {
      showError('Error', 'Email addresses do not match');
      return;
    }

    if (organizationType === 'organization' && !organizationName) {
      showError('Error', 'Please enter your organization name');
      return;
    }

    setLoading(true);

    try {
      const { apiCall } = await import('@/utils/api');
      
      const requestBody = {
        email,
        firstName,
        lastName,
        county: selectedCounty.countyCode,
        isOrganization: organizationType === 'organization',
        ...(organizationType === 'organization' && organizationName ? { organizationName } : {}),
      };

      console.log('Sending client registration request:', requestBody);

      const response = await apiCall('/api/users/register-client', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      console.log('Client registration response:', response);

      const registeredUser = {
        id: response.user.id,
        email: response.user.email,
        userType: response.user.userType as 'client',
        firstName: response.user.firstName,
        lastName: response.user.lastName,
        county: response.user.county,
        organizationName: organizationType === 'organization' ? organizationName : undefined,
      };

      setUser(registeredUser);
      console.log('Client registered successfully, navigating to post-gig', registeredUser);
      
      // Use setTimeout to ensure state is updated before navigation
      setTimeout(() => {
        setLoading(false);
        router.replace('/post-gig');
      }, 100);
    } catch (error) {
      console.error('Client registration error:', error);
      setLoading(false);
      
      let errorMessage = 'Failed to register. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
        
        if (errorMessage.includes('JSON') || errorMessage.includes('Unexpected character')) {
          errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
        }
      }
      
      showError('Registration Failed', errorMessage);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>Client Registration</Text>
          <Text style={[styles.subtitle, { color: textColor }]}>
            Create your account to post gigs
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.label, { color: textColor }]}>Email *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor }]}
            placeholder="Enter your email"
            placeholderTextColor={isDark ? '#888' : '#999'}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={[styles.label, { color: textColor }]}>Confirm Email *</Text>
          <View style={styles.inputWithIcon}>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: inputBg, 
                  color: textColor, 
                  borderColor: emailsDontMatch ? '#FF3B30' : borderColor,
                  flex: 1,
                }
              ]}
              placeholder="Re-enter your email"
              placeholderTextColor={isDark ? '#888' : '#999'}
              value={confirmEmail}
              onChangeText={setConfirmEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {emailsMatch && (
              <View style={styles.checkMarkContainer}>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={24}
                  color="#34C759"
                />
              </View>
            )}
          </View>
          {emailsDontMatch && (
            <Text style={styles.errorText}>Emails do not match</Text>
          )}

          <Text style={[styles.label, { color: textColor }]}>Account Type *</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => setOrganizationType('individual')}
            >
              <View style={[styles.radio, { borderColor }]}>
                {organizationType === 'individual' && (
                  <View style={[styles.radioInner, { backgroundColor: primaryColor }]} />
                )}
              </View>
              <Text style={[styles.radioLabel, { color: textColor }]}>Individual</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => setOrganizationType('organization')}
            >
              <View style={[styles.radio, { borderColor }]}>
                {organizationType === 'organization' && (
                  <View style={[styles.radioInner, { backgroundColor: primaryColor }]} />
                )}
              </View>
              <Text style={[styles.radioLabel, { color: textColor }]}>Organization</Text>
            </TouchableOpacity>
          </View>

          {organizationType === 'organization' && (
            <>
              <Text style={[styles.label, { color: textColor }]}>Organization Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor }]}
                placeholder="Enter organization name"
                placeholderTextColor={isDark ? '#888' : '#999'}
                value={organizationName}
                onChangeText={setOrganizationName}
                autoCapitalize="words"
              />
            </>
          )}

          <Text style={[styles.label, { color: textColor }]}>First Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor }]}
            placeholder="Enter your first name"
            placeholderTextColor={isDark ? '#888' : '#999'}
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
          />

          <Text style={[styles.label, { color: textColor }]}>Last Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor }]}
            placeholder="Enter your last name"
            placeholderTextColor={isDark ? '#888' : '#999'}
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
          />

          <Text style={[styles.label, { color: textColor }]}>County *</Text>
          <TouchableOpacity
            style={[styles.countyButton, { backgroundColor: inputBg, borderColor }]}
            onPress={() => {
              setShowCountyModal(true);
              console.log('County selection modal opened');
            }}
          >
            <View style={styles.countyButtonContent}>
              <Text style={[styles.countyButtonText, { color: textColor }]}>
                {selectedCounty.countyName}
              </Text>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={24}
                color={textColor}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: primaryColor }]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* County Selection Modal */}
      <Modal
        visible={showCountyModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCountyModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: bgColor }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Select County</Text>
            <TouchableOpacity
              onPress={() => {
                setShowCountyModal(false);
                setCountySearch('');
                console.log('County selection modal closed');
              }}
            >
              <IconSymbol
                ios_icon_name="xmark.circle.fill"
                android_material_icon_name="cancel"
                size={28}
                color={textColor}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <IconSymbol
              ios_icon_name="magnifyingglass"
              android_material_icon_name="search"
              size={20}
              color={isDark ? '#888' : '#999'}
            />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Search counties..."
              placeholderTextColor={isDark ? '#888' : '#999'}
              value={countySearch}
              onChangeText={setCountySearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <ScrollView style={styles.countyList}>
            {filteredCounties.map((county) => {
              const isSelected = selectedCounty.countyNumber === county.countyNumber;
              return (
                <TouchableOpacity
                  key={county.countyNumber}
                  style={[
                    styles.countyItem,
                    { borderBottomColor: borderColor },
                    isSelected && { backgroundColor: isDark ? 'rgba(0, 122, 255, 0.15)' : 'rgba(0, 122, 255, 0.1)' }
                  ]}
                  onPress={() => {
                    setSelectedCounty(county);
                    setShowCountyModal(false);
                    setCountySearch('');
                    console.log('County selected:', county.countyName, 'Code:', county.countyCode);
                  }}
                >
                  <View style={styles.countyItemContent}>
                    <Text style={[styles.countyItemName, { color: textColor }]}>
                      {county.countyName}
                    </Text>
                    {isSelected && (
                      <IconSymbol
                        ios_icon_name="checkmark.circle.fill"
                        android_material_icon_name="check-circle"
                        size={24}
                        color={primaryColor}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Error Modal */}
      <ConfirmModal
        visible={errorModal.visible}
        title={errorModal.title}
        message={errorModal.message}
        onConfirm={() => setErrorModal({ visible: false, title: '', message: '' })}
        onCancel={() => setErrorModal({ visible: false, title: '', message: '' })}
      />
    </SafeAreaView>
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
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: -8,
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  inputWithIcon: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkMarkContainer: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: -8,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 24,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  radioLabel: {
    fontSize: 16,
  },
  countyButton: {
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
  },
  countyButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 8,
  },
  countyList: {
    flex: 1,
  },
  countyItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  countyItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countyItemName: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmModalContent: {
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  confirmModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  confirmModalMessage: {
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 22,
  },
  confirmModalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  confirmModalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  confirmModalButtonCancel: {
    backgroundColor: '#E5E5E5',
  },
  confirmModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmModalButtonTextCancel: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
});
