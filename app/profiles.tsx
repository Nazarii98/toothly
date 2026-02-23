import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  Share,
  ActivityIndicator,
} from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { GlassModal } from "../src/components/GlassModal";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import {
  getProfiles,
  getCurrentProfileId,
  setCurrentProfileId,
  addProfile,
  updateProfile,
  deleteProfile,
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
  const [exportPassword, setExportPassword] = useState("");
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const refresh = useCallback(async () => {
    const [list, id] = await Promise.all([
      getProfiles(),
      getCurrentProfileId(),
    ]);
    setProfiles(list);
    setCurrentId(id);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const handleSelectProfile = async (id: string) => {
    if (id === currentId) return;
    await setCurrentProfileId(id);
    clearDataCache();
    setCurrentId(id);
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
    if (profiles.length <= 1) {
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

  const handleExportOpen = () => {
    setExportPassword("");
    setExportModalVisible(true);
  };

  const handleExport = async () => {
    if (!currentId) return;
    const profile = profiles.find((p) => p.id === currentId);
    if (!profile) return;
    setExporting(true);
    try {
      const data = await loadDataForProfile(currentId);
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
    <>
      <Stack.Screen
        options={{
          title: "Профіль",
        }}
      />
      <ScrollView
        style={[styles.scroll, { backgroundColor: colors.bg }]}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 68 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.hint, { color: colors.textTertiary }]}>
          Оберіть людину, чиї записи ви переглядаєте. Можна експортувати та
          імпортувати профіль разом з усіма даними.
        </Text>
        <View style={styles.profileList}>
          {profiles.map((p) => {
            const isActive = currentId === p.id;
            const initial = (p.name[0] ?? "?").toUpperCase();

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
                        { backgroundColor: colors.inputBg, color: colors.text },
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
                  { backgroundColor: colors.card, shadowColor: colors.shadow },
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
                    isActive ? styles.avatarActive : styles.avatarInactive,
                    {
                      backgroundColor: isActive ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.avatarText,
                      { color: colors.textSecondary },
                      isActive && styles.avatarTextActive,
                      isActive && { color: colors.white },
                    ]}
                  >
                    {initial}
                  </Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text
                    style={[
                      styles.profileName,
                      { color: colors.text },
                      isActive && styles.profileNameActive,
                    ]}
                  >
                    {p.name}
                  </Text>
                  {isActive && (
                    <Text
                      style={[
                        styles.activeLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Активний профіль
                    </Text>
                  )}
                </View>
                {isActive && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={colors.accent}
                  />
                )}
                {!isActive && profiles.length > 1 && (
                  <View style={styles.profileActions}>
                    <Pressable
                      onPress={() => {
                        setEditingId(p.id);
                        setEditName(p.name);
                      }}
                      style={styles.iconBtn}
                      hitSlop={8}
                    >
                      <Ionicons
                        name="pencil-outline"
                        size={16}
                        color={colors.textTertiary}
                      />
                    </Pressable>
                    <Pressable
                      onPress={() => handleDeleteProfile(p)}
                      style={styles.iconBtn}
                      hitSlop={8}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color={colors.destructive}
                      />
                    </Pressable>
                  </View>
                )}
                {isActive && profiles.length > 1 && (
                  <Pressable
                    onPress={() => {
                      setEditingId(p.id);
                      setEditName(p.name);
                    }}
                    style={[styles.iconBtn, { marginLeft: 4 }]}
                    hitSlop={8}
                  >
                    <Ionicons
                      name="pencil-outline"
                      size={16}
                      color={colors.textSecondary}
                    />
                  </Pressable>
                )}
              </Pressable>
            );
          })}
        </View>

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
              style={[styles.addConfirmBtn, { backgroundColor: colors.accent }]}
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
          <Pressable
            style={[styles.addProfileBtn, { backgroundColor: colors.accent }]}
            onPress={() => setAdding(true)}
          >
            <Ionicons name="add" size={20} color={colors.white} />
            <Text style={[styles.addProfileBtnText, { color: colors.white }]}>
              Додати профіль
            </Text>
          </Pressable>
        )}

        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
          Експорт та імпорт
        </Text>
        <View
          style={[
            styles.actionCard,
            { backgroundColor: colors.card, shadowColor: colors.shadow },
          ]}
        >
          <Pressable
            style={[styles.actionRow, { borderBottomColor: colors.border }]}
            onPress={handleExportOpen}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Ionicons name="share-outline" size={22} color={colors.accent} />
            )}
            <View style={styles.actionRowTextWrap}>
              <Text style={[styles.actionRowText, { color: colors.text }]}>
                Експортувати поточний профіль
              </Text>
              <Text
                style={[styles.actionRowHint, { color: colors.textTertiary }]}
              >
                Усі дані, кастомні статуси та процедури
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.chevron} />
          </Pressable>
          <Pressable
            style={[styles.actionRow, styles.actionRowLast]}
            onPress={() => setImportVisible(true)}
          >
            <Ionicons
              name="document-attach-outline"
              size={22}
              color={colors.accent}
            />
            <View style={styles.actionRowTextWrap}>
              <Text style={[styles.actionRowText, { color: colors.text }]}>
                Імпортувати профіль
              </Text>
              <Text
                style={[styles.actionRowHint, { color: colors.textTertiary }]}
              >
                Вставте JSON з експорту
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.chevron} />
          </Pressable>
        </View>
      </ScrollView>

      <GlassModal
        visible={exportModalVisible}
        onClose={() => setExportModalVisible(false)}
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
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  hint: {
    fontSize: 14,
    color: "#6a7a70",
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8a9a90",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 10,
  },
  profileList: {
    gap: 10,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 14,
    gap: 14,
    shadowColor: "#1a3d32",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileCardActive: {
    backgroundColor: "#eef5f1",
    borderWidth: 1.5,
    borderColor: "#2d5a4a",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarActive: {
    backgroundColor: "#2d5a4a",
  },
  avatarInactive: {
    backgroundColor: "#e0e8e4",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#5a7a6a",
  },
  avatarTextActive: {
    color: "#fff",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "600",
  },
  profileNameActive: {
    fontWeight: "700",
  },
  activeLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  profileActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  iconBtn: {
    padding: 8,
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
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    marginTop: 10,
    borderRadius: 16,
  },
  addProfileBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  actionCard: {
    borderRadius: 20,
    padding: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionRowLast: { borderBottomWidth: 0 },
  actionRowTextWrap: { flex: 1 },
  actionRowText: {
    fontSize: 16,
    fontWeight: "600",
  },
  actionRowHint: {
    fontSize: 12,
    marginTop: 2,
  },
  modalCardPadded: {
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a3d32",
    marginBottom: 4,
  },
  modalHint: {
    fontSize: 13,
    color: "#6a7a70",
    marginBottom: 12,
  },
  importFileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#eef5f1",
    borderRadius: 16,
    marginBottom: 12,
  },
  importFileBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2d5a4a",
  },
  passwordInput: {
    backgroundColor: "#f5f8f6",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#1a3d32",
    marginBottom: 16,
  },
  importInput: {
    backgroundColor: "#f5f8f6",
    borderRadius: 16,
    padding: 12,
    fontSize: 13,
    color: "#1a3d32",
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
    color: "#6a7a70",
  },
  modalBtnPrimary: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#2d5a4a",
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
