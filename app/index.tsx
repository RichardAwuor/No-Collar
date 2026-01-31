
import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import * as SplashScreen from 'expo-splash-screen';

// Keep the native splash screen visible while we check user status
SplashScreen.preventAutoHideAsync();

export default function Index() {
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    console.log('App loaded, checking user status');
    
    // Navigate immediately without delay
    const navigate = async () => {
      try {
        if (user) {
          console.log('User found, navigating to tabs');
          router.replace('/(tabs)');
        } else {
          console.log('No user found, navigating to role selection');
          router.replace('/role-select');
        }
      } finally {
        // Hide the native splash screen after navigation
        await SplashScreen.hideAsync();
      }
    };

    navigate();
  }, [user, router]);

  // Return null - the native splash screen is showing
  return null;
}
