import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocation } from '../../hooks/useLocation';
import { useAlerts } from '../../hooks/useAlerts';
import AlertItem from '../../components/AlertItem';
import { Alert } from '../../types';
import {
  colors,
  fontSizes,
  getFontSize,
  spacing,
  borderRadius,
} from '../../constants/theme';

export default function AlertsScreen() {
  const [largeText] = useState(false);
  const { location } = useLocation();
  const { alerts, loading, refreshing, error, loadAlerts, refresh } = useAlerts(location);

  useEffect(() => {
    if (location) loadAlerts();
  }, [location]);

  const titleSize = getFontSize(fontSizes.md, largeText);
  const bodySize = getFontSize(fontSizes.sm, largeText);

  function renderEmpty() {
    if (loading) return null;
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon} accessibilityHidden>✅</Text>
        <Text style={[styles.emptyTitle, { fontSize: getFontSize(fontSizes.xl, largeText) }]}>
          All Clear
        </Text>
        <Text style={[styles.emptyBody, { fontSize: bodySize }]}>
          No active alerts in your area. Anchor is monitoring for wildfires, floods, earthquakes, storms, extreme heat, and tsunamis.
        </Text>
      </View>
    );
  }

  function renderHeader() {
    return (
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { fontSize: getFontSize(fontSizes.lg, largeText) }]}>
          Alert History
        </Text>
        {alerts.length > 0 && (
          <Text style={[styles.headerSubtitle, { fontSize: bodySize }]}>
            {alerts.length} alert{alerts.length !== 1 ? 's' : ''} — tap any to expand
          </Text>
        )}
      </View>
    );
  }

  function renderItem({ item }: { item: Alert }) {
    return <AlertItem alert={item} largeText={largeText} />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      {loading && alerts.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { fontSize: bodySize }]}>
            Loading alerts…
          </Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
      {error && (
        <View style={styles.errorFooter}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    color: colors.textSecondary,
  },
  list: {
    padding: spacing.md,
    flexGrow: 1,
  },
  header: {
    marginBottom: spacing.md,
  },
  headerTitle: {
    color: colors.text,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: colors.textSecondary,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  emptyBody: {
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  errorFooter: {
    backgroundColor: 'rgba(211,47,47,0.2)',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.high,
  },
  errorText: {
    color: colors.text,
    fontSize: fontSizes.sm,
    textAlign: 'center',
  },
});
