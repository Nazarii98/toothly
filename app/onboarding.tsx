import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import {
  THEME_COLORS,
  THEME_LABELS,
  useAppTheme,
  type ColorTokens,
} from "../src/theme";
import type { ThemePreference } from "../src/store/themeStore";
import {
  markOnboardingCompleted,
  savePendingProfileName,
} from "../src/store/onboardingStore";

type ProfileChoice = "self" | "family";
type ThemeChoice = Exclude<ThemePreference, "system">;
type StepKind = "profile" | "chart" | "history" | "theme" | "trial";

const THEME_CHOICES: ThemeChoice[] = [
  "light",
  "dark",
  "emerald",
  "ocean",
  "lavender",
  "sunset",
  "midnight",
];

const STEPS: StepKind[] = ["profile", "chart", "history", "theme", "trial"];

function hexToRgba(hex: string, opacity: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function profileNameForChoice(
  choice: ProfileChoice,
  t: (key: string) => string,
): string {
  return choice === "family"
    ? t("onboarding.profile.familyProfileName")
    : t("onboarding.profile.selfProfileName");
}

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const { colors, preference, setPreference } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [stepIndex, setStepIndex] = useState(0);
  const [profileChoice, setProfileChoice] = useState<ProfileChoice>("self");
  const [selectedTheme, setSelectedTheme] = useState<ThemeChoice>(
    preference === "system" ? "emerald" : preference,
  );

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  const titles = useMemo(
    () => ({
      profile: t("onboarding.profile.title"),
      chart: t("onboarding.chart.title"),
      history: t("onboarding.history.title"),
      theme: t("onboarding.theme.title"),
      trial: t("onboarding.trial.title"),
    }),
    [t],
  );

  const subtitles = useMemo(
    () => ({
      profile: t("onboarding.profile.subtitle"),
      chart: t("onboarding.chart.subtitle"),
      history: t("onboarding.history.subtitle"),
      theme: t("onboarding.theme.subtitle"),
      trial: t("onboarding.trial.subtitle"),
    }),
    [t],
  );

  const finish = async () => {
    await savePendingProfileName(profileNameForChoice(profileChoice, t));
    await markOnboardingCompleted();
    router.replace("/login");
  };

  const chooseProfile = async (choice: ProfileChoice) => {
    setProfileChoice(choice);
    await savePendingProfileName(profileNameForChoice(choice, t));
  };

  const chooseTheme = (theme: ThemeChoice) => {
    setSelectedTheme(theme);
    setPreference(theme);
  };

  const goNext = () => {
    if (isLast) {
      finish();
      return;
    }
    setStepIndex((current) => current + 1);
  };

  const goBack = () => {
    setStepIndex((current) => Math.max(0, current - 1));
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <LinearGradient
        pointerEvents="none"
        colors={[
          hexToRgba(colors.accent, colors.isDark ? 0.22 : 0.14),
          hexToRgba(colors.bg, 0),
        ]}
        style={styles.glowTop}
      />
      <View style={[styles.header, { paddingTop: insets.top + 18 }]}>
        <View style={styles.dots} accessibilityLabel={t("onboarding.progress")}>
          {STEPS.map((item, index) => (
            <View
              key={item}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === stepIndex ? colors.accent : colors.border,
                  width: index === stepIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>
        <Pressable onPress={finish} hitSlop={10} style={styles.skipButton}>
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>
            {t("onboarding.skip")}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 126 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.copy}>
          <Text style={[styles.title, { color: colors.text }]}>
            {titles[step]}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {subtitles[step]}
          </Text>
        </View>

        {step === "profile" && (
          <ProfileVisual
            choice={profileChoice}
            colors={colors}
            onChoose={chooseProfile}
            t={t}
          />
        )}
        {step === "chart" && <ChartVisual colors={colors} t={t} />}
        {step === "history" && <HistoryVisual colors={colors} t={t} />}
        {step === "theme" && (
          <ThemeVisual
            colors={colors}
            selectedTheme={selectedTheme}
            onChoose={chooseTheme}
            t={t}
          />
        )}
        {step === "trial" && <TrialVisual colors={colors} t={t} />}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + 18,
            backgroundColor: hexToRgba(colors.bg, colors.isDark ? 0.92 : 0.96),
            borderTopColor: colors.border,
          },
        ]}
      >
        {stepIndex > 0 ? (
          <Pressable
            onPress={goBack}
            hitSlop={10}
            style={[styles.backButton, { borderColor: colors.border }]}
          >
            <Ionicons name="chevron-back" size={18} color={colors.text} />
          </Pressable>
        ) : (
          <View style={styles.backButtonPlaceholder} />
        )}
        <Pressable
          onPress={goNext}
          style={[styles.primaryButton, { backgroundColor: colors.accent }]}
        >
          <Text style={[styles.primaryText, { color: colors.white }]}>
            {isLast ? t("onboarding.trial.cta") : t("onboarding.continue")}
          </Text>
          <Ionicons name="arrow-forward" size={18} color={colors.white} />
        </Pressable>
      </View>
    </View>
  );
}

function ProfileVisual({
  choice,
  colors,
  onChoose,
  t,
}: {
  choice: ProfileChoice;
  colors: ColorTokens;
  onChoose: (choice: ProfileChoice) => void;
  t: (key: string) => string;
}) {
  const options: Array<{
    key: ProfileChoice;
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
  }> = [
    {
      key: "self",
      icon: "person-outline",
      title: t("onboarding.profile.self"),
      subtitle: t("onboarding.profile.selfHint"),
    },
    {
      key: "family",
      icon: "people-outline",
      title: t("onboarding.profile.family"),
      subtitle: t("onboarding.profile.familyHint"),
    },
  ];

  return (
    <View style={styles.visualBlock}>
      <View
        style={[
          styles.previewCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.previewHeader}>
          <View style={[styles.iconBubble, { backgroundColor: colors.accentBg }]}>
            <Ionicons name="medical" size={25} color={colors.accent} />
          </View>
          <View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Toothly
            </Text>
            <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
              {t("onboarding.profile.previewMeta")}
            </Text>
          </View>
        </View>
        <View style={styles.profileRows}>
          {options.map((option) => {
            const selected = choice === option.key;
            return (
              <Pressable
                key={option.key}
                onPress={() => onChoose(option.key)}
                style={[
                  styles.optionRow,
                  {
                    backgroundColor: selected
                      ? colors.accentBg
                      : colors.cardSecondary,
                    borderColor: selected ? colors.accent : colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.optionIcon,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <Ionicons
                    name={option.icon}
                    size={22}
                    color={colors.accent}
                  />
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    {option.title}
                  </Text>
                  <Text
                    style={[
                      styles.optionSubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {option.subtitle}
                  </Text>
                </View>
                {selected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={colors.accent}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function ChartVisual({
  colors,
  t,
}: {
  colors: ColorTokens;
  t: (key: string) => string;
}) {
  const teeth = [0, 1, 2, 3, 4, 5, 6, 7];
  return (
    <View style={styles.visualBlock}>
      <View
        style={[
          styles.chartCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.chartTop}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {t("onboarding.chart.upperArch")}
          </Text>
          <View style={styles.legend}>
            <View style={[styles.legendDot, { backgroundColor: "#7fc99b" }]} />
            <View style={[styles.legendDot, { backgroundColor: "#f2c66d" }]} />
            <View style={[styles.legendDot, { backgroundColor: "#da7a7a" }]} />
          </View>
        </View>
        <View style={styles.arch}>
          {teeth.map((item) => (
            <View
              key={item}
              style={[
                styles.tooth,
                {
                  backgroundColor: item === 2 ? "#f9e1e1" : colors.cardSecondary,
                  borderColor: item === 2 ? "#da7a7a" : colors.border,
                  marginTop: Math.abs(3.5 - item) * 8,
                },
              ]}
            >
              <Ionicons
                name="ellipse"
                size={16}
                color={item === 2 ? "#da7a7a" : colors.accent}
              />
            </View>
          ))}
        </View>
        <View style={[styles.tapPill, { backgroundColor: colors.accent }]}>
          <Ionicons name="hand-left-outline" size={15} color={colors.white} />
          <Text style={[styles.tapPillText, { color: colors.white }]}>
            {t("onboarding.chart.tapToUpdate")}
          </Text>
        </View>
      </View>
    </View>
  );
}

function HistoryVisual({
  colors,
  t,
}: {
  colors: ColorTokens;
  t: (key: string) => string;
}) {
  const days = ["24", "25", "26", "27", "28", "29", "30", "1", "2", "3", "4", "5"];
  return (
    <View style={styles.visualBlock}>
      <View
        style={[
          styles.historyCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.historyHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {t("onboarding.history.month")}
          </Text>
          <View style={styles.historyArrows}>
            <Ionicons name="chevron-back" size={18} color={colors.textTertiary} />
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textTertiary}
            />
          </View>
        </View>
        <View style={styles.calendarGrid}>
          {days.map((day) => (
            <View
              key={day}
              style={[
                styles.dayCell,
                day === "12" && { backgroundColor: colors.accentBg },
              ]}
            >
              <Text style={[styles.dayText, { color: colors.textSecondary }]}>
                {day}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.timeline}>
          <TimelineItem
            colors={colors}
            icon="sparkles-outline"
            title={t("onboarding.history.cleaning")}
            meta={t("onboarding.history.cleaningMeta")}
          />
          <TimelineItem
            colors={colors}
            icon="shield-checkmark-outline"
            title={t("onboarding.history.checkup")}
            meta={t("onboarding.history.checkupMeta")}
          />
        </View>
      </View>
    </View>
  );
}

function TimelineItem({
  colors,
  icon,
  title,
  meta,
}: {
  colors: ColorTokens;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  meta: string;
}) {
  return (
    <View style={[styles.timelineItem, { backgroundColor: colors.cardSecondary }]}>
      <View style={[styles.timelineAccent, { backgroundColor: colors.accent }]} />
      <View style={[styles.timelineIcon, { backgroundColor: colors.accentBg }]}>
        <Ionicons name={icon} size={18} color={colors.accent} />
      </View>
      <View style={styles.optionText}>
        <Text style={[styles.timelineTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>
          {meta}
        </Text>
      </View>
    </View>
  );
}

function ThemeVisual({
  colors,
  selectedTheme,
  onChoose,
  t,
}: {
  colors: ColorTokens;
  selectedTheme: ThemeChoice;
  onChoose: (theme: ThemeChoice) => void;
  t: (key: string, options?: { defaultValue?: string }) => string;
}) {
  return (
    <View style={styles.visualBlock}>
      <View style={styles.themeGrid}>
        {THEME_CHOICES.map((theme) => {
          const themeColors = THEME_COLORS[theme];
          const selected = selectedTheme === theme;
          return (
            <Pressable
              key={theme}
              onPress={() => onChoose(theme)}
              style={[
                styles.themeOption,
                {
                  backgroundColor: themeColors.card,
                  borderColor: selected ? colors.accent : themeColors.border,
                },
              ]}
            >
              <View style={styles.themeSwatches}>
                <View
                  style={[
                    styles.themeSwatchLarge,
                    { backgroundColor: themeColors.bg },
                  ]}
                />
                <View style={styles.themeSwatchStack}>
                  <View
                    style={[
                      styles.themeSwatchSmall,
                      { backgroundColor: themeColors.accent },
                    ]}
                  />
                  <View
                    style={[
                      styles.themeSwatchSmall,
                      { backgroundColor: themeColors.accentBg },
                    ]}
                  />
                </View>
              </View>
              <View style={styles.themeLabelRow}>
                <Text style={[styles.themeName, { color: themeColors.text }]}>
                  {t(`themes.${theme}`, { defaultValue: THEME_LABELS[theme] })}
                </Text>
                {selected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={themeColors.accent}
                  />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function TrialVisual({
  colors,
  t,
}: {
  colors: ColorTokens;
  t: (key: string) => string;
}) {
  const features = [
    t("onboarding.trial.featureChart"),
    t("onboarding.trial.featureHistory"),
    t("onboarding.trial.featureProfiles"),
    t("onboarding.trial.featureExport"),
  ];

  return (
    <View style={styles.visualBlock}>
      <View
        style={[
          styles.trialCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={[styles.trialIcon, { backgroundColor: colors.accentBg }]}>
          <Ionicons name="diamond-outline" size={32} color={colors.accent} />
        </View>
        <Text style={[styles.trialHeadline, { color: colors.text }]}>
          {t("onboarding.trial.fullAccess")}
        </Text>
        <Text style={[styles.trialPrice, { color: colors.text }]}>$39.99</Text>
        <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
          {t("onboarding.trial.priceMeta")}
        </Text>
        <View style={styles.featureList}>
          {features.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <Ionicons name="checkmark" size={17} color={colors.accent} />
              <Text style={[styles.featureText, { color: colors.text }]}>
                {feature}
              </Text>
            </View>
          ))}
        </View>
        <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
          {t("onboarding.trial.cancel")}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  glowTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 260,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 10,
  },
  dots: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    height: 36,
  },
  dot: {
    borderRadius: 999,
    height: 6,
  },
  skipButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    minWidth: 54,
  },
  skipText: {
    fontSize: 15,
    fontWeight: "700",
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  copy: {
    alignItems: "center",
    marginBottom: 28,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 38,
    maxWidth: 327,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 24,
    marginTop: 12,
    maxWidth: 320,
    textAlign: "center",
  },
  visualBlock: {
    alignSelf: "center",
    maxWidth: 420,
    width: "100%",
  },
  previewCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  previewHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },
  iconBubble: {
    alignItems: "center",
    borderRadius: 20,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  cardMeta: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  profileRows: {
    gap: 12,
  },
  optionRow: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 82,
    padding: 14,
  },
  optionIcon: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  optionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  chartCard: {
    borderRadius: 24,
    borderWidth: 1,
    minHeight: 390,
    overflow: "hidden",
    padding: 20,
  },
  chartTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  legend: {
    flexDirection: "row",
    gap: 8,
  },
  legendDot: {
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  arch: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 210,
    paddingTop: 66,
  },
  tooth: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    height: 56,
    justifyContent: "center",
    width: 36,
  },
  tapPill: {
    alignItems: "center",
    alignSelf: "flex-end",
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  tapPillText: {
    fontSize: 13,
    fontWeight: "800",
  },
  historyCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  historyHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  historyArrows: {
    flexDirection: "row",
    gap: 12,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  dayCell: {
    alignItems: "center",
    borderRadius: 14,
    height: 34,
    justifyContent: "center",
    width: "12.2%",
  },
  dayText: {
    fontSize: 13,
    fontWeight: "700",
  },
  timeline: {
    gap: 12,
  },
  timelineItem: {
    alignItems: "center",
    borderRadius: 18,
    flexDirection: "row",
    gap: 12,
    minHeight: 74,
    overflow: "hidden",
    paddingHorizontal: 14,
  },
  timelineAccent: {
    alignSelf: "stretch",
    marginLeft: -14,
    width: 4,
  },
  timelineIcon: {
    alignItems: "center",
    borderRadius: 14,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  themeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  themeOption: {
    borderRadius: 20,
    borderWidth: 2,
    minHeight: 132,
    padding: 14,
    width: "48%",
  },
  themeSwatches: {
    flexDirection: "row",
    gap: 8,
    height: 62,
  },
  themeSwatchLarge: {
    borderRadius: 14,
    flex: 1,
  },
  themeSwatchStack: {
    gap: 8,
    width: 34,
  },
  themeSwatchSmall: {
    borderRadius: 10,
    flex: 1,
  },
  themeLabelRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  themeName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
  },
  trialCard: {
    alignItems: "center",
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
  },
  trialIcon: {
    alignItems: "center",
    borderRadius: 26,
    height: 64,
    justifyContent: "center",
    marginBottom: 18,
    width: 64,
  },
  trialHeadline: {
    fontSize: 21,
    fontWeight: "800",
    textAlign: "center",
  },
  trialPrice: {
    fontSize: 42,
    fontWeight: "900",
    marginTop: 18,
  },
  featureList: {
    alignSelf: "stretch",
    gap: 12,
    marginTop: 24,
  },
  featureRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  cancelText: {
    fontSize: 13,
    marginTop: 22,
    textAlign: "center",
  },
  footer: {
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    bottom: 0,
    flexDirection: "row",
    gap: 14,
    left: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    position: "absolute",
    right: 0,
  },
  backButton: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  backButtonPlaceholder: {
    width: 0,
  },
  primaryButton: {
    alignItems: "center",
    borderRadius: 18,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    height: 56,
    justifyContent: "center",
  },
  primaryText: {
    fontSize: 17,
    fontWeight: "800",
  },
});
