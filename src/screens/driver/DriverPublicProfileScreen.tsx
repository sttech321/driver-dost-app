import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@/navigation/types';
import { colors, radius, spacing, typography } from '@/theme';
import { Screen, ScreenHeader, Avatar, Icon, StarRating } from '@/components';
import { driverApi } from '@/api/driver.api';
import { Driver, Review } from '@/api/types';

type Props = NativeStackScreenProps<AppStackParamList, 'DriverProfileView'>;

export function DriverPublicProfileScreen({ navigation, route }: Props) {
  const { driverId } = route.params;
  const [driver, setDriver] = useState<Driver | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    driverApi
      .reviews(driverId)
      .then((d) => {
        if (!active) return;
        setDriver(d.driver);
        setReviews(d.reviews);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [driverId]);

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <ScreenHeader onBack={() => navigation.goBack()} title="Driver Profile" />
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : !driver ? (
        <View style={styles.loader}>
          <Text style={typography.bodyMuted}>Driver not found.</Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          ListHeaderComponent={
            <View style={styles.headerCard}>
              <Avatar uri={driver.photoUrl} size={80} />
              <Text style={[typography.h2, { marginTop: spacing.md }]}>{driver.name}</Text>
              <View style={styles.titleRow}>
                <Icon name="check" size={14} color={colors.white} />
                <Text style={styles.titleText}>{driver.title}</Text>
              </View>
              <View style={styles.ratingRow}>
                <StarRating value={Number(driver.rating)} size={22} />
                <Text style={[typography.h3, { marginLeft: spacing.sm }]}>
                  {Number(driver.rating).toFixed(1)}
                </Text>
              </View>
              <Text style={typography.caption}>
                {driver.ratingCount} {driver.ratingCount === 1 ? 'review' : 'reviews'} · {driver.code}
              </Text>

              <Text style={[typography.h3, styles.reviewsHeading]}>Reviews</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.reviewCard}>
              <View style={styles.reviewTop}>
                <Text style={typography.title}>{item.user?.name || 'Rider'}</Text>
                <Text style={typography.caption}>{fmtDate(item.createdAt)}</Text>
              </View>
              <StarRating value={item.rating} size={16} />
              {!!item.comment && (
                <Text style={[typography.body, { marginTop: spacing.xs }]}>{item.comment}</Text>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="star" size={36} color={colors.divider} />
              <Text style={[typography.bodyMuted, { marginTop: spacing.sm }]}>
                No reviews yet — be the first to rate this driver.
              </Text>
            </View>
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  list: { padding: spacing.xl, flexGrow: 1 },
  headerCard: { alignItems: 'center', marginBottom: spacing.lg },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    marginVertical: spacing.xs,
  },
  titleText: { ...typography.caption, color: colors.white, fontWeight: '700' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  reviewsHeading: { alignSelf: 'flex-start', marginTop: spacing.xl },
  reviewCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl },
});
