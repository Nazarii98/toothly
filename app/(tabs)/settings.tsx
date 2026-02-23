import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAppTheme, THEME_LABELS } from "../../src/theme";
import type { ThemePreference } from "../../src/store/themeStore";
import { GlassModal } from "../../src/components/GlassModal";
import { useAuth } from "../../src/AuthProvider";

const THEME_OPTIONS: { value: ThemePreference; icon: string }[] = [
  { value: "system", icon: "phone-portrait-outline" },
  { value: "light", icon: "sunny-outline" },
  { value: "dark", icon: "moon-outline" },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, preference, setPreference } = useAppTheme();
  const { user, signOut, deleteAccount } = useAuth();
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleSignOut = () => {
    Alert.alert("Вихід", "Ви впевнені, що хочете вийти з акаунту?", [
      { text: "Скасувати", style: "cancel" },
      {
        text: "Вийти",
        style: "destructive",
        onPress: () => signOut(),
      },
    ]);
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      Alert.alert("Помилка", "Введіть пароль для підтвердження");
      return;
    }
    setDeleteLoading(true);
    try {
      await deleteAccount(deletePassword);
    } catch (e: any) {
      const msg =
        e.code === "auth/wrong-password" || e.code === "auth/invalid-credential"
          ? "Невірний пароль"
          : "Помилка видалення акаунту. Спробуйте ще раз";
      Alert.alert("Помилка", msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={["top"]}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Налаштування</Text>
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
              Профіль
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
              Статуси зубів
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.chevron} />
          </Pressable>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
          Зовнішній вигляд
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
                  preference === "dark"
                    ? "moon"
                    : preference === "light"
                      ? "sunny"
                      : "phone-portrait-outline"
                }
                size={22}
                color={colors.accent}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuLabel, { color: colors.text }]}>
                Тема
              </Text>
              <Text style={[styles.menuHint, { color: colors.textTertiary }]}>
                {THEME_LABELS[preference]}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.chevron} />
          </Pressable>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
          Акаунт
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
              Вийти з акаунту
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
              Видалити акаунт
            </Text>
          </Pressable>
        </View>
      </View>

      <GlassModal
        visible={themeModalOpen}
        onClose={() => setThemeModalOpen(false)}
      >
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Тема</Text>
          <Pressable onPress={() => setThemeModalOpen(false)} hitSlop={12}>
            <Text style={[styles.modalDone, { color: colors.accent }]}>
              Готово
            </Text>
          </Pressable>
        </View>
        <View style={styles.themeList}>
          {THEME_OPTIONS.map(({ value, icon }) => {
            const isSelected = preference === value;
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
                  {THEME_LABELS[value]}
                </Text>
                {isSelected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={colors.accent}
                    style={{ marginLeft: "auto" }}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </GlassModal>

      <GlassModal
        visible={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletePassword("");
        }}
      >
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.destructive }]}>
            Видалити акаунт
          </Text>
          <Pressable
            onPress={() => {
              setDeleteModalOpen(false);
              setDeletePassword("");
            }}
            hitSlop={12}
          >
            <Text style={[styles.modalDone, { color: colors.accent }]}>
              Скасувати
            </Text>
          </Pressable>
        </View>
        <View style={styles.deleteModalContent}>
          <Text style={[styles.deleteWarning, { color: colors.textSecondary }]}>
            Це видалить ваш акаунт та всі дані безповоротно. Введіть пароль для
            підтвердження.
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
            placeholder="Пароль"
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
              {deleteLoading ? "Видалення..." : "Видалити назавжди"}
            </Text>
          </Pressable>
        </View>
      </GlassModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20 },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
  },
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
  menuLabel: {
    fontSize: 17,
    fontWeight: "600",
  },
  menuHint: {
    fontSize: 13,
    marginTop: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 70,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e8ece8",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalDone: {
    fontSize: 16,
    fontWeight: "600",
  },
  themeList: {
    padding: 12,
  },
  themeOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 12,
  },
  themeOptionText: {
    flex: 1,
    fontSize: 16,
  },
  deleteModalContent: {
    padding: 20,
    gap: 14,
  },
  deleteWarning: {
    fontSize: 15,
    lineHeight: 21,
  },
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
  deleteBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
