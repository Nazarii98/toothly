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
import { useStableHeaderHeight } from "../src/hooks/useStableHeaderHeight";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import {
  loadData,
  addCustomStatus,
  deleteCustomStatus,
  addCustomToothCategory,
  deleteCustomToothCategory,
  addCustomGlobalCategory,
  deleteCustomGlobalCategory,
} from "../src/store/teethStore";
import {
  STATUS_LABELS,
  STATUS_BORDER_COLORS,
  TOOTH_CATEGORY_LABELS,
  TOOTH_CATEGORY_BORDER_COLORS,
  GLOBAL_PROCEDURE_TYPES,
  GLOBAL_CATEGORY_BORDER_COLORS,
} from "../src/types";
import type { CustomStatus, CustomCategory } from "../src/types";
import { useAppTheme } from "../src/theme";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useTranslation } from "react-i18next";

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

type SectionKey = "statuses" | "toothCategories" | "globalCategories";

export default function ManageStatusesScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useStableHeaderHeight();

  const [customStatuses, setCustomStatuses] = useState<CustomStatus[]>([]);
  const [customToothCategories, setCustomToothCategories] = useState<
    CustomCategory[]
  >([]);
  const [customGlobalCategories, setCustomGlobalCategories] = useState<
    CustomCategory[]
  >([]);

  const [addingSection, setAddingSection] = useState<SectionKey | null>(null);
  const [formLabel, setFormLabel] = useState("");
  const [formColor, setFormColor] = useState(PRESET_COLORS[0]);

  const refresh = useCallback(async () => {
    const data = await loadData();
    setCustomStatuses(data.customStatuses);
    setCustomToothCategories(data.customToothCategories);
    setCustomGlobalCategories(data.customGlobalCategories);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const openAdd = (section: SectionKey) => {
    setFormLabel("");
    setFormColor(PRESET_COLORS[0]);
    setAddingSection(section);
  };

  const cancelAdd = () => {
    setAddingSection(null);
    setFormLabel("");
  };

  const handleAdd = async () => {
    const label = formLabel.trim();
    if (!label) {
      Alert.alert(t("statuses.enterName"));
      return;
    }
    if (addingSection === "statuses") {
      addCustomStatus({ label, color: formColor }).catch(() => {});
    } else if (addingSection === "toothCategories") {
      addCustomToothCategory({ label, color: formColor }).catch(() => {});
    } else if (addingSection === "globalCategories") {
      addCustomGlobalCategory({ label, color: formColor }).catch(() => {});
    }
    cancelAdd();
    refresh();
  };

  const handleDeleteStatus = (item: CustomStatus) => {
    Alert.alert(t("statuses.deleteTitle"), `"${item.label}"`, [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => {
          deleteCustomStatus(item.id).catch(() => {});
          refresh();
        },
      },
    ]);
  };

  const handleDeleteToothCat = (item: CustomCategory) => {
    Alert.alert(t("statuses.deleteCategory"), `"${item.label}"`, [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => {
          deleteCustomToothCategory(item.id).catch(() => {});
          refresh();
        },
      },
    ]);
  };

  const handleDeleteGlobalCat = (item: CustomCategory) => {
    Alert.alert(t("statuses.deleteCategory"), `"${item.label}"`, [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => {
          deleteCustomGlobalCategory(item.id).catch(() => {});
          refresh();
        },
      },
    ]);
  };

  const renderAddForm = () => (
    <View
      style={[
        styles.addForm,
        { backgroundColor: colors.inputBg, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.formLabel, { color: colors.text }]}>{t("statuses.nameLabel")}</Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
        placeholder={t("statuses.examplePlaceholder")}
        value={formLabel}
        onChangeText={setFormLabel}
        placeholderTextColor={colors.textTertiary}
        autoFocus
        autoCorrect={false}
      />
      <Text style={[styles.formLabel, { color: colors.text }]}>{t("statuses.colorLabelFull")}</Text>
      <View style={styles.colorGrid}>
        {PRESET_COLORS.map((c) => (
          <Pressable
            key={c}
            onPress={() => setFormColor(c)}
            style={[
              styles.colorOption,
              { backgroundColor: c },
              formColor === c && styles.colorOptionSelected,
              formColor === c && { borderColor: colors.text },
            ]}
          />
        ))}
      </View>
      <View style={styles.formActions}>
        <Pressable onPress={cancelAdd} style={styles.cancelBtn}>
          <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
            {t("common.cancel")}
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
            {t("common.add")}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  const renderBuiltinItem = (id: string, label: string, color: string) => (
    <View key={id} style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.rowLabel, { flex: 1, color: colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );

  const renderCustomItem = (
    id: string,
    label: string,
    color: string,
    onDelete: () => void,
  ) => (
    <View key={id} style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.rowLabel, { flex: 1, color: colors.text }]}>
        {label}
      </Text>
      <Pressable onPress={onDelete} hitSlop={8}>
        <Ionicons name="trash-outline" size={20} color={colors.destructive} />
      </Pressable>
    </View>
  );

  return (
    <KeyboardAwareScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={[styles.safe]}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.bg }]}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + 12,
            paddingBottom: insets.bottom + 20,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Section 1: Tooth statuses ── */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, shadowColor: colors.shadow },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("statuses.toothStatuses")}
              </Text>
              <Text
                style={[styles.sectionHint, { color: colors.textTertiary }]}
              >
                {t("statuses.defaultStatuses")}
              </Text>
            </View>
            {addingSection !== "statuses" && (
              <Pressable onPress={() => openAdd("statuses")} hitSlop={8}>
                <Ionicons name="add-circle" size={28} color={colors.accent} />
              </Pressable>
            )}
          </View>
          {Object.entries(STATUS_LABELS).map(([id, label]) =>
            renderBuiltinItem(id, t(`statusLabels.${id}`, { defaultValue: label }), STATUS_BORDER_COLORS[id] ?? "#9E9E9E"),
          )}
          {customStatuses.map((s) =>
            renderCustomItem(s.id, s.label, s.color, () =>
              handleDeleteStatus(s),
            ),
          )}
          {customStatuses.length === 0 && addingSection !== "statuses" && (
            <Text style={[styles.empty, { color: colors.textTertiary }]}>
              {t("statuses.customStatuses")}: —
            </Text>
          )}
          {addingSection === "statuses" && renderAddForm()}
        </View>

        {/* ── Section 2: Tooth record categories ── */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, shadowColor: colors.shadow },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("statuses.toothCategories")}
              </Text>
              <Text
                style={[styles.sectionHint, { color: colors.textTertiary }]}
              >
                {t("statuses.defaultStatuses")}
              </Text>
            </View>
            {addingSection !== "toothCategories" && (
              <Pressable onPress={() => openAdd("toothCategories")} hitSlop={8}>
                <Ionicons name="add-circle" size={28} color={colors.accent} />
              </Pressable>
            )}
          </View>
          {Object.entries(TOOTH_CATEGORY_LABELS).map(([id, label]) =>
            renderBuiltinItem(
              id,
              t(`categoryLabels.${id}`, { defaultValue: label }),
              TOOTH_CATEGORY_BORDER_COLORS[id] ?? "#9E9E9E",
            ),
          )}
          {customToothCategories.map((c) =>
            renderCustomItem(c.id, c.label, c.color, () =>
              handleDeleteToothCat(c),
            ),
          )}
          {customToothCategories.length === 0 &&
            addingSection !== "toothCategories" && (
              <Text style={[styles.empty, { color: colors.textTertiary }]}>
                {t("statuses.customStatuses")}: —
              </Text>
            )}
          {addingSection === "toothCategories" && renderAddForm()}
        </View>

        {/* ── Section 3: Global procedure categories ── */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, shadowColor: colors.shadow },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("statuses.globalCategories")}
              </Text>
              <Text
                style={[styles.sectionHint, { color: colors.textTertiary }]}
              >
                {t("statuses.defaultStatuses")}
              </Text>
            </View>
            {addingSection !== "globalCategories" && (
              <Pressable
                onPress={() => openAdd("globalCategories")}
                hitSlop={8}
              >
                <Ionicons name="add-circle" size={28} color={colors.accent} />
              </Pressable>
            )}
          </View>
          {Object.entries(GLOBAL_PROCEDURE_TYPES).map(([id, label]) =>
            renderBuiltinItem(
              id,
              t(`globalProcedureTypes.${id}`, { defaultValue: label }),
              GLOBAL_CATEGORY_BORDER_COLORS[id] ?? "#9E9E9E",
            ),
          )}
          {customGlobalCategories.map((c) =>
            renderCustomItem(c.id, c.label, c.color, () =>
              handleDeleteGlobalCat(c),
            ),
          )}
          {customGlobalCategories.length === 0 &&
            addingSection !== "globalCategories" && (
              <Text style={[styles.empty, { color: colors.textTertiary }]}>
                {t("statuses.customStatuses")}: —
              </Text>
            )}
          {addingSection === "globalCategories" && renderAddForm()}
        </View>
      </ScrollView>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },

  card: {
    borderRadius: 20,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  sectionHint: {
    fontSize: 12,
  },
  row: {
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
  rowLabel: { fontSize: 15 },
  empty: { fontSize: 13, paddingVertical: 10 },

  addForm: {
    marginTop: 14,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    marginBottom: 14,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 18,
  },
  colorOption: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorOptionSelected: { borderWidth: 3 },
  formActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  cancelBtnText: { fontSize: 14 },
  saveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  pressed: { opacity: 0.85 },
  saveBtnText: { fontSize: 14, fontWeight: "600" },
});
