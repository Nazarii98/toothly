import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../src/AuthProvider";
import { useAppTheme } from "../src/theme";
import { useTranslation } from "react-i18next";

export default function LoginScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { signIn, resetPassword } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    const trimmed = email.trim();
    if (!trimmed || !password) {
      Alert.alert(t("common.error"), t("login.fillEmailPassword"));
      return;
    }
    setLoading(true);
    try {
      await signIn(trimmed, password);
    } catch (e: any) {
      const msg = firebaseErrorMessage(e.code, t);
      Alert.alert(t("login.loginError"), msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert(t("login.passwordRecovery"), t("login.enterEmailAbove"));
      return;
    }
    try {
      await resetPassword(trimmed);
      Alert.alert(t("common.done"), t("login.recoveryEmailSent", { email: trimmed }));
    } catch (e: any) {
      const msg = firebaseErrorMessage(e.code, t);
      Alert.alert(t("common.error"), msg);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={[
          styles.content,
          { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 },
        ]}
      >
        <View style={styles.header}>
          <View style={[styles.iconCircle, { backgroundColor: colors.accentBg }]}>
            <Ionicons name="medical" size={36} color={colors.accent} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{t("login.title")}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t("login.loginSubtitle")}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="mail-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={t("login.emailPlaceholder")}
              placeholderTextColor={colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
            />
          </View>

          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={t("login.passwordPlaceholder")}
              placeholderTextColor={colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="password"
            />
            <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={colors.textTertiary}
              />
            </Pressable>
          </View>

          <Pressable onPress={handleForgotPassword} hitSlop={8} style={styles.forgotBtn}>
            <Text style={[styles.forgotText, { color: colors.accent }]}>
              {t("login.forgotPassword")}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.primaryBtn, { backgroundColor: colors.accent, opacity: loading ? 0.7 : 1 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={[styles.primaryBtnText, { color: colors.white }]}>{t("login.signIn")}</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            {t("login.noAccount")}
          </Text>
          <Pressable onPress={() => router.push("/register")} hitSlop={8}>
            <Text style={[styles.footerLink, { color: colors.accent }]}>
              {t("login.register")}
            </Text>
          </Pressable>
        </View>

        <View style={styles.legalRow}>
          <Pressable onPress={() => Linking.openURL("https://toothly.arche.technology/privacy")} hitSlop={8}>
            <Text style={[styles.legalLink, { color: colors.textTertiary }]}>{t("legal.privacyPolicy")}</Text>
          </Pressable>
          <Text style={[styles.legalDot, { color: colors.textTertiary }]}>·</Text>
          <Pressable onPress={() => Linking.openURL("https://toothly.arche.technology/terms")} hitSlop={8}>
            <Text style={[styles.legalLink, { color: colors.textTertiary }]}>{t("legal.termsOfService")}</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function firebaseErrorMessage(code: string, t: (key: string) => string): string {
  switch (code) {
    case "auth/invalid-email": return t("errors.invalidEmail");
    case "auth/user-not-found": return t("errors.userNotFound");
    case "auth/wrong-password": return t("errors.wrongPassword");
    case "auth/invalid-credential": return t("errors.invalidCredential");
    case "auth/too-many-requests": return t("errors.tooManyRequests");
    case "auth/network-request-failed": return t("errors.networkError");
    default: return t("errors.unknown");
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: "center" },
  header: { alignItems: "center", marginBottom: 40 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: { fontSize: 28, fontWeight: "800", marginBottom: 6 },
  subtitle: { fontSize: 15 },
  form: { gap: 14 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16 },
  forgotBtn: { alignSelf: "flex-end", marginTop: -4, marginBottom: 4 },
  forgotText: { fontSize: 14, fontWeight: "500" },
  primaryBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  primaryBtnText: { fontSize: 17, fontWeight: "700" },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 32,
  },
  footerText: { fontSize: 15 },
  footerLink: { fontSize: 15, fontWeight: "600" },
  legalRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  legalLink: { fontSize: 13 },
  legalDot: { fontSize: 13 },
});
