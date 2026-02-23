import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Animated,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  Share,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Keyboard,
} from "react-native";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { GlassModal } from "../src/components/GlassModal";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStableHeaderHeight } from "../src/hooks/useStableHeaderHeight";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import {
  getProfiles,
  getCurrentProfileId,
  setCurrentProfileId,
  addProfile,
  updateProfile,
  deleteProfile,
  invalidateProfileCache,
  type Profile,
} from "../src/store/profileStore";
import {
  clearDataCache,
  loadDataForProfile,
  saveDataForProfile,
} from "../src/store/teethStore";
import type { AppData, ExportedProfile } from "../src/types";
import {
  encryptProfileJson,
  decryptProfileJson,
  isEncryptedPayload,
} from "../src/utils/profileCrypto";
import { useAppTheme } from "../src/theme";
import { useDataSync } from "../src/DataSyncProvider";

const EXPORT_VERSION = 1;

function normalizeAppData(raw: unknown): AppData | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!o.teeth || typeof o.teeth !== "object") return null;
  if (!Array.isArray(o.globalProcedures)) return null;
  if (!Array.isArray(o.customStatuses)) return null;
  return {
    teeth: o.teeth as AppData["teeth"],
    globalProcedures: o.globalProcedures as AppData["globalProcedures"],
    customStatuses: o.customStatuses as AppData["customStatuses"],
  };
}

function parseExportedProfile(json: string): ExportedProfile | null {
  try {
    const raw = JSON.parse(json) as unknown;
    if (!raw || typeof raw !== "object") return null;
    const o = raw as Record<string, unknown>;
    if (o.version !== EXPORT_VERSION) return null;
    if (typeof o.profileName !== "string") return null;
    if (typeof o.exportedAt !== "string") return null;
    const data = normalizeAppData(o.data);
    if (!data) return null;
    return {
      version: o.version as number,
      profileName: o.profileName,
      exportedAt: o.exportedAt,
      data,
    };
  } catch {
    return null;
  }
}

export default function ProfilesScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useStableHeaderHeight();
  const { profilesRevision, resubscribe } = useDataSync();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [importVisible, setImportVisible] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [importPassword, setImportPassword] = useState("");
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportProfileId, setExportProfileId] = useState<string | null>(null);
  const [exportPassword, setExportPassword] = useState("");
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const kbAnim = useRef(new Animated.Value(0)).current;
  const kbOpen = useRef(false);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        kbOpen.current = true;
        Animated.timing(kbAnim, {
          toValue: e.endCoordinates.height,
          duration: e.duration ?? 250,
          useNativeDriver: false,
        }).start();
      },
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      (e) => {
        kbOpen.current = false;
        Animated.timing(kbAnim, {
          toValue: 0,
          duration: e.duration ?? 250,
          useNativeDriver: false,
        }).start();
      },
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, [kbAnim]);

  const refresh = useCallback(async () => {
    const [list, id] = await Promise.all([
      getProfiles(),
      getCurrentProfileId(),
    ]);
    setProfiles(list);
    setCurrentId(id);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    invalidateProfileCache();
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  useEffect(() => {
    if (profilesRevision > 0) {
      invalidateProfileCache();
      refresh();
    }
  }, [profilesRevision]);

  const handleSelectProfile = async (id: string) => {
    if (id === currentId) return;
    await setCurrentProfileId(id);
    clearDataCache();
    setCurrentId(id);
    resubscribe();
  };

  const handleAddProfile = async () => {
    const name = newName.trim();
    if (!name) return;
    await addProfile(name);
    setNewName("");
    setAdding(false);
    refresh();
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) {
      setEditingId(null);
      setEditName("");
      return;
    }
    await updateProfile(editingId, editName.trim());
    setEditingId(null);
    setEditName("");
    refresh();
  };

  const handleDeleteProfile = (profile: Profile) => {
    if (profile.role && profile.role !== "owner") {
      Alert.alert("Помилка", "Ви не можете видалити чужий профіль.");
      return;
    }
    if (profiles.filter((p) => p.role === "owner" || !p.role).length <= 1) {
      Alert.alert("Помилка", "Повинен залишитися хоча б один профіль.");
      return;
    }
    Alert.alert(
      "Видалити профіль?",
      `"${profile.name}" та всі його дані будуть видалені. Цю дію не можна скасувати.`,
      [
        { text: "Скасувати", style: "cancel" },
        {
          text: "Видалити",
          style: "destructive",
          onPress: async () => {
            await deleteProfile(profile.id);
            clearDataCache();
            refresh();
          },
        },
      ],
    );
  };

  const handleExportOpen = (profileId: string) => {
    setExportProfileId(profileId);
    setExportPassword("");
    setExportModalVisible(true);
  };

  const handleExport = async () => {
    if (!exportProfileId) return;
    const profile = profiles.find((p) => p.id === exportProfileId);
    if (!profile) return;
    setExporting(true);
    try {
      const data = await loadDataForProfile(exportProfileId);
      const payload: ExportedProfile = {
        version: EXPORT_VERSION,
        profileName: profile.name,
        exportedAt: new Date().toISOString(),
        data,
      };
      const json = JSON.stringify(payload, null, 2);
      const password = exportPassword.trim();
      let message: string;
      let title: string;
      if (password) {
        const cipher = encryptProfileJson(json, password);
        message = JSON.stringify({ version: 1, encrypted: true, cipher });
        title = `Профіль: ${profile.name} (зашифровано)`;
      } else {
        message = json;
        title = `Профіль: ${profile.name}`;
      }
      await Share.share({ message, title });
      setExportModalVisible(false);
      setExportProfileId(null);
      setExportPassword("");
    } catch {
      Alert.alert("Помилка", "Не вдалося експортувати профіль.");
    } finally {
      setExporting(false);
    }
  };

  const handleImportApply = async () => {
    const raw = importJson.trim();
    let json: string;
    if (isEncryptedPayload(raw)) {
      const password = importPassword.trim();
      if (!password) {
        Alert.alert("Помилка", "Введіть пароль для розшифровки.");
        return;
      }
      try {
        const parsed = JSON.parse(raw) as { cipher: string };
        const decrypted = decryptProfileJson(parsed.cipher, password);
        if (!decrypted) {
          Alert.alert("Помилка", "Невірний пароль або пошкоджені дані.");
          return;
        }
        json = decrypted;
      } catch {
        Alert.alert("Помилка", "Невірний формат зашифрованого файлу.");
        return;
      }
    } else {
      json = raw;
    }
    const payload = parseExportedProfile(json);
    if (!payload) {
      Alert.alert(
        "Помилка",
        "Невірний формат даних. Вставте JSON експортованого профілю.",
      );
      return;
    }
    setImporting(true);
    try {
      const profile = await addProfile(
        payload.profileName || "Імпортований профіль",
      );
      await saveDataForProfile(profile.id, payload.data);
      setImportVisible(false);
      setImportJson("");
      setImportPassword("");
      refresh();
      Alert.alert("Готово", `Профіль "${profile.name}" імпортовано.`);
    } catch {
      Alert.alert("Помилка", "Не вдалося імпортувати профіль.");
    } finally {
      setImporting(false);
    }
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const uri = result.assets[0].uri;
      const json = await FileSystem.readAsStringAsync(uri);
      setImportJson(json);
    } catch {
      Alert.alert("Помилка", "Не вдалося відкрити файл.");
    }
  };

  return (
    <View style={[styles.screenRoot, { backgroundColor: colors.bg }]}>
      <Stack.Screen
        options={{
          title: "Профіль",
        }}
      />
      <Animated.View
        style={[
          styles.screenWrap,
          {
            marginBottom: kbAnim,
          },
        ]}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingTop: headerHeight + 12 },
          ]}
          scrollIndicatorInsets={{ top: headerHeight + 12 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.isDark ? colors.text : colors.textSecondary}
              progressViewOffset={Platform.OS === "android" ? headerHeight : 0}
            />
          }
        >
          <Text style={[styles.hint, { color: colors.textTertiary }]}>
            Оберіть профіль для перегляду. Керуйте доступом, експортом та
            редагуванням кожного профілю окремо.
          </Text>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
            Мої профілі
          </Text>
          <View style={styles.profileList}>
            {profiles
              .filter((pr) => !pr.role || pr.role === "owner")
              .map((p) => {
                const isActive = currentId === p.id;
                const initial = (p.name[0] ?? "?").toUpperCase();
                const isOwner = !p.role || p.role === "owner";
                const canExport = isOwner || p.role === "editor";

                if (editingId === p.id) {
                  return (
                    <View
                      key={p.id}
                      style={[
                        styles.profileCard,
                        {
                          backgroundColor: colors.card,
                          shadowColor: colors.shadow,
                        },
                      ]}
                    >
                      <View style={styles.editRow}>
                        <TextInput
                          style={[
                            styles.editInput,
                            {
                              backgroundColor: colors.inputBg,
                              color: colors.text,
                            },
                          ]}
                          value={editName}
                          onChangeText={setEditName}
                          placeholder="Ім'я профілю"
                          placeholderTextColor={colors.textTertiary}
                          autoFocus
                        />
                        <Pressable
                          onPress={handleSaveEdit}
                          style={[
                            styles.editConfirm,
                            { backgroundColor: colors.accent },
                          ]}
                        >
                          <Ionicons
                            name="checkmark"
                            size={20}
                            color={colors.white}
                          />
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            setEditingId(null);
                            setEditName("");
                          }}
                          style={[
                            styles.editCancel,
                            { backgroundColor: colors.border },
                          ]}
                        >
                          <Ionicons
                            name="close"
                            size={20}
                            color={colors.textTertiary}
                          />
                        </Pressable>
                      </View>
                    </View>
                  );
                }

                return (
                  <Pressable
                    key={p.id}
                    style={[
                      styles.profileCard,
                      {
                        backgroundColor: colors.card,
                        shadowColor: colors.shadow,
                      },
                      isActive && styles.profileCardActive,
                      isActive && {
                        backgroundColor: colors.accentBg,
                        borderColor: colors.accent,
                      },
                    ]}
                    onPress={() => handleSelectProfile(p.id)}
                  >
                    <View
                      style={[
                        styles.avatar,
                        {
                          backgroundColor: isActive
                            ? colors.accent
                            : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.avatarText,
                          {
                            color: isActive
                              ? colors.white
                              : colors.textSecondary,
                          },
                        ]}
                      >
                        {initial}
                      </Text>
                    </View>
                    <View style={styles.profileInfo}>
                      <View style={styles.nameRow}>
                        <Text
                          style={[
                            styles.profileName,
                            { color: colors.text },
                            isActive && styles.profileNameActive,
                          ]}
                          numberOfLines={1}
                        >
                          {p.name}
                        </Text>
                        {p.role && p.role !== "owner" && (
                          <View
                            style={[
                              styles.roleBadge,
                              {
                                backgroundColor:
                                  (p.role === "editor"
                                    ? "#FF9800"
                                    : colors.textTertiary) + "18",
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.roleBadgeText,
                                {
                                  color:
                                    p.role === "editor"
                                      ? "#FF9800"
                                      : colors.textTertiary,
                                },
                              ]}
                            >
                              {p.role === "editor" ? "Редактор" : "Переглядач"}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={styles.cardActions}>
                      {isOwner && (
                        <Pressable
                          onPress={() => {
                            setEditingId(p.id);
                            setEditName(p.name);
                          }}
                          style={[
                            styles.cardActionBtn,
                            { backgroundColor: colors.accentBg },
                          ]}
                        >
                          <Ionicons
                            name="pencil-outline"
                            size={17}
                            color={colors.textSecondary}
                          />
                        </Pressable>
                      )}
                      {canExport && (
                        <Pressable
                          onPress={() => handleExportOpen(p.id)}
                          style={[
                            styles.cardActionBtn,
                            { backgroundColor: colors.accentBg },
                          ]}
                        >
                          <Ionicons
                            name="share-outline"
                            size={17}
                            color={colors.accent}
                          />
                        </Pressable>
                      )}
                      {isOwner && (
                        <Pressable
                          onPress={() =>
                            router.push(
                              `/profile-access?profileId=${p.id}&profileName=${encodeURIComponent(p.name)}`,
                            )
                          }
                          style={[
                            styles.cardActionBtn,
                            { backgroundColor: colors.accentBg },
                          ]}
                        >
                          <Ionicons
                            name="people-outline"
                            size={17}
                            color={colors.accent}
                          />
                        </Pressable>
                      )}
                      {isOwner &&
                        profiles.filter((pr) => !pr.role || pr.role === "owner")
                          .length > 1 && (
                          <Pressable
                            onPress={() => handleDeleteProfile(p)}
                            style={[
                              styles.cardActionBtn,
                              { backgroundColor: colors.destructive + "10" },
                            ]}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={17}
                              color={colors.destructive}
                            />
                          </Pressable>
                        )}
                    </View>
                  </Pressable>
                );
              })}
          </View>

          {profiles.some((p) => p.role && p.role !== "owner") && (
            <>
              <Text
                style={[
                  styles.sectionLabel,
                  { color: colors.textTertiary, marginTop: 24 },
                ]}
              >
                Спільні профілі
              </Text>
              <View style={styles.profileList}>
                {profiles
                  .filter((pr) => pr.role && pr.role !== "owner")
                  .map((p) => {
                    const isActive = currentId === p.id;
                    const initial = (p.name[0] ?? "?").toUpperCase();
                    const canExport = p.role === "editor";

                    return (
                      <Pressable
                        key={p.id}
                        style={[
                          styles.profileCard,
                          {
                            backgroundColor: colors.card,
                            shadowColor: colors.shadow,
                          },
                          isActive && styles.profileCardActive,
                          isActive && {
                            backgroundColor: colors.accentBg,
                            borderColor: colors.accent,
                          },
                        ]}
                        onPress={() => handleSelectProfile(p.id)}
                      >
                        <View
                          style={[
                            styles.avatar,
                            {
                              backgroundColor: isActive
                                ? colors.accent
                                : colors.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.avatarText,
                              {
                                color: isActive
                                  ? colors.white
                                  : colors.textSecondary,
                              },
                            ]}
                          >
                            {initial}
                          </Text>
                        </View>
                        <View style={styles.profileInfo}>
                          <View style={styles.nameRow}>
                            <Text
                              style={[
                                styles.profileName,
                                { color: colors.text },
                                isActive && styles.profileNameActive,
                              ]}
                              numberOfLines={1}
                            >
                              {p.name}
                            </Text>
                            <View
                              style={[
                                styles.roleBadge,
                                {
                                  backgroundColor:
                                    (p.role === "editor"
                                      ? "#FF9800"
                                      : colors.textTertiary) + "18",
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.roleBadgeText,
                                  {
                                    color:
                                      p.role === "editor"
                                        ? "#FF9800"
                                        : colors.textTertiary,
                                  },
                                ]}
                              >
                                {p.role === "editor"
                                  ? "Редактор"
                                  : "Переглядач"}
                              </Text>
                            </View>
                          </View>
                        </View>
                        {canExport && (
                          <View style={styles.cardActions}>
                            <Pressable
                              onPress={() => handleExportOpen(p.id)}
                              style={[
                                styles.cardActionBtn,
                                { backgroundColor: colors.accentBg },
                              ]}
                            >
                              <Ionicons
                                name="share-outline"
                                size={17}
                                color={colors.accent}
                              />
                            </Pressable>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
              </View>
            </>
          )}
        </ScrollView>

        <View
          style={[
            styles.bottomButtons,
            {
              paddingBottom: insets.bottom + 12,
              borderTopColor: colors.border,
            },
          ]}
        >
          {adding ? (
            <View style={styles.addRow}>
              <TextInput
                style={[
                  styles.addInput,
                  {
                    backgroundColor: colors.card,
                    color: colors.text,
                    shadowColor: colors.shadow,
                  },
                ]}
                value={newName}
                onChangeText={setNewName}
                placeholder="Ім'я нового профілю"
                placeholderTextColor={colors.textTertiary}
                autoFocus
              />
              <Pressable
                onPress={handleAddProfile}
                style={[
                  styles.addConfirmBtn,
                  { backgroundColor: colors.accent },
                ]}
              >
                <Text style={[styles.addConfirmText, { color: colors.white }]}>
                  Додати
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setAdding(false);
                  setNewName("");
                }}
                style={[styles.editCancel, { backgroundColor: colors.border }]}
              >
                <Ionicons name="close" size={20} color={colors.textTertiary} />
              </Pressable>
            </View>
          ) : (
            <View style={styles.bottomRow}>
              <Pressable
                style={[
                  styles.addProfileBtn,
                  { backgroundColor: colors.accent },
                ]}
                onPress={() => setAdding(true)}
              >
                <Ionicons name="add" size={20} color={colors.white} />
                <Text
                  style={[styles.addProfileBtnText, { color: colors.white }]}
                >
                  Додати профіль
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.importBtn,
                  {
                    backgroundColor: colors.card,
                    shadowColor: colors.shadow,
                  },
                ]}
                onPress={() => setImportVisible(true)}
              >
                <Ionicons
                  name="document-attach-outline"
                  size={20}
                  color={colors.accent}
                />
                <Text style={[styles.importBtnText, { color: colors.accent }]}>
                  Імпорт
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </Animated.View>

      <GlassModal
        visible={exportModalVisible}
        onClose={() => {
          setExportModalVisible(false);
          setExportProfileId(null);
        }}
        cardStyle={styles.modalCardPadded}
      >
        <Text style={[styles.modalTitle, { color: colors.text }]}>
          Експорт профілю
        </Text>
        <Text style={[styles.modalHint, { color: colors.textTertiary }]}>
          Введіть пароль, щоб зашифрувати дані. Або залиште порожнім для
          експорту без шифрування.
        </Text>
        <TextInput
          style={[
            styles.passwordInput,
            { backgroundColor: colors.inputBg, color: colors.text },
          ]}
          value={exportPassword}
          onChangeText={setExportPassword}
          placeholder="Пароль (необов'язково)"
          placeholderTextColor={colors.textTertiary}
          secureTextEntry
          autoCapitalize="none"
        />
        <View style={styles.modalActions}>
          <Pressable
            style={styles.modalBtnSecondary}
            onPress={() => {
              setExportModalVisible(false);
              setExportProfileId(null);
              setExportPassword("");
            }}
          >
            <Text
              style={[
                styles.modalBtnSecondaryText,
                { color: colors.textTertiary },
              ]}
            >
              Скасувати
            </Text>
          </Pressable>
          <Pressable
            style={[styles.modalBtnPrimary, { backgroundColor: colors.accent }]}
            onPress={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text
                style={[styles.modalBtnPrimaryText, { color: colors.white }]}
              >
                Експортувати
              </Text>
            )}
          </Pressable>
        </View>
      </GlassModal>

      <GlassModal
        visible={importVisible}
        onClose={() => setImportVisible(false)}
        cardStyle={styles.modalCardPadded}
      >
        <Text style={[styles.modalTitle, { color: colors.text }]}>
          Імпорт профілю
        </Text>
        <Text style={[styles.modalHint, { color: colors.textTertiary }]}>
          Вставте JSON з експорту або оберіть файл
        </Text>
        <Pressable
          style={[styles.importFileBtn, { backgroundColor: colors.accentBg }]}
          onPress={handlePickFile}
        >
          <Ionicons name="document-outline" size={20} color={colors.accent} />
          <Text style={[styles.importFileBtnText, { color: colors.accent }]}>
            Обрати JSON-файл
          </Text>
        </Pressable>
        <TextInput
          style={[
            styles.importInput,
            { backgroundColor: colors.inputBg, color: colors.text },
          ]}
          value={importJson}
          onChangeText={(text) => {
            setImportJson(text);
            setImportPassword("");
          }}
          placeholder='{"version":1,"profileName":"...","data":{...}}'
          placeholderTextColor={colors.textTertiary}
          multiline
          numberOfLines={8}
        />
        {importJson.trim().length > 0 &&
          isEncryptedPayload(importJson.trim()) && (
            <TextInput
              style={[
                styles.passwordInput,
                { backgroundColor: colors.inputBg, color: colors.text },
              ]}
              value={importPassword}
              onChangeText={setImportPassword}
              placeholder="Пароль для розшифровки"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry
              autoCapitalize="none"
            />
          )}
        <View style={styles.modalActions}>
          <Pressable
            style={styles.modalBtnSecondary}
            onPress={() => {
              setImportVisible(false);
              setImportJson("");
              setImportPassword("");
            }}
          >
            <Text
              style={[
                styles.modalBtnSecondaryText,
                { color: colors.textTertiary },
              ]}
            >
              Скасувати
            </Text>
          </Pressable>
          <Pressable
            style={[styles.modalBtnPrimary, { backgroundColor: colors.accent }]}
            onPress={handleImportApply}
            disabled={importing || !importJson.trim()}
          >
            {importing ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text
                style={[styles.modalBtnPrimaryText, { color: colors.white }]}
              >
                Імпортувати
              </Text>
            )}
          </Pressable>
        </View>
      </GlassModal>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  hint: {
    fontSize: 14,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  profileList: {
    gap: 12,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 14,
    gap: 12,
    shadowColor: "#1a3d32",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileCardActive: {
    borderWidth: 1.5,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarActive: {},
  avatarInactive: {},
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
  },
  avatarTextActive: {},
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "600",
    flexShrink: 1,
  },
  profileNameActive: {
    fontWeight: "700",
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  activeLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: "row",
    gap: 6,
  },
  cardActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  editRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editInput: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  editConfirm: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  editCancel: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  screenRoot: {
    flex: 1,
  },
  screenWrap: {
    flex: 1,
  },
  bottomButtons: {
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  bottomRow: {
    flexDirection: "row",
    gap: 10,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addInput: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  addConfirmBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
  },
  addConfirmText: {
    fontSize: 14,
    fontWeight: "600",
  },
  addProfileBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
  },
  addProfileBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  importBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  importBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  modalCardPadded: {
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  modalHint: {
    fontSize: 13,
    marginBottom: 12,
  },
  importFileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 12,
  },
  importFileBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  passwordInput: {
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    marginBottom: 16,
  },
  importInput: {
    borderRadius: 16,
    padding: 12,
    fontSize: 13,
    minHeight: 120,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
  },
  modalBtnSecondary: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  modalBtnSecondaryText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalBtnPrimary: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    minWidth: 120,
    alignItems: "center",
  },
  modalBtnPrimaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
