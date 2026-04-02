import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  TextInput,
  Linking,
  ScrollView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAppTheme, THEME_COLORS } from "../../src/theme";
import type { ThemePreference } from "../../src/store/themeStore";
import { GlassModal } from "../../src/components/GlassModal";
import { useAuth } from "../../src/AuthProvider";
import { useTranslation } from "react-i18next";
import { LANGUAGES, changeLanguage } from "../../src/i18n";

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

const THEME_OPTIONS: { value: ThemePreference; icon: string }[] = [
  { value: "system", icon: "phone-portrait-outline" },
  { value: "light", icon: "sunny-outline" },
  { value: "dark", icon: "moon-outline" },
  { value: "emerald", icon: "leaf-outline" },
  { value: "ocean", icon: "water-outline" },
  { value: "lavender", icon: "flower-outline" },
  { value: "sunset", icon: "partly-sunny-outline" },
  { value: "midnight", icon: "planet-outline" },
];

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { colors, preference, setPreference } = useAppTheme();
  const { user, signOut, changePassword, deleteAccount } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const HEADER_HEIGHT = insets.top + (Platform.OS === "ios" ? 44 : 56);
  const bgRgb = hexToRgb(colors.bg);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [langModalOpen, setLangModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  const currentLang =
    LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

  const handleSignOut = () => {
    Alert.alert(t("settings.signOutTitle"), t("settings.signOutMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("settings.signOut"),
        style: "destructive",
        onPress: () => signOut(),
      },
    ]);
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      Alert.alert(t("common.error"), t("settings.passwordLabel"));
      return;
    }
    setDeleteLoading(true);
    try {
      await deleteAccount(deletePassword);
    } catch (e: any) {
      const msg =
        e.code === "auth/wrong-password" || e.code === "auth/invalid-credential"
          ? t("settings.wrongPassword")
          : t("settings.deleteError");
      Alert.alert(t("common.error"), msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw) {
      Alert.alert(t("common.error"), t("common.fillAllFields"));
      return;
    }
    if (newPw.length < 6) {
      Alert.alert(t("common.error"), t("settings.passwordMinLength"));
      return;
    }
    if (newPw !== confirmPw) {
      Alert.alert(t("common.error"), t("settings.passwordMismatch"));
      return;
    }
    setPwLoading(true);
    try {
      await changePassword(currentPw, newPw);
      setPwModalOpen(false);
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      Alert.alert(t("common.done"), t("settings.passwordChanged"));
    } catch (e: any) {
      const msg =
        e.code === "auth/wrong-password" || e.code === "auth/invalid-credential"
          ? t("settings.wrongCurrentPassword")
          : t("settings.changePasswordError");
      Alert.alert(t("common.error"), msg);
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <View style={[styles.safe, { backgroundColor: colors.bg }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: HEADER_HEIGHT + 12 },
        ]}
        scrollIndicatorInsets={{ top: HEADER_HEIGHT }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, shadowColor: colors.shadow },
          ]}
        >
          <Pressable
            style={styles.menuRow}
            onPress={() => router.push("/profiles")}
          >
            <View
              style={[styles.menuIcon, { backgroundColor: colors.accentBg }]}
            >
              <Ionicons name="person" size={22} color={colors.accent} />
            </View>
            <Text style={[styles.menuLabel, { color: colors.text }]}>
              {t("settings.profile")}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.chevron} />
          </Pressable>
          <View
            style={[styles.separator, { backgroundColor: colors.border }]}
          />
          <Pressable
            style={styles.menuRow}
            onPress={() => router.push("/statuses")}
          >
            <View
              style={[styles.menuIcon, { backgroundColor: colors.accentBg }]}
            >
              <Ionicons
                name="color-palette-outline"
                size={22}
                color={colors.accent}
              />
            </View>
            <Text style={[styles.menuLabel, { color: colors.text }]}>
              {t("settings.statusesMenu")}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.chevron} />
          </Pressable>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
          {t("settings.appearance")}
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, shadowColor: colors.shadow },
          ]}
        >
          <Pressable
            style={styles.menuRow}
            onPress={() => setThemeModalOpen(true)}
          >
            <View
              style={[styles.menuIcon, { backgroundColor: colors.accentBg }]}
            >
              <Ionicons
                name={
                  (THEME_OPTIONS.find((o) => o.value === preference)?.icon ??
                    "phone-portrait-outline") as any
                }
                size={22}
                color={colors.accent}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuLabel, { color: colors.text }]}>
                {t("settings.theme")}
              </Text>
              <Text style={[styles.menuHint, { color: colors.textTertiary }]}>
                {t(`themes.${preference}`, { defaultValue: preference })}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.chevron} />
          </Pressable>
          <View
            style={[styles.separator, { backgroundColor: colors.border }]}
          />
          <Pressable
            style={styles.menuRow}
            onPress={() => setLangModalOpen(true)}
          >
            <View
              style={[styles.menuIcon, { backgroundColor: colors.accentBg }]}
            >
              <Ionicons
                name="language-outline"
                size={22}
                color={colors.accent}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuLabel, { color: colors.text }]}>
                {t("settings.language")}
              </Text>
              <Text style={[styles.menuHint, { color: colors.textTertiary }]}>
                {currentLang.flag} {currentLang.label}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.chevron} />
          </Pressable>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
          {t("settings.general")}
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, shadowColor: colors.shadow },
          ]}
        >
          <Pressable
            style={styles.menuRow}
            onPress={() => Linking.openURL("https://toothly.arche.technology/")}
          >
            <View
              style={[styles.menuIcon, { backgroundColor: colors.accentBg }]}
            >
              <Ionicons
                name="information-circle-outline"
                size={22}
                color={colors.accent}
              />
            </View>
            <Text style={[styles.menuLabel, { color: colors.text }]}>
              {t("settings.aboutToothly")}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.chevron} />
          </Pressable>
          <View
            style={[styles.separator, { backgroundColor: colors.border }]}
          />
          <Pressable
            style={styles.menuRow}
            onPress={() =>
              Linking.openURL("https://toothly.arche.technology/privacy")
            }
          >
            <View
              style={[styles.menuIcon, { backgroundColor: colors.accentBg }]}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={22}
                color={colors.accent}
              />
            </View>
            <Text style={[styles.menuLabel, { color: colors.text }]}>
              {t("legal.privacyPolicy")}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.chevron} />
          </Pressable>
          <View
            style={[styles.separator, { backgroundColor: colors.border }]}
          />
          <Pressable
            style={styles.menuRow}
            onPress={() =>
              Linking.openURL("https://toothly.arche.technology/terms")
            }
          >
            <View
              style={[styles.menuIcon, { backgroundColor: colors.accentBg }]}
            >
              <Ionicons
                name="document-text-outline"
                size={22}
                color={colors.accent}
              />
            </View>
            <Text style={[styles.menuLabel, { color: colors.text }]}>
              {t("legal.termsOfService")}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.chevron} />
          </Pressable>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
          {t("settings.account")}
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, shadowColor: colors.shadow },
          ]}
        >
          <View style={styles.menuRow}>
            <View
              style={[styles.menuIcon, { backgroundColor: colors.accentBg }]}
            >
              <Ionicons name="mail" size={22} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuLabel, { color: colors.text }]}>
                Email
              </Text>
              <Text
                style={[styles.menuHint, { color: colors.textTertiary }]}
                numberOfLines={1}
              >
                {user?.email ?? "—"}
              </Text>
            </View>
          </View>
          <View
            style={[styles.separator, { backgroundColor: colors.border }]}
          />
          <Pressable
            style={styles.menuRow}
            onPress={() => setPwModalOpen(true)}
          >
            <View
              style={[styles.menuIcon, { backgroundColor: colors.accentBg }]}
            >
              <Ionicons name="key-outline" size={22} color={colors.accent} />
            </View>
            <Text style={[styles.menuLabel, { color: colors.text }]}>
              {t("settings.changePassword")}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.chevron} />
          </Pressable>
          <View
            style={[styles.separator, { backgroundColor: colors.border }]}
          />
          <Pressable style={styles.menuRow} onPress={handleSignOut}>
            <View
              style={[
                styles.menuIcon,
                { backgroundColor: "rgba(192,96,96,0.12)" },
              ]}
            >
              <Ionicons
                name="log-out-outline"
                size={22}
                color={colors.destructive}
              />
            </View>
            <Text style={[styles.menuLabel, { color: colors.destructive }]}>
              {t("settings.signOut")}
            </Text>
          </Pressable>
          <View
            style={[styles.separator, { backgroundColor: colors.border }]}
          />
          <Pressable
            style={styles.menuRow}
            onPress={() => setDeleteModalOpen(true)}
          >
            <View
              style={[
                styles.menuIcon,
                { backgroundColor: "rgba(192,96,96,0.12)" },
              ]}
            >
              <Ionicons
                name="trash-outline"
                size={22}
                color={colors.destructive}
              />
            </View>
            <Text style={[styles.menuLabel, { color: colors.destructive }]}>
              {t("settings.deleteAccount")}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <View
        style={[styles.header, { height: HEADER_HEIGHT }]}
        pointerEvents="none"
      >
        <BlurView
          intensity={60}
          tint={colors.isDark ? "systemMaterialDark" : "systemMaterial"}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={[
            `rgba(${bgRgb}, 0.85)`,
            `rgba(${bgRgb}, 0.75)`,
            `rgba(${bgRgb}, 0.6)`,
            `rgba(${bgRgb}, 0.35)`,
            `rgba(${bgRgb}, 0.1)`,
            `rgba(${bgRgb}, 0)`,
          ]}
          locations={[0, 0.2, 0.4, 0.6, 0.8, 1]}
          style={[
            StyleSheet.absoluteFill,
            {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: colors.border,
            },
          ]}
        />
        <View style={[styles.headerInner, { paddingTop: insets.top }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {t("settings.title")}
          </Text>
        </View>
      </View>

      {/* Theme modal */}
      <GlassModal
        visible={themeModalOpen}
        onClose={() => setThemeModalOpen(false)}
      >
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {t("settings.theme")}
          </Text>
          <Pressable onPress={() => setThemeModalOpen(false)} hitSlop={12}>
            <Text style={[styles.modalDone, { color: colors.accent }]}>
              {t("common.done")}
            </Text>
          </Pressable>
        </View>
        <View style={styles.themeList}>
          {THEME_OPTIONS.map(({ value, icon }) => {
            const isSelected = preference === value;
            const preview = value !== "system" ? THEME_COLORS[value] : null;
            return (
              <Pressable
                key={value}
                style={({ pressed }) => [
                  styles.themeOption,
                  isSelected && { backgroundColor: colors.badgeBg },
                  pressed && { backgroundColor: colors.statusOptionBg },
                ]}
                onPress={() => {
                  setPreference(value);
                  setThemeModalOpen(false);
                }}
              >
                <Ionicons
                  name={icon as any}
                  size={20}
                  color={isSelected ? colors.accent : colors.textTertiary}
                />
                <Text
                  style={[
                    styles.themeOptionText,
                    { color: colors.textSecondary },
                    isSelected && { fontWeight: "600", color: colors.text },
                  ]}
                >
                  {t(`themes.${value}`, { defaultValue: value })}
                </Text>
                {preview && (
                  <View style={styles.themePreview}>
                    <View
                      style={[
                        styles.previewDot,
                        { backgroundColor: preview.bg },
                      ]}
                    />
                    <View
                      style={[
                        styles.previewDot,
                        { backgroundColor: preview.accent },
                      ]}
                    />
                    <View
                      style={[
                        styles.previewDot,
                        { backgroundColor: preview.card },
                      ]}
                    />
                  </View>
                )}
                {isSelected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={colors.accent}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </GlassModal>

      {/* Language modal */}
      <GlassModal
        visible={langModalOpen}
        onClose={() => setLangModalOpen(false)}
      >
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {t("settings.language")}
          </Text>
          <Pressable onPress={() => setLangModalOpen(false)} hitSlop={12}>
            <Text style={[styles.modalDone, { color: colors.accent }]}>
              {t("common.done")}
            </Text>
          </Pressable>
        </View>
        <View style={styles.themeList}>
          {LANGUAGES.map((lang) => {
            const isSelected = i18n.language === lang.code;
            return (
              <Pressable
                key={lang.code}
                style={({ pressed }) => [
                  styles.themeOption,
                  isSelected && { backgroundColor: colors.badgeBg },
                  pressed && { backgroundColor: colors.statusOptionBg },
                ]}
                onPress={async () => {
                  await changeLanguage(lang.code);
                  setLangModalOpen(false);
                }}
              >
                <Text style={styles.langFlag}>{lang.flag}</Text>
                <Text
                  style={[
                    styles.themeOptionText,
                    { color: colors.textSecondary },
                    isSelected && { fontWeight: "600", color: colors.text },
                  ]}
                >
                  {lang.label}
                </Text>
                {isSelected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={colors.accent}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </GlassModal>

      {/* Delete account modal */}
      <GlassModal
        visible={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletePassword("");
        }}
      >
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.destructive }]}>
            {t("settings.deleteAccount")}
          </Text>
          <Pressable
            onPress={() => {
              setDeleteModalOpen(false);
              setDeletePassword("");
            }}
            hitSlop={12}
          >
            <Text style={[styles.modalDone, { color: colors.accent }]}>
              {t("common.cancel")}
            </Text>
          </Pressable>
        </View>
        <View style={styles.deleteModalContent}>
          <Text style={[styles.deleteWarning, { color: colors.textSecondary }]}>
            {t("settings.deleteWarning")}
          </Text>
          <TextInput
            style={[
              styles.deleteInput,
              {
                backgroundColor: colors.inputBg,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder={t("settings.passwordLabel")}
            placeholderTextColor={colors.textTertiary}
            value={deletePassword}
            onChangeText={setDeletePassword}
            secureTextEntry
            autoComplete="password"
          />
          <Pressable
            style={[
              styles.deleteBtn,
              {
                backgroundColor: colors.destructive,
                opacity: deleteLoading ? 0.7 : 1,
              },
            ]}
            onPress={handleDeleteAccount}
            disabled={deleteLoading}
          >
            <Text style={styles.deleteBtnText}>
              {deleteLoading
                ? t("settings.deleting")
                : t("settings.deleteForever")}
            </Text>
          </Pressable>
        </View>
      </GlassModal>

      {/* Change password modal */}
      <GlassModal
        visible={pwModalOpen}
        onClose={() => {
          setPwModalOpen(false);
          setCurrentPw("");
          setNewPw("");
          setConfirmPw("");
        }}
      >
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {t("settings.changePassword")}
          </Text>
          <Pressable
            onPress={() => {
              setPwModalOpen(false);
              setCurrentPw("");
              setNewPw("");
              setConfirmPw("");
            }}
            hitSlop={12}
          >
            <Text style={[styles.modalDone, { color: colors.accent }]}>
              {t("common.cancel")}
            </Text>
          </Pressable>
        </View>
        <View style={styles.deleteModalContent}>
          <TextInput
            style={[
              styles.deleteInput,
              {
                backgroundColor: colors.inputBg,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder={t("settings.currentPassword")}
            placeholderTextColor={colors.textTertiary}
            value={currentPw}
            onChangeText={setCurrentPw}
            secureTextEntry
            autoComplete="password"
          />
          <TextInput
            style={[
              styles.deleteInput,
              {
                backgroundColor: colors.inputBg,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder={t("settings.newPassword")}
            placeholderTextColor={colors.textTertiary}
            value={newPw}
            onChangeText={setNewPw}
            secureTextEntry
            autoComplete="new-password"
          />
          <TextInput
            style={[
              styles.deleteInput,
              {
                backgroundColor: colors.inputBg,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder={t("settings.confirmNewPassword")}
            placeholderTextColor={colors.textTertiary}
            value={confirmPw}
            onChangeText={setConfirmPw}
            secureTextEntry
            autoComplete="new-password"
          />
          <Pressable
            style={[
              styles.deleteBtn,
              { backgroundColor: colors.accent, opacity: pwLoading ? 0.7 : 1 },
            ]}
            onPress={handleChangePassword}
            disabled={pwLoading}
          >
            <Text style={styles.deleteBtnText}>
              {pwLoading
                ? t("settings.changing")
                : t("settings.changePassword")}
            </Text>
          </Pressable>
        </View>
      </GlassModal>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 120 },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerInner: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: 11,
    paddingHorizontal: 16,
  },
  headerTitle: { fontSize: 24, fontWeight: "700" },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 10,
  },
  card: {
    borderRadius: 20,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  menuLabel: { flex: 1, fontSize: 17, fontWeight: "600" },
  menuHint: { fontSize: 13, marginTop: 1 },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 70 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e8ece8",
  },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalDone: { fontSize: 16, fontWeight: "600" },
  themeList: { padding: 12 },
  themeOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 12,
  },
  themeOptionText: { flex: 1, fontSize: 16 },
  themePreview: { flexDirection: "row", gap: 4, marginRight: 4 },
  previewDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(128,128,128,0.3)",
  },
  langFlag: { fontSize: 22 },
  deleteModalContent: { padding: 20, gap: 14 },
  deleteWarning: { fontSize: 15, lineHeight: 21 },
  deleteInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  deleteBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
