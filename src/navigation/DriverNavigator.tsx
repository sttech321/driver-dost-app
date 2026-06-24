import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DriverStackParamList } from './types';
import { DriverTabs } from './DriverTabs';
import { ChatScreen } from '@/screens/booking/ChatScreen';

const Stack = createNativeStackNavigator<DriverStackParamList>();

export function DriverNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DriverTabs" component={DriverTabs} />
      <Stack.Screen name="Chat" component={ChatScreen as any} />
    </Stack.Navigator>
  );
}
