import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DriverTabParamList } from './types';
import { Icon, IconName } from '@/components';
import { colors, typography } from '@/theme';
import { DriverRequestsScreen } from '@/screens/driver/DriverRequestsScreen';
import { DriverTripsScreen } from '@/screens/driver/DriverTripsScreen';
import { DriverProfileScreen } from '@/screens/driver/DriverProfileScreen';

const Tab = createBottomTabNavigator<DriverTabParamList>();

const ICONS: Record<keyof DriverTabParamList, IconName> = {
  Requests: 'bell',
  Trips: 'file-text',
  DriverProfile: 'user',
};

export function DriverTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { ...typography.caption, fontWeight: '600' },
        tabBarStyle: { height: 64, paddingBottom: 8, paddingTop: 8 },
        tabBarIcon: ({ color, size }) => <Icon name={ICONS[route.name]} size={size} color={color} />,
      })}
    >
      <Tab.Screen name="Requests" component={DriverRequestsScreen} options={{ title: 'Requests' }} />
      <Tab.Screen name="Trips" component={DriverTripsScreen} options={{ title: 'My Trips' }} />
      <Tab.Screen name="DriverProfile" component={DriverProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
