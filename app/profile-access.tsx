import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../src/theme";
import { useAuth } from "../src/AuthProvider";
import {
  getProfileMembers,
  findUserByEmail,
  grantAccess,
  revokeAccess,
  getUserDoc,
  type AccessRole,
  type ProfileAccessEntry,
} from "../src/store/firestoreService";

const ROLE_LABELS: Record<AccessRole, string> = {
  owner: "Власник",
  editor: "Редактор",
  viewer: "Переглядач",
};

const ASSIGNABLE_ROLES: AccessRole[] = ["editor", "viewer"];

export default function ProfileAccessScreen() {
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { profileId, profileName } = useLocalSearchParams<{
    profileId: string;
    profileName: string;
  }>();

  const [members, setMembers] = useState<
    (ProfileAccessEntry & { email?: string; displayName?: string })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<AccessRole>("viewer");
  const [adding, setAdding] = useState(false);

  const refresh = useCallback(async () => {
    if (!profileId) return;
    setLoading(true);
    try {
      const entries = await getProfileMembers(profileId);
      const enriched = await Promise.all(
        entries.map(async (e) => {
          const userDoc = await getUserDoc(e.uid);
          return {
            ...e,
            email: userDoc?.email ?? "—",
            displayName: userDoc?.display_name ?? "",
          };
        }),
      );
      enriched.sort((a, b) => {
        const order: Record<string, number> = { owner: 0, editor: 1, viewer: 2 };
        return (order[a.role] ?? 3) - (order[b.role] ?? 3);
      });
      setMembers(enriched);
    } catch {
      Alert.alert("Помилка", "Не вдалося завантажити учасників");
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const handleAdd = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      Alert.alert("Помилка", "Введіть email");
      return;
    }
    if (trimmed === user?.email?.toLowerCase()) {
      Alert.alert("Помилка", "Не можна додати себе");
      return;
    }
    if (members.some((m) => m.email?.toLowerCase() === trimmed)) {
      Alert.alert("Помилка", "Цей користувач вже має доступ");
      return;
    }
    setAdding(true);
    try {
      const found = await findUserByEmail(trimmed);
      if (!found) {
        Alert.alert("Не знайдено", "Користувача з таким email не знайдено в системі");
        return;
      }
      await grantAccess(profileId!, found.uid, selectedRole, user!.uid);
      setEmail("");
      await refresh();
    } catch {
      Alert.alert("Помилка", "Не вдалося додати користувача");
    } finally {
      setAdding(false);
    }
  };

  const handleChangeRole = (entry: ProfileAccessEntry, newRole: AccessRole) => {
    Alert.alert(
      "Змінити роль",
      `Змінити роль на "${ROLE_LABELS[newRole]}"?`,
      [
        { text: "Скасувати", style: "cancel" },
        {
          text: "Змінити",
          onPress: async () => {
            await grantAccess(profileId!, entry.uid, newRole, user!.uid);
            refresh();
          },
        },
      ],
    );
  };

  const handleRemove = (entry: ProfileAccessEntry & { email?: string }) => {
    Alert.alert(
      "Видалити доступ",
      `Прибрати доступ для ${entry.email}?`,
      [
        { text: "Скасувати", style: "cancel" },
        {
          text: "Видалити",
          style: "destructive",
          onPress: async () => {
            await revokeAccess(profileId!, entry.uid);
            refresh();
          },
        },
      ],
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: profileName ? decodeURIComponent(profileName) : "Доступ",
          headerTintColor: "#fff",
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.bg }]}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 68, paddingBottom: insets.bottom + 40 }]}
      >
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
          Учасники
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 24 }} />
        ) : (
          <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            {members.map((m, idx) => {
              const isOwner = m.role === "owner";
              const initial = (m.email?.[0] ?? "?").toUpperCase();
              const roleColor = isOwner
                ? colors.accent
                : m.role === "editor"
                  ? "#FF9800"
                  : colors.textTertiary;

              return (
                <View key={m.id}>
                  {idx > 0 && <View style={[styles.separator, { backgroundColor: colors.border }]} />}
                  <View style={styles.memberRow}>
                    <View style={[styles.avatar, { backgroundColor: isOwner ? colors.accent : colors.accentBg }]}>
                      <Text style={[styles.avatarText, { color: isOwner ? colors.white : colors.accent }]}>
                        {initial}
                      </Text>
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={[styles.memberEmail, { color: colors.text }]} numberOfLines={1}>
                        {m.email}
                      </Text>
                      <View style={[styles.roleBadge, { backgroundColor: roleColor + "18" }]}>
                        <Text style={[styles.roleText, { color: roleColor }]}>
                          {ROLE_LABELS[m.role]}
                        </Text>
                      </View>
                    </View>
                    {!isOwner && (
                      <View style={styles.memberActions}>
                        <Pressable
                          onPress={() =>
                            handleChangeRole(m, m.role === "editor" ? "viewer" : "editor")
                          }
                          hitSlop={8}
                          style={styles.actionBtn}
                        >
                          <Ionicons name="swap-horizontal" size={18} color={colors.accent} />
                        </Pressable>
                        <Pressable onPress={() => handleRemove(m)} hitSlop={8} style={styles.actionBtn}>
                          <Ionicons name="close-circle-outline" size={18} color={colors.destructive} />
                        </Pressable>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
            {members.length === 0 && !loading && (
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                Немає учасників
              </Text>
            )}
          </View>
        )}

        <Text style={[styles.sectionLabel, { color: colors.textTertiary, marginTop: 28 }]}>
          Додати учасника
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <View style={styles.addSection}>
            <View style={[styles.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <Ionicons name="mail-outline" size={18} color={colors.textTertiary} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Email користувача"
                placeholderTextColor={colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.roleRow}>
              <Text style={[styles.rolePickerLabel, { color: colors.textSecondary }]}>Роль:</Text>
              {ASSIGNABLE_ROLES.map((r) => {
                const active = selectedRole === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setSelectedRole(r)}
                    style={[
                      styles.roleChip,
                      { backgroundColor: active ? colors.accent : colors.accentBg, borderColor: active ? colors.accent : "transparent" },
                    ]}
                  >
                    <Text style={[styles.roleChipText, { color: active ? colors.white : colors.text }]}>
                      {ROLE_LABELS[r]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              style={[styles.addBtn, { backgroundColor: colors.accent, opacity: adding ? 0.7 : 1 }]}
              onPress={handleAdd}
              disabled={adding}
            >
              {adding ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons name="person-add" size={18} color={colors.white} />
                  <Text style={styles.addBtnText}>Додати</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 70 },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: { fontSize: 16, fontWeight: "700" },
  memberInfo: { flex: 1, gap: 4 },
  memberEmail: { fontSize: 15, fontWeight: "500" },
  roleBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roleText: { fontSize: 12, fontWeight: "600" },
  memberActions: { flexDirection: "row", gap: 8 },
  actionBtn: { padding: 6 },
  emptyText: { padding: 20, textAlign: "center", fontSize: 15 },
  addSection: { padding: 16, gap: 12 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 46,
  },
  input: { flex: 1, fontSize: 15 },
  roleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  rolePickerLabel: { fontSize: 14, fontWeight: "500" },
  roleChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  roleChipText: { fontSize: 14, fontWeight: "600" },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 46,
    borderRadius: 12,
    gap: 8,
  },
  addBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
