import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocation } from '../../hooks/useLocation';
import { useAlerts } from '../../hooks/useAlerts';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import RiskCard from '../../components/RiskCard';
import AlertItem from '../../components/AlertItem';
import EmergencyBadge from '../../components/EmergencyBadge';
import LocationPermission from '../../components/LocationPermission';
import {
  colors,
  fontSizes,
  getFontSize,
  spacing,
  borderRadius,
  riskColors,
  riskBackgroundColors,
  shadows,
  emergencyIcons,
  MIN_TOUCH_SIZE,
} from '../../constants/theme';
import { EmergencyType } from '../../types';

const ALL_EMERGENCY_TYPES: EmergencyType[] = ['wildfire', 'flood', 'earthquake', 'storm', 'heat', 'tsunami'];
const LARGE_TEXT_KEY = 'anchor_large_text';

export default function HomeScreen() {
  const [largeText, setLargeText] = useState(false);
  const { location, locationName, loading: locationLoading, error: locationError, permissionStatus, refresh: refreshLocation, requestPermission } = useLocation();
  const { token: deviceToken } = usePushNotifications(location);
  const {
    alerts,
    riskScores,
    overallRisk,
    overallScore,
    loading,
    refreshing,
    error,
    lastChecked,
    checkForAlerts,
    refresh,
  } = useAlerts(location, deviceToken);

  useEffect(() => {
    if (location) {
      checkForAlerts();
    }
  }, [location]);

  if (permissionStatus === 'denied' || (!locationLoading && locationError && permissionStatus !== 'granted')) {
    return (
      <LocationPermission
        onRequestPermission={requestPermission}
        largeText={largeText}
      />
    );
  }

  if (locationLoading && !location) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { fontSize: getFontSize(fontSizes.md, largeText) }]}>
          Getting your location…
        </Text>
      </View>
    );
  }

  const titleSize = getFontSize(fontSizes.xxl, largeText);
  const subtitleSize = getFontSize(fontSizes.sm, largeText);
  const sectionSize = getFontSize(fontSizes.md, largeText);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Location header */}
        <View style={styles.locationRow}>
          <Text style={styles.locationIcon} accessibilityHidden>📍</Text>
          <Text
            style={[styles.locationName, { fontSize: getFontSize(fontSizes.sm, largeText) }]}
            numberOfLines={1}
          >
            {locationName || 'Locating…'}
          </Text>
          {lastChecked && (
            <Text style={[styles.lastChecked, { fontSize: getFontSize(fontSizes.xs, largeText) }]}>
              Updated {formatTime(lastChecked)}
            </Text>
          )}
        </View>

        {/* Overall risk hero card */}
        <View
          style={[
            styles.heroCard,
            {
              borderColor: riskColors[overallRisk],
              backgroundColor: riskBackgroundColors[overallRisk],
            },
          ]}
          accessibilityRole="none"
          accessibilityLabel={`Overall risk: ${overallRisk}, score ${overallScore} out of 100`}
        >
          <Text style={[styles.heroLabel, { fontSize: subtitleSize }]}>CURRENT RISK LEVEL</Text>
          <Text style={[styles.heroScore, { fontSize: titleSize, color: riskColors[overallRisk] }]}>
            {overallScore}
          </Text>
          <Text style={[styles.heroScoreLabel, { fontSize: subtitleSize }]}>/100</Text>
          <EmergencyBadge level={overallRisk} largeText={largeText} />
          {overallRisk === 'LOW' && (
            <Text style={[styles.heroSafe, { fontSize: getFontSize(fontSizes.sm, largeText) }]}>
              No active threats near you
            </Text>
          )}
        </View>

        {/* Error message */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={refresh} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading indicator */}
        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={[styles.loadingSmall, { fontSize: subtitleSize }]}>Checking for hazards…</Text>
          </View>
        )}

        {/* Risk cards per emergency type */}
        <Text style={[styles.sectionTitle, { fontSize: sectionSize }]}>
          Hazard Monitor
        </Text>
        {ALL_EMERGENCY_TYPES.map(type => {
          const score = riskScores[type] ?? { score: 0, level: 'LOW' as const, emergencyType: type };
          return (
            <RiskCard
              key={type}
              emergencyType={type}
              riskScore={score}
              largeText={largeText}
            />
          );
        })}

        {/* Recent alerts */}
        {alerts.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { fontSize: sectionSize, marginTop: spacing.lg }]}>
              Active Alerts
            </Text>
            {alerts.slice(0, 3).map(alert => (
              <AlertItem key={alert.id} alert={alert} largeText={largeText} />
            ))}
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  loadingText: {
    color: colors.textSecondary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  locationIcon: {
    fontSize: 16,
  },
  locationName: {
    color: colors.textSecondary,
    flex: 1,
    fontWeight: '500',
  },
  lastChecked: {
    color: colors.textSecondary,
  },
  heroCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.medium,
  },
  heroLabel: {
    color: colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  heroScore: {
    fontWeight: '900',
    lineHeight: 48,
  },
  heroScoreLabel: {
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  heroSafe: {
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: 'rgba(211,47,47,0.15)',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.high,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: colors.text,
    flex: 1,
    fontSize: fontSizes.sm,
  },
  retryButton: {
    minHeight: MIN_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  retryText: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: fontSizes.sm,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  loadingSmall: {
    color: colors.textSecondary,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  bottomPadding: {
    height: spacing.xl,
  },
});
