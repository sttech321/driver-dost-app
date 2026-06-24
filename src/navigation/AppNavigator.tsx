import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppStackParamList } from './types';
import { useAuth } from '@/context/AuthContext';
import { AppTabs } from './AppTabs';
import { LocationPermissionScreen } from '@/screens/LocationPermissionScreen';
import { OneWayScreen } from '@/screens/booking/OneWayScreen';
import { HourlyScreen } from '@/screens/booking/HourlyScreen';
import { OutstationScreen } from '@/screens/booking/OutstationScreen';
import { DriverArrivingScreen } from '@/screens/booking/DriverArrivingScreen';
import { ChatScreen } from '@/screens/booking/ChatScreen';
import { DriverLeavingScreen } from '@/screens/booking/DriverLeavingScreen';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppNavigator() {
  const { locationGranted } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!locationGranted ? (
        // Gate: shown only until permission is granted. Once granted, this
        // screen is removed and the navigator auto-shows the app (Tabs).
        <Stack.Screen name="LocationPermission" component={LocationPermissionScreen} />
      ) : (
        <>
          <Stack.Screen name="Tabs" component={AppTabs} />
          <Stack.Screen name="OneWay" component={OneWayScreen} />
          <Stack.Screen name="Hourly" component={HourlyScreen} />
          <Stack.Screen name="Outstation" component={OutstationScreen} />
          <Stack.Screen name="DriverArriving" component={DriverArrivingScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="DriverLeaving" component={DriverLeavingScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
