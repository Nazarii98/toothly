import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  Modal,
  Share,
  ActivityIndicator,
} from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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
    } catch (e) {
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
          headerBackTitle: "Назад",
        }}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 68 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.hint}>
          Оберіть людину, чиї записи ви переглядаєте. Можна експортувати та
          імпортувати профіль разом з усіма даними.
        </Text>
        <View style={styles.card}>
          {profiles.map((p) => (
            <View key={p.id} style={styles.profileRow}>
              {editingId === p.id ? (
                <View style={styles.editRow}>
                  <TextInput
                    style={styles.editInput}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Ім'я профілю"
                    placeholderTextColor="#8a9a90"
                    autoFocus
                  />
                  <Pressable onPress={handleSaveEdit} style={styles.editBtn}>
                    <Ionicons name="checkmark" size={22} color="#2d5a4a" />
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setEditingId(null);
                      setEditName("");
                    }}
                    style={styles.editBtn}
                  >
                    <Ionicons name="close" size={22} color="#6a7a70" />
                  </Pressable>
                </View>
              ) : (
                <>
                  <Pressable
                    style={styles.profileMain}
                    onPress={() => handleSelectProfile(p.id)}
                  >
                    <View style={styles.profileInfo}>
                      <Text style={styles.profileName}>{p.name}</Text>
                      {currentId === p.id && (
                        <View style={styles.currentBadge}>
                          <Ionicons
                            name="checkmark-circle"
                            size={18}
                            color="#2d5a4a"
                          />
                          <Text style={styles.currentBadgeText}>Обрано</Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                  {profiles.length > 1 && (
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
                          size={18}
                          color="#5a7a6a"
                        />
                      </Pressable>
                      <Pressable
                        onPress={() => handleDeleteProfile(p)}
                        style={styles.iconBtn}
                        hitSlop={8}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color="#a04040"
                        />
                      </Pressable>
                    </View>
                  )}
                </>
              )}
            </View>
          ))}
          {adding ? (
            <View style={styles.addRow}>
              <TextInput
                style={styles.addInput}
                value={newName}
                onChangeText={setNewName}
                placeholder="Ім'я профілю"
                placeholderTextColor="#8a9a90"
                autoFocus
              />
              <Pressable
                onPress={handleAddProfile}
                style={styles.addConfirmBtn}
              >
                <Text style={styles.addConfirmText}>Додати</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setAdding(false);
                  setNewName("");
                }}
                style={styles.addCancelBtn}
              >
                <Ionicons name="close" size={22} color="#6a7a70" />
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={styles.addProfileBtn}
              onPress={() => setAdding(true)}
            >
              <Ionicons name="add-circle-outline" size={22} color="#2d5a4a" />
              <Text style={styles.addProfileBtnText}>Додати профіль</Text>
            </Pressable>
          )}
        </View>

        <Text style={styles.sectionLabel}>Експорт та імпорт</Text>
        <View style={styles.card}>
          <Pressable
            style={styles.actionRow}
            onPress={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator size="small" color="#2d5a4a" />
            ) : (
              <Ionicons name="share-outline" size={22} color="#2d5a4a" />
            )}
            <View style={styles.actionRowTextWrap}>
              <Text style={styles.actionRowText}>
                Експортувати поточний профіль
              </Text>
              <Text style={styles.actionRowHint}>
                Усі дані, кастомні статуси та процедури
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#8a9a90" />
          </Pressable>
          <Pressable
            style={[styles.actionRow, styles.actionRowLast]}
            onPress={() => setImportVisible(true)}
          >
            <Ionicons
              name="document-attach-outline"
              size={22}
              color="#2d5a4a"
            />
            <View style={styles.actionRowTextWrap}>
              <Text style={styles.actionRowText}>Імпортувати профіль</Text>
              <Text style={styles.actionRowHint}>Вставте JSON з експорту</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#8a9a90" />
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={importVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setImportVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Імпорт профілю</Text>
            <Text style={styles.modalHint}>
              Вставте JSON з експорту або оберіть файл
            </Text>
            <Pressable style={styles.importFileBtn} onPress={handlePickFile}>
              <Ionicons name="document-outline" size={20} color="#2d5a4a" />
              <Text style={styles.importFileBtnText}>Обрати JSON-файл</Text>
            </Pressable>
            <TextInput
              style={styles.importInput}
              value={importJson}
              onChangeText={setImportJson}
              placeholder='{"version":1,"profileName":"...","data":{...}}'
              placeholderTextColor="#8a9a90"
              multiline
              numberOfLines={8}
            />
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalBtnSecondary}
                onPress={() => {
                  setImportVisible(false);
                  setImportJson("");
                }}
              >
                <Text style={styles.modalBtnSecondaryText}>Скасувати</Text>
              </Pressable>
              <Pressable
                style={styles.modalBtnPrimary}
                onPress={handleImportApply}
                disabled={importing || !importJson.trim()}
              >
                {importing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalBtnPrimaryText}>Імпортувати</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#f2f6f4" },
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
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 4,
    shadowColor: "#1a3d32",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e8ece8",
  },
  profileMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  profileInfo: { flex: 1 },
  profileName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a3d32",
  },
  currentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  currentBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2d5a4a",
  },
  profileActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  iconBtn: { padding: 6 },
  editRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editInput: {
    flex: 1,
    backgroundColor: "#f5f8f6",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: "#1a3d32",
  },
  editBtn: { padding: 4 },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  addInput: {
    flex: 1,
    backgroundColor: "#f5f8f6",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: "#1a3d32",
  },
  addConfirmBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#2d5a4a",
    borderRadius: 10,
  },
  addConfirmText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  addCancelBtn: { padding: 4 },
  addProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  addProfileBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2d5a4a",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e8ece8",
  },
  actionRowLast: { borderBottomWidth: 0 },
  actionRowTextWrap: { flex: 1 },
  actionRowText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a3d32",
  },
  actionRowHint: {
    fontSize: 12,
    color: "#8a9a90",
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
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
    borderRadius: 12,
    marginBottom: 12,
  },
  importFileBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2d5a4a",
  },
  importInput: {
    backgroundColor: "#f5f8f6",
    borderRadius: 12,
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
    borderRadius: 12,
    minWidth: 120,
    alignItems: "center",
  },
  modalBtnPrimaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
