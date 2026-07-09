import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DriverTabParamList } from './types';
import { Icon, IconName } from '@/components';
import { colors, typography } from '@/theme';
import { DriverOverviewScreen } from '@/screens/driver/DriverOverviewScreen';
import { DriverRequestsScreen } from '@/screens/driver/DriverRequestsScreen';
import { DriverTripsScreen } from '@/screens/driver/DriverTripsScreen';
import { DriverInboxScreen } from '@/screens/driver/DriverInboxScreen';
import { DriverProfileScreen } from '@/screens/driver/DriverProfileScreen';
import { useNotifications } from '@/context/NotificationContext';

const Tab = createBottomTabNavigator<DriverTabParamList>();

const ICONS: Record<keyof DriverTabParamList, IconName> = {
  Overview: 'home',
  Requests: 'bell',
  Trips: 'file-text',
  DriverInbox: 'message-square',
  DriverProfile: 'user',
};

export function DriverTabs() {
  const { unreadChats } = useNotifications();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { ...typography.caption, fontWeight: '600', marginBottom: 4 },
        // Taller bar + bottom safe-area inset so labels aren't clipped (esp. on 5 tabs / home-indicator devices).
        tabBarStyle: { height: 74 + insets.bottom, paddingTop: 8, paddingBottom: 12 + insets.bottom },
        tabBarIcon: ({ color, size }) => <Icon name={ICONS[route.name]} size={size} color={color} />,
      })}
    >
      <Tab.Screen name="Overview" component={DriverOverviewScreen} options={{ title: 'Overview' }} />
      <Tab.Screen name="Requests" component={DriverRequestsScreen} options={{ title: 'Requests' }} />
      <Tab.Screen name="Trips" component={DriverTripsScreen} options={{ title: 'My Trips' }} />
      <Tab.Screen
        name="DriverInbox"
        component={DriverInboxScreen}
        options={{
          title: 'Chat',
          tabBarBadge: unreadChats > 0 ? (unreadChats > 9 ? '9+' : unreadChats) : undefined,
        }}
      />
      <Tab.Screen name="DriverProfile" component={DriverProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
