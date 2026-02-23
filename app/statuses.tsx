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
import { useAppTheme } from "../src/theme";

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
  const { colors } = useAppTheme();
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
    <View style={[styles.safe, { backgroundColor: colors.bg }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 68, paddingBottom: insets.bottom + 20 },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Стандартні статуси
        </Text>
        {BUILTIN_STATUSES.map((s) => (
          <View
            key={s.id}
            style={[styles.statusRow, { borderBottomColor: colors.border }]}
          >
            <View style={[styles.dot, { backgroundColor: s.color }]} />
            <Text style={[styles.statusLabel, { color: colors.text }]}>
              {s.label}
            </Text>
          </View>
        ))}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Кастомні статуси
          </Text>
          {!adding && (
            <Pressable
              onPress={() => setAdding(true)}
              style={styles.addIconBtn}
            >
              <Ionicons name="add-circle" size={28} color={colors.accent} />
            </Pressable>
          )}
        </View>

        {customStatuses.length === 0 && !adding && (
          <Text style={[styles.empty, { color: colors.textTertiary }]}>
            Ще немає кастомних статусів.
          </Text>
        )}

        {customStatuses.map((s) => (
          <View
            key={s.id}
            style={[styles.statusRow, { borderBottomColor: colors.border }]}
          >
            <View style={[styles.dot, { backgroundColor: s.color }]} />
            <Text style={[styles.statusLabel, { flex: 1, color: colors.text }]}>
              {s.label}
            </Text>
            <Pressable onPress={() => handleDelete(s)} hitSlop={8}>
              <Ionicons
                name="trash-outline"
                size={20}
                color={colors.destructive}
              />
            </Pressable>
          </View>
        ))}

        {adding && (
          <View
            style={[
              styles.addForm,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.formLabel, { color: colors.text }]}>
              Назва
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="наприклад: Імплант, Брекети"
              value={newLabel}
              onChangeText={setNewLabel}
              placeholderTextColor={colors.textTertiary}
              autoFocus
            />

            <Text style={[styles.formLabel, { color: colors.text }]}>
              Колір
            </Text>
            <View style={styles.colorGrid}>
              {PRESET_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setNewColor(c)}
                  style={[
                    styles.colorOption,
                    { backgroundColor: c },
                    newColor === c && styles.colorOptionSelected,
                    newColor === c && { borderColor: colors.text },
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
                <Text
                  style={[
                    styles.cancelBtnText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Скасувати
                </Text>
              </Pressable>
              <Pressable
                onPress={handleAdd}
                style={({ pressed }) => [
                  styles.saveBtn,
                  { backgroundColor: colors.accent },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.saveBtnText, { color: colors.white }]}>
                  Додати
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 17,
    lineHeight: 28,
    fontWeight: "700",
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  statusLabel: {
    fontSize: 15,
  },
  empty: {
    fontSize: 14,
    paddingVertical: 12,
  },
  addIconBtn: {
    marginBottom: 12,
  },
  addForm: {
    marginTop: 16,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    fontSize: 16,
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
    borderWidth: 3,
  },
  formActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  cancelBtnText: { fontSize: 15 },
  saveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  pressed: { opacity: 0.85 },
  saveBtnText: { fontSize: 15, fontWeight: "600" },
});
