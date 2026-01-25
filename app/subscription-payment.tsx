
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { useUser } from '@/contexts/UserContext';
import { IconSymbol } from '@/components/IconSymbol';

export default function SubscriptionPaymentScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user, provider, setProvider } = useUser();

  const [loading, setLoading] = useState(false);

  console.log('Subscription payment screen loaded');

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const primaryColor = isDark ? colors.primaryDark : colors.primary;
  const cardColor = isDark ? colors.cardDark : colors.card;
  const accentColor = isDark ? colors.accentDark : colors.accent;

  const handlePayment = async () => {
    console.log('Initiating M-Pesa payment for provider:', provider?.id);

    if (!provider || !user) {
      Alert.alert('Error', 'User information not found');
      return;
    }

    setLoading(true);

    // TODO: Backend Integration - POST /api/subscription/initiate
    // Body: { providerId, phoneNumber }
    // Returns: { transactionId, message, ussdPrompt: 'Pay NO-COLLAR Kes 130' }
    
    // Mock payment for now
    setTimeout(() => {
      setLoading(false);
      
      Alert.alert(
        'Payment Initiated',
        'Please check your phone for the M-Pesa prompt to complete payment of KES 130',
        [
          {
            text: 'OK',
            onPress: () => {
              // Mock successful payment
              if (provider) {
                setProvider({
                  ...provider,
                  subscriptionStatus: 'active',
                });
              }
              console.log('Payment completed, navigating to home');
              router.replace('/(tabs)');
            },
          },
        ]
      );
    }, 1500);
  };

  const handleSkip = () => {
    console.log('User skipped payment');
    Alert.alert(
      'Skip Payment',
      'You need an active subscription to view and accept gigs. You can subscribe later from your profile.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Skip Anyway',
          onPress: () => {
            router.replace('/(tabs)');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: accentColor }]}>
          <IconSymbol
            ios_icon_name="creditcard"
            android_material_icon_name="payment"
            size={64}
            color="#FFFFFF"
          />
        </View>

        <Text style={[styles.title, { color: textColor }]}>Subscription Required</Text>
        
        <Text style={[styles.description, { color: textColor }]}>
          To access gigs and start earning, you need an active subscription.
        </Text>

        <View style={[styles.priceCard, { backgroundColor: cardColor }]}>
          <Text style={[styles.priceLabel, { color: textColor }]}>Monthly Subscription</Text>
          <Text style={[styles.price, { color: primaryColor }]}>KES 130</Text>
          <Text style={[styles.priceNote, { color: textColor }]}>
            Renews automatically every 30 days
          </Text>
        </View>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <IconSymbol
              ios_icon_name="checkmark.circle"
              android_material_icon_name="check-circle"
              size={24}
              color={primaryColor}
            />
            <Text style={[styles.featureText, { color: textColor }]}>
              Access to all available gigs
            </Text>
          </View>

          <View style={styles.featureItem}>
            <IconSymbol
              ios_icon_name="checkmark.circle"
              android_material_icon_name="check-circle"
              size={24}
              color={primaryColor}
            />
            <Text style={[styles.featureText, { color: textColor }]}>
              Accept unlimited gigs
            </Text>
          </View>

          <View style={styles.featureItem}>
            <IconSymbol
              ios_icon_name="checkmark.circle"
              android_material_icon_name="check-circle"
              size={24}
              color={primaryColor}
            />
            <Text style={[styles.featureText, { color: textColor }]}>
              Build your reputation with reviews
            </Text>
          </View>

          <View style={styles.featureItem}>
            <IconSymbol
              ios_icon_name="checkmark.circle"
              android_material_icon_name="check-circle"
              size={24}
              color={primaryColor}
            />
            <Text style={[styles.featureText, { color: textColor }]}>
              Direct client communication
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: primaryColor }]}
          onPress={handlePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Pay with M-Pesa</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={[styles.skipText, { color: textColor }]}>Skip for now</Text>
        </TouchableOpacity>

        <Text style={[styles.merchantInfo, { color: textColor }]}>
          Merchant: NO-COLLAR (6803513)
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.8,
  },
  priceCard: {
    width: '100%',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  priceLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  price: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  priceNote: {
    fontSize: 14,
    opacity: 0.7,
  },
  features: {
    width: '100%',
    gap: 16,
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    flex: 1,
  },
  button: {
    width: '100%',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    padding: 12,
    marginBottom: 24,
  },
  skipText: {
    fontSize: 16,
    opacity: 0.7,
  },
  merchantInfo: {
    fontSize: 12,
    opacity: 0.5,
  },
});
