import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import {
  getProfiles,
  getCurrentProfileId,
  setCurrentProfileId,
  addProfile,
  updateProfile,
  deleteProfile,
  type Profile,
} from "../../src/store/profileStore";
import { clearDataCache } from "../../src/store/teethStore";

export default function SettingsScreen() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

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

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Профіль</Text>
          <Text style={styles.sectionHint}>
            Оберіть людину, чиї записи ви переглядаєте
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
                    <Pressable
                      onPress={handleSaveEdit}
                      style={styles.editBtn}
                    >
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
                            <Text style={styles.currentBadgeText}>
                              Обрано
                            </Text>
                          </View>
                        )}
                      </View>
                      {currentId !== p.id && (
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color="#8a9a90"
                        />
                      )}
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f2f6f4" },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  section: {},
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a3d32",
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 14,
    color: "#6a7a70",
    marginBottom: 16,
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
  profileActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
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
});
