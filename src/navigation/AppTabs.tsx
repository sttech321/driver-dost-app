import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabParamList } from './types';
import { Icon, IconName } from '@/components';
import { colors, typography } from '@/theme';
import { DashboardScreen } from '@/screens/dashboard/DashboardScreen';
import { ActivityScreen } from '@/screens/tabs/ActivityScreen';
import { InboxScreen } from '@/screens/tabs/InboxScreen';
import { ProfileScreen } from '@/screens/tabs/ProfileScreen';
import { useNotifications } from '@/context/NotificationContext';

const Tab = createBottomTabNavigator<TabParamList>();

const ICONS: Record<keyof TabParamList, IconName> = {
  Home: 'home',
  Activity: 'file-text',
  Inbox: 'message-square',
  Profile: 'user',
};

export function AppTabs() {
  const { unreadChats } = useNotifications();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { ...typography.caption, fontWeight: '600', marginBottom: 4 },
        // Taller bar + bottom safe-area inset so labels aren't clipped.
        tabBarStyle: { height: 74 + insets.bottom, paddingTop: 8, paddingBottom: 12 + insets.bottom },
        tabBarIcon: ({ color, size }) => (
          <Icon name={ICONS[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Activity" component={ActivityScreen} />
      <Tab.Screen
        name="Inbox"
        component={InboxScreen}
        options={{ tabBarBadge: unreadChats > 0 ? (unreadChats > 9 ? '9+' : unreadChats) : undefined }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
