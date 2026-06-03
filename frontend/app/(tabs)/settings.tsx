import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  colors,
  fontSizes,
  getFontSize,
  spacing,
  borderRadius,
  MIN_TOUCH_SIZE,
  shadows,
} from '../../constants/theme';
import { AlertThreshold, UserSettings, DEFAULT_SETTINGS } from '../../types';

const LANGUAGES = ['English', 'Spanish', 'French', 'Arabic', 'Portuguese'];

const THRESHOLD_OPTIONS: { value: AlertThreshold; label: string; description: string }[] = [
  { value: 'HIGH', label: 'HIGH only', description: 'Only life-threatening emergencies' },
  { value: 'MEDIUM', label: 'MEDIUM and above', description: 'Significant and life-threatening risks' },
  { value: 'LOW', label: 'All alerts', description: 'All nearby hazards including low risk' },
];

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

interface RowProps {
  label: string;
  description?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  largeText?: boolean;
}

function Row({ label, description, right, onPress, largeText = false }: RowProps) {
  const content = (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={[styles.rowLabel, { fontSize: getFontSize(fontSizes.md, largeText) }]}>{label}</Text>
        {description && (
          <Text style={[styles.rowDescription, { fontSize: getFontSize(fontSizes.xs, largeText) }]}>
            {description}
          </Text>
        )}
      </View>
      {right && <View style={styles.rowRight}>{right}</View>}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        style={styles.rowTouchable}
      >
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

export default function SettingsScreen() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  function updateSetting<K extends keyof UserSettings>(key: K, value: UserSettings[K]) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  const { largeText, alertThreshold, language, emergencyContact, locationName } = settings;
  const bodySize = getFontSize(fontSizes.sm, largeText);
  const smallSize = getFontSize(fontSizes.xs, largeText);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Alert Threshold */}
        <Section title="Alert Notifications">
          <Text style={[styles.thresholdLabel, { fontSize: smallSize }]}>
            Notify me when risk is:
          </Text>
          {THRESHOLD_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.thresholdOption,
                alertThreshold === opt.value && styles.thresholdOptionSelected,
              ]}
              onPress={() => updateSetting('alertThreshold', opt.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: alertThreshold === opt.value }}
              accessibilityLabel={`${opt.label}: ${opt.description}`}
            >
              <View style={styles.radioOuter}>
                {alertThreshold === opt.value && <View style={styles.radioInner} />}
              </View>
              <View style={styles.thresholdText}>
                <Text style={[styles.thresholdName, { fontSize: getFontSize(fontSizes.md, largeText) }]}>
                  {opt.label}
                </Text>
                <Text style={[styles.thresholdDesc, { fontSize: smallSize }]}>
                  {opt.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </Section>

        {/* Accessibility */}
        <Section title="Accessibility">
          <Row
            label="Large Text Mode"
            description="Increases all text size by 25%"
            largeText={largeText}
            right={
              <Switch
                value={largeText}
                onValueChange={(v) => updateSetting('largeText', v)}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={colors.text}
                accessibilityLabel="Large Text Mode"
              />
            }
          />
        </Section>

        {/* Location */}
        <Section title="Location">
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={[styles.rowLabel, { fontSize: getFontSize(fontSizes.md, largeText) }]}>
                Location Name
              </Text>
              <Text style={[styles.rowDescription, { fontSize: smallSize }]}>
                Custom name for your location
              </Text>
            </View>
          </View>
          <TextInput
            style={[styles.input, { fontSize: getFontSize(fontSizes.md, largeText) }]}
            value={locationName}
            onChangeText={(v) => updateSetting('locationName', v)}
            placeholder="e.g. Home, Sydney"
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="Location name"
          />
        </Section>

        {/* Emergency Contact */}
        <Section title="Emergency">
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={[styles.rowLabel, { fontSize: getFontSize(fontSizes.md, largeText) }]}>
                Emergency Contact
              </Text>
              <Text style={[styles.rowDescription, { fontSize: smallSize }]}>
                Phone number for emergency situations
              </Text>
            </View>
          </View>
          <TextInput
            style={[styles.input, { fontSize: getFontSize(fontSizes.md, largeText) }]}
            value={emergencyContact}
            onChangeText={(v) => updateSetting('emergencyContact', v)}
            placeholder="+61 400 000 000"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
            accessibilityLabel="Emergency contact number"
          />
        </Section>

        {/* Language */}
        <Section title="Language">
          {LANGUAGES.map(lang => (
            <TouchableOpacity
              key={lang}
              style={[
                styles.languageOption,
                language === lang && styles.languageOptionSelected,
              ]}
              onPress={() => updateSetting('language', lang)}
              accessibilityRole="radio"
              accessibilityState={{ checked: language === lang }}
              accessibilityLabel={lang}
            >
              <View style={styles.radioOuter}>
                {language === lang && <View style={styles.radioInner} />}
              </View>
              <Text style={[styles.languageLabel, { fontSize: getFontSize(fontSizes.md, largeText) }]}>
                {lang}
              </Text>
            </TouchableOpacity>
          ))}
        </Section>

        {/* About */}
        <Section title="About">
          <View style={styles.aboutContent}>
            <Text style={[styles.aboutTitle, { fontSize: getFontSize(fontSizes.lg, largeText) }]}>
              Anchor
            </Text>
            <Text style={[styles.aboutVersion, { fontSize: bodySize }]}>Version 1.0.0</Text>
            <Text style={[styles.aboutBody, { fontSize: bodySize }]}>
              Anchor monitors wildfires, floods, earthquakes, storms, extreme heat, and tsunamis near you. Data is sourced from NASA FIRMS, USGS, ECMWF, Bureau of Meteorology, and the Pacific Tsunami Warning Centre.
            </Text>
            <Text style={[styles.aboutBody, { fontSize: bodySize }]}>
              Available in Australia, Greece, Portugal, Spain, California, Oregon, Washington, and sub-Saharan Africa.
            </Text>
          </View>
        </Section>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
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
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.small,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    minHeight: MIN_TOUCH_SIZE,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowTouchable: {
    minHeight: MIN_TOUCH_SIZE,
  },
  rowLeft: {
    flex: 1,
  },
  rowRight: {
    marginLeft: spacing.sm,
  },
  rowLabel: {
    color: colors.text,
    fontWeight: '500',
  },
  rowDescription: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  thresholdLabel: {
    color: colors.textSecondary,
    padding: spacing.md,
    paddingBottom: spacing.xs,
  },
  thresholdOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    minHeight: MIN_TOUCH_SIZE,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  thresholdOptionSelected: {
    backgroundColor: `${colors.accent}15`,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
  thresholdText: {
    flex: 1,
  },
  thresholdName: {
    color: colors.text,
    fontWeight: '600',
  },
  thresholdDesc: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  input: {
    color: colors.text,
    padding: spacing.md,
    minHeight: MIN_TOUCH_SIZE,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    minHeight: MIN_TOUCH_SIZE,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  languageOptionSelected: {
    backgroundColor: `${colors.accent}15`,
  },
  languageLabel: {
    color: colors.text,
    fontWeight: '500',
  },
  aboutContent: {
    padding: spacing.md,
  },
  aboutTitle: {
    color: colors.text,
    fontWeight: '700',
    marginBottom: 4,
  },
  aboutVersion: {
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  aboutBody: {
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
  bottomPadding: {
    height: spacing.xl,
  },
});
