import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import {
  loadData,
  addCustomStatus,
  deleteCustomStatus,
} from "../src/store/teethStore";
import { STATUS_LABELS, STATUS_BORDER_COLORS } from "../src/types";
import type { CustomStatus } from "../src/types";

const PRESET_COLORS = [
  "#E91E63",
  "#FF5722",
  "#FF9800",
  "#FFC107",
  "#8BC34A",
  "#4CAF50",
  "#009688",
  "#00BCD4",
  "#2196F3",
  "#3F51B5",
  "#673AB7",
  "#9C27B0",
  "#795548",
  "#607D8B",
  "#F44336",
  "#1E88E5",
];

const BUILTIN_STATUSES = Object.entries(STATUS_LABELS).map(([id, label]) => ({
  id,
  label,
  color: STATUS_BORDER_COLORS[id],
}));

export default function ManageStatusesScreen() {
  const insets = useSafeAreaInsets();
  const [customStatuses, setCustomStatuses] = useState<CustomStatus[]>([]);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);

  const refresh = useCallback(async () => {
    const data = await loadData();
    setCustomStatuses(data.customStatuses);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const handleAdd = async () => {
    const label = newLabel.trim();
    if (!label) {
      Alert.alert("Введіть назву статусу");
      return;
    }
    await addCustomStatus({ label, color: newColor });
    setNewLabel("");
    setNewColor(PRESET_COLORS[0]);
    setAdding(false);
    refresh();
  };

  const handleDelete = (status: CustomStatus) => {
    Alert.alert("Видалити статус?", `"${status.label}"`, [
      { text: "Скасувати", style: "cancel" },
      {
        text: "Видалити",
        style: "destructive",
        onPress: async () => {
          await deleteCustomStatus(status.id);
          refresh();
        },
      },
    ]);
  };

  return (
    <View style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 56, paddingBottom: insets.bottom + 20 },
        ]}
      >
        <Text style={styles.sectionTitle}>Стандартні статуси</Text>
        {BUILTIN_STATUSES.map((s) => (
          <View key={s.id} style={styles.statusRow}>
            <View style={[styles.dot, { backgroundColor: s.color }]} />
            <Text style={styles.statusLabel}>{s.label}</Text>
          </View>
        ))}

        <View style={styles.divider} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Кастомні статуси</Text>
          {!adding && (
            <Pressable
              onPress={() => setAdding(true)}
              style={styles.addIconBtn}
            >
              <Ionicons name="add-circle" size={28} color="#2d5a4a" />
            </Pressable>
          )}
        </View>

        {customStatuses.length === 0 && !adding && (
          <Text style={styles.empty}>Ще немає кастомних статусів.</Text>
        )}

        {customStatuses.map((s) => (
          <View key={s.id} style={styles.statusRow}>
            <View style={[styles.dot, { backgroundColor: s.color }]} />
            <Text style={[styles.statusLabel, { flex: 1 }]}>{s.label}</Text>
            <Pressable onPress={() => handleDelete(s)} hitSlop={8}>
              <Ionicons name="trash-outline" size={20} color="#a04040" />
            </Pressable>
          </View>
        ))}

        {adding && (
          <View style={styles.addForm}>
            <Text style={styles.formLabel}>Назва</Text>
            <TextInput
              style={styles.input}
              placeholder="наприклад: Імплант, Брекети"
              value={newLabel}
              onChangeText={setNewLabel}
              placeholderTextColor="#999"
              autoFocus
            />

            <Text style={styles.formLabel}>Колір</Text>
            <View style={styles.colorGrid}>
              {PRESET_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setNewColor(c)}
                  style={[
                    styles.colorOption,
                    { backgroundColor: c },
                    newColor === c && styles.colorOptionSelected,
                  ]}
                />
              ))}
            </View>

            <View style={styles.formActions}>
              <Pressable
                onPress={() => {
                  setAdding(false);
                  setNewLabel("");
                }}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Скасувати</Text>
              </Pressable>
              <Pressable
                onPress={handleAdd}
                style={({ pressed }) => [
                  styles.saveBtn,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.saveBtnText}>Додати</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f0f5f2" },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1a3d32",
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#d0dcd6",
    marginVertical: 20,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e0e8e4",
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  statusLabel: {
    fontSize: 15,
    color: "#1a3d32",
  },
  empty: {
    color: "#7a9a8a",
    fontSize: 14,
    paddingVertical: 12,
  },
  addIconBtn: {
    marginBottom: 12,
  },
  addForm: {
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#d0dcd6",
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a3d32",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 14,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fafafa",
    marginBottom: 16,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorOptionSelected: {
    borderColor: "#1a3d32",
    borderWidth: 3,
  },
  formActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  cancelBtnText: { fontSize: 15, color: "#5a7a6a" },
  saveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#2d5a4a",
    borderRadius: 14,
  },
  pressed: { opacity: 0.85 },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
