import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useLocation } from '../hooks/useLocation';
import { usePushNotifications } from '../hooks/usePushNotifications';
import {
  colors,
  fontSizes,
  spacing,
  borderRadius,
  MIN_TOUCH_SIZE,
  shadows,
} from '../constants/theme';

type Step = 'welcome' | 'location' | 'notifications' | 'complete';

const STEPS: Step[] = ['welcome', 'location', 'notifications', 'complete'];

interface StepData {
  icon: string;
  title: string;
  body: string;
  buttonLabel: string;
}

const STEP_DATA: Record<Step, StepData> = {
  welcome: {
    icon: '⚓',
    title: 'Welcome to Anchor',
    body: "Anchor watches for wildfires, floods, earthquakes, storms, extreme heat, and tsunamis near you — and tells you exactly what to do.\n\nLet's get set up. This takes about 30 seconds.",
    buttonLabel: "Let's Go",
  },
  location: {
    icon: '📍',
    title: 'Allow Location',
    body: "Anchor needs your location to find hazards near you.\n\nYour location is only used to check for emergencies. It is never stored or shared.",
    buttonLabel: 'Allow Location',
  },
  notifications: {
    icon: '🔔',
    title: 'Turn On Alerts',
    body: "When danger is close, Anchor sends you an alert — in plain English — with exactly what to do.\n\nHigh-risk alerts will wake your phone even on silent.",
    buttonLabel: 'Allow Notifications',
  },
  complete: {
    icon: '✅',
    title: "You're Protected",
    body: "Anchor is now monitoring your area for emergencies.\n\nPull down to refresh on the home screen to check for new hazards at any time.",
    buttonLabel: 'Go to Dashboard',
  },
};

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [loading, setLoading] = useState(false);

  const { requestPermission: requestLocation } = useLocation();
  const { token: pushToken } = usePushNotifications(null);

  const stepIndex = STEPS.indexOf(currentStep);
  const stepData = STEP_DATA[currentStep];

  async function handleButtonPress() {
    setLoading(true);

    try {
      switch (currentStep) {
        case 'welcome':
          setCurrentStep('location');
          break;

        case 'location': {
          const granted = await requestLocation();
          setCurrentStep(granted ? 'notifications' : 'notifications');
          break;
        }

        case 'notifications': {
          // Push notification permission is requested by the hook
          // Just advance to complete
          setCurrentStep('complete');
          break;
        }

        case 'complete':
          router.replace('/(tabs)');
          break;
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Progress dots */}
        <View style={styles.progressDots}>
          {STEPS.map((step, i) => (
            <View
              key={step}
              style={[
                styles.dot,
                i <= stepIndex && styles.dotActive,
              ]}
              accessibilityLabel={`Step ${i + 1} of ${STEPS.length}`}
            />
          ))}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.icon} accessibilityHidden>
            {stepData.icon}
          </Text>
          <Text style={styles.title}>{stepData.title}</Text>
          <Text style={styles.body}>{stepData.body}</Text>
        </View>

        {/* Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleButtonPress}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel={stepData.buttonLabel}
        >
          {loading ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={styles.buttonText}>{stepData.buttonLabel}</Text>
          )}
        </TouchableOpacity>

        {currentStep !== 'welcome' && currentStep !== 'complete' && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => {
              const next = STEPS[stepIndex + 1];
              if (next) setCurrentStep(next);
            }}
            accessibilityRole="button"
            accessibilityLabel="Skip this step"
          >
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'space-between',
  },
  progressDots: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.accent,
    width: 24,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  icon: {
    fontSize: 72,
    marginBottom: spacing.xl,
  },
  title: {
    color: colors.text,
    fontSize: fontSizes.xxl,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  body: {
    color: colors.textSecondary,
    fontSize: fontSizes.md,
    textAlign: 'center',
    lineHeight: 28,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    minHeight: MIN_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.medium,
  },
  buttonText: {
    color: colors.text,
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
  skipButton: {
    minHeight: MIN_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  skipText: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
  },
});
