
import React from 'react';
import { useUser } from '@/contexts/UserContext';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  const { user } = useUser();

  const isClient = user?.userType === 'client';

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Label>{isClient ? 'Home' : 'Gigs'}</Label>
        <Icon sf={{ default: isClient ? 'house' : 'briefcase', selected: isClient ? 'house.fill' : 'briefcase.fill' }} drawable={isClient ? 'home' : 'work'} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Label>Profile</Label>
        <Icon sf={{ default: 'person', selected: 'person.fill' }} drawable="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
