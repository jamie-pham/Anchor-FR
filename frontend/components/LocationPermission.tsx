import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  colors,
  fontSizes,
  getFontSize,
  spacing,
  borderRadius,
  MIN_TOUCH_SIZE,
} from '../constants/theme';

interface LocationPermissionProps {
  onRequestPermission: () => void;
  largeText?: boolean;
}

export default function LocationPermission({ onRequestPermission, largeText = false }: LocationPermissionProps) {
  const titleSize = getFontSize(fontSizes.xl, largeText);
  const bodySize = getFontSize(fontSizes.md, largeText);
  const buttonSize = getFontSize(fontSizes.md, largeText);

  return (
    <View style={styles.container}>
      <Text style={styles.illustration} accessibilityHidden>📍</Text>
      <Text style={[styles.title, { fontSize: titleSize }]}>
        Location Access Needed
      </Text>
      <Text style={[styles.body, { fontSize: bodySize }]}>
        Anchor uses your location to detect nearby hazards — wildfires, floods, earthquakes, and more.
        {'\n\n'}
        Your location is only used to check for emergencies. It is never stored or shared.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={onRequestPermission}
        accessibilityRole="button"
        accessibilityLabel="Allow location access"
      >
        <Text style={[styles.buttonText, { fontSize: buttonSize }]}>Allow Location Access</Text>
      </TouchableOpacity>
      <Text style={[styles.footnote, { fontSize: getFontSize(fontSizes.xs, largeText) }]}>
        You can change this at any time in your device Settings.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  illustration: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.text,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  body: {
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: spacing.xl,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xl,
    minHeight: MIN_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: spacing.md,
  },
  buttonText: {
    color: colors.text,
    fontWeight: '700',
  },
  footnote: {
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
