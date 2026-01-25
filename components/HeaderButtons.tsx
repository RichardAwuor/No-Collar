
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useUser } from '@/contexts/UserContext';

export function HeaderRightButton() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useUser();

  const handlePress = () => {
    console.log('Header right button pressed');
    if (user?.userType === 'client') {
      console.log('Navigating to post gig screen');
      router.push('/post-gig');
    }
  };

  // Only show for clients
  if (user?.userType !== 'client') {
    return null;
  }

  return (
    <Pressable
      onPress={handlePress}
      style={styles.headerButtonContainer}
    >
      <IconSymbol
        ios_icon_name="plus"
        android_material_icon_name="add"
        color={theme.colors.primary}
      />
    </Pressable>
  );
}

export function HeaderLeftButton() {
  const theme = useTheme();
  const router = useRouter();

  const handlePress = () => {
    console.log('Header left button pressed - navigating to profile');
    router.push('/(tabs)/profile');
  };

  return (
    <Pressable
      onPress={handlePress}
      style={styles.headerButtonContainer}
    >
      <IconSymbol
        ios_icon_name="gear"
        android_material_icon_name="settings"
        color={theme.colors.primary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerButtonContainer: {
    padding: 6,
  },
});
