import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';
import { DriverNavigator } from './DriverNavigator';
import { colors } from '@/theme';
import { Logo } from '@/components';

export function RootNavigator() {
  const { user, loading, locationChecked } = useAuth();

  // Splash while restoring session, or while resolving a rider's saved
  // location permission (prevents the permission screen flashing on login).
  const resolvingLocation = !!user && user.role !== 'DRIVER' && !locationChecked;

  if (loading || resolvingLocation) {
    return (
      <View style={styles.splash}>
        <Logo size={28} />
        <ActivityIndicator color={colors.white} style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? (
        <AuthNavigator />
      ) : user.role === 'DRIVER' ? (
        <DriverNavigator />
      ) : (
        <AppNavigator />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
