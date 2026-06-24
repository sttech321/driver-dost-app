import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList, TabParamList } from '@/navigation/types';
import { colors, radius, spacing, typography } from '@/theme';
import { Screen, Avatar, Icon } from '@/components';
import { bookingApi } from '@/api/booking.api';
import { Booking } from '@/api/types';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Inbox'>,
  NativeStackNavigationProp<AppStackParamList>
>;

export function InboxScreen() {
  const navigation = useNavigation<Nav>();
  const [chats, setChats] = useState<Booking[]>([]);

  const load = useCallback(async () => {
    try {
      const all = await bookingApi.list();
      // Conversations exist for bookings that have an assigned driver.
      setChats(all.filter((b) => b.driver));
    } catch {
      /* ignore */
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={typography.h2}>Inbox</Text>
        <Text style={typography.bodyMuted}>Chat with your drivers</Text>
      </View>
      <FlatList
        data={chats}
        keyExtractor={(b) => b.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() =>
              navigation.navigate('Chat', {
                bookingId: item.id,
                peerName: item.driver?.name ?? 'Driver',
              })
            }
          >
            <Avatar uri={item.driver?.photoUrl} size={52} />
            <View style={{ flex: 1 }}>
              <Text style={typography.title}>{item.driver?.name}</Text>
              <Text style={typography.caption} numberOfLines={1}>
                {item.driver?.title} · {item.status}
              </Text>
            </View>
            <Icon name="message-square" size={20} color={colors.primary} />
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="message-square" size={40} color={colors.textMuted} />
            <Text style={[typography.bodyMuted, { marginTop: spacing.md }]}>
              No conversations yet.
            </Text>
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: 2 },
  list: { padding: spacing.xl, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  sep: { height: 1, backgroundColor: colors.divider },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
