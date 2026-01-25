
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { colors } from '@/styles/commonStyles';
import { useColorScheme } from 'react-native';

export default function SplashScreen() {
  const router = useRouter();
  const { user } = useUser();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    console.log('Splash screen loaded, checking user status');
    const timer = setTimeout(() => {
      if (user) {
        console.log('User found, navigating to tabs');
        router.replace('/(tabs)');
      } else {
        console.log('No user found, navigating to role selection');
        router.replace('/role-select');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [user]);

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const primaryColor = isDark ? colors.primaryDark : colors.primary;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.content}>
        <View style={[styles.logoContainer, { backgroundColor: primaryColor }]}>
          <Text style={styles.logoText}>NC</Text>
        </View>
        <Text style={[styles.title, { color: textColor }]}>NO-COLLAR</Text>
        <Text style={[styles.slogan, { color: primaryColor }]}>Kazi iko</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  slogan: {
    fontSize: 20,
    fontStyle: 'italic',
  },
});
