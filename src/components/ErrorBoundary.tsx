import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/theme';

interface State {
  error: Error | null;
  info: string | null;
}

/**
 * Catches render-time errors and shows the actual message + stack on screen,
 * instead of Expo Go's generic "Something went wrong" page. Diagnostic aid.
 */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // Also log to Metro so it appears in the terminal.
    console.error('[ErrorBoundary]', error, info.componentStack);
    this.setState({ info: info.componentStack });
  }

  render() {
    const { error, info } = this.state;
    if (!error) return this.props.children;

    return (
      <View style={styles.root}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>App error</Text>
          <Text style={styles.msg}>{error.message}</Text>
          {!!error.stack && <Text style={styles.stack}>{error.stack}</Text>}
          {!!info && <Text style={styles.stack}>{info}</Text>}
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white, paddingTop: 60 },
  content: { padding: spacing.xl, gap: spacing.md },
  title: { ...typography.h2, color: colors.danger },
  msg: { ...typography.body, color: colors.textPrimary, fontWeight: '700' },
  stack: { fontSize: 12, color: colors.textSecondary, fontFamily: 'monospace' },
});
