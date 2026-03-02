import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  Image,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../src/theme";
import { GlassModal } from "../src/components/GlassModal";
import { StatusPickerModal } from "../src/components/StatusPickerModal";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import {
  loadData,
  addToothChange,
  addGlobalProcedure,
} from "../src/store/teethStore";
import {
  ALL_TOOTH_IDS,
  QUADRANT_LABELS,
  TOOTH_NAMES,
  buildToothCategoryMaps,
  buildGlobalCategoryMaps,
} from "../src/types";
import type { ToothChange, ToothId, StatusMaps } from "../src/types";
const GENERAL_KEY = "__general__";

function toothShort(id: ToothId): string {
  return `${id} · ${TOOTH_NAMES[id[1]] ?? ""}`;
}

function toothFull(id: ToothId): string {
  return `${id} — ${TOOTH_NAMES[id[1]] ?? ""} (${QUADRANT_LABELS[id[0]] ?? ""})`;
}

const QUADRANTS = ["1", "2", "3", "4"] as const;

export default function AddRecordModal() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ toothId?: string }>();
  const locked = !!params.toothId;

  const [target, setTarget] = useState<string>(params.toothId ?? GENERAL_KEY);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState<string>("checkup");
  const [procedureType, setProcedureType] = useState<string>("checkup");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [toothCategoryMaps, setToothCategoryMaps] = useState<StatusMaps>(buildToothCategoryMaps());
  const [globalCategoryMaps, setGlobalCategoryMaps] = useState<StatusMaps>(buildGlobalCategoryMaps());
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [globalPickerVisible, setGlobalPickerVisible] = useState(false);

  const isGeneral = target === GENERAL_KEY;

  const currentCategoryColor = isGeneral
    ? (globalCategoryMaps.borderColors[procedureType] ?? "#9E9E9E")
    : (toothCategoryMaps.borderColors[category] ?? "#9E9E9E");
  const currentCategoryLabel = isGeneral
    ? (globalCategoryMaps.labels[procedureType] ?? procedureType)
    : (toothCategoryMaps.labels[category] ?? category);

  const onDateChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selected) setDate(selected);
  };

  const formatDisplayDate = (d: Date) =>
    d.toLocaleDateString("uk-UA", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  useEffect(() => {
    loadData().then((data) => {
      setToothCategoryMaps(buildToothCategoryMaps(data.customToothCategories));
      setGlobalCategoryMaps(buildGlobalCategoryMaps(data.customGlobalCategories));
    });
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const save = () => {
    const dateISO = date.toISOString();
    if (isGeneral) {
      const t = title.trim() || (globalCategoryMaps.labels[procedureType] ?? procedureType);
      addGlobalProcedure({
        date: dateISO,
        title: t,
        notes: notes.trim() || undefined,
        type: procedureType,
      }).catch(() => {});
    } else {
      const t = title.trim();
      if (!t) {
        Alert.alert("Помилка", "Введіть назву запису");
        return;
      }
      addToothChange(target as ToothId, {
        date: dateISO,
        title: t,
        notes: notes.trim() || undefined,
        status: category as ToothChange["status"],
        imageUri: imageUri ?? undefined,
      }).catch(() => {});
    }
    router.back();
  };

  const displayTarget = isGeneral
    ? "Ротова порожнина"
    : toothFull(target as ToothId);

  return (
    <>
      <Stack.Screen options={{ title: "Новий запис" }} />
      <View style={[styles.root, { backgroundColor: colors.bg }]}>
        <KeyboardAwareScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid
          extraScrollHeight={80}
          keyboardOpeningTime={0}
        >
          {/* ── Target + Date card ── */}
          <Pressable
            style={[styles.card, styles.cardRow, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
            onPress={locked ? undefined : () => setPickerOpen(true)}
            disabled={locked}
          >
            <View style={[styles.cardRowIcon, { backgroundColor: colors.accentBg }]}>
              <Ionicons
                name={locked ? "lock-closed" : "medical-outline"}
                size={20}
                color={colors.accent}
              />
            </View>
            <View style={styles.cardRowBody}>
              <Text style={[styles.cardRowLabel, { color: colors.textTertiary }]}>Прив'язка</Text>
              <Text style={[styles.cardRowValue, { color: colors.text }]} numberOfLines={1}>
                {locked
                  ? `Зуб ${toothShort(target as ToothId)}`
                  : displayTarget}
              </Text>
            </View>
            {!locked && (
              <Ionicons name="chevron-forward" size={22} color={colors.chevron} />
            )}
          </Pressable>

          {/* ── Category card ── */}
          <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>
              {isGeneral ? "Тип процедури" : "Категорія"}
            </Text>
            <Pressable
              style={[styles.categoryTrigger, { backgroundColor: colors.inputBg }]}
              onPress={() => isGeneral ? setGlobalPickerVisible(true) : setCategoryPickerVisible(true)}
            >
              <View style={[styles.categoryDot, { backgroundColor: currentCategoryColor }]} />
              <Text style={[styles.categoryTriggerText, { color: colors.text }]}>
                {currentCategoryLabel}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.chevron} />
            </Pressable>
          </View>

          {/* ── Details card ── */}
          <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Деталі</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]}
              placeholder={
                isGeneral
                  ? "Назва (наприклад: профілактичний огляд)"
                  : "Назва (наприклад: пломба, огляд)"
              }
              value={title}
              onChangeText={setTitle}
              placeholderTextColor={colors.textTertiary}
            />
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.inputBg, color: colors.text }]}
              placeholder="Нотатки..."
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          {/* ── Photo card ── */}
          <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Фото</Text>
            {imageUri ? (
              <View style={[styles.imagePreview, { backgroundColor: colors.border }]}>
                <Image source={{ uri: imageUri }} style={styles.previewImg} />
                <View style={[styles.imageActions, { backgroundColor: colors.inputBg }]}>
                  <Pressable style={styles.imageActionBtn} onPress={pickImage}>
                    <Ionicons
                      name="swap-horizontal"
                      size={16}
                      color={colors.accent}
                    />
                    <Text style={[styles.imageActionText, { color: colors.accent }]}>Змінити</Text>
                  </Pressable>
                  <Pressable
                    style={styles.imageActionBtn}
                    onPress={() => setImageUri(null)}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.destructive} />
                    <Text
                      style={[styles.imageActionText, { color: colors.destructive }]}
                    >
                      Видалити
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable style={[styles.imagePlaceholder, { backgroundColor: colors.inputBg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border }]} onPress={pickImage}>
                <Ionicons name="camera-outline" size={24} color={colors.textTertiary} />
                <Text style={[styles.imagePlaceholderText, { color: colors.textTertiary }]}>
                  Обрати з галереї
                </Text>
              </Pressable>
            )}
          </View>

          {/* ── Date card (optional) ── */}
          <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <View style={styles.cardRow}>
              <View style={[styles.cardRowIcon, { backgroundColor: colors.accentBg }]}>
                <Ionicons name="calendar-outline" size={18} color={colors.accent} />
              </View>
              <View style={styles.cardRowBody}>
                <Text style={[styles.cardRowLabel, { color: colors.textTertiary }]}>Дата (необов'язково)</Text>
              </View>
              {Platform.OS === "ios" ? (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="compact"
                  maximumDate={new Date()}
                  onChange={onDateChange}
                  locale="uk"
                  accentColor={colors.accent}
                  style={{ alignSelf: "center" }}
                />
              ) : (
                <>
                  <Pressable
                    onPress={() => setShowDatePicker(true)}
                    style={{ alignSelf: "center" }}
                  >
                    <Text style={[styles.cardRowValue, { color: colors.text }]}>
                      {formatDisplayDate(date)}
                    </Text>
                  </Pressable>
                  {showDatePicker && (
                    <DateTimePicker
                      value={date}
                      mode="date"
                      display="default"
                      maximumDate={new Date()}
                      onChange={onDateChange}
                    />
                  )}
                </>
              )}
            </View>
          </View>

        </KeyboardAwareScrollView>
        <View style={[styles.bottomBar, { borderTopColor: colors.border, paddingBottom: insets.bottom + 8 }]}>
          <Pressable
            style={({ pressed }) => [
              styles.saveBtn,
              { backgroundColor: colors.accent, shadowColor: colors.accent },
              pressed && styles.saveBtnPressed,
            ]}
            onPress={save}
          >
            <Text style={[styles.saveBtnText, { color: colors.white }]}>Зберегти</Text>
          </Pressable>
        </View>
      </View>

      <StatusPickerModal
        visible={categoryPickerVisible}
        onClose={() => setCategoryPickerVisible(false)}
        title="Категорія"
        selected={category}
        maps={toothCategoryMaps}
        onSelect={(v) => { setCategory(v); setCategoryPickerVisible(false); }}
        onManage={() => { router.push("/statuses"); setCategoryPickerVisible(false); }}
        manageLabel="Керувати категоріями"
        showEmpty={false}
      />
      <StatusPickerModal
        visible={globalPickerVisible}
        onClose={() => setGlobalPickerVisible(false)}
        title="Тип процедури"
        selected={procedureType}
        maps={globalCategoryMaps}
        onSelect={(v) => { setProcedureType(v); setGlobalPickerVisible(false); }}
        onManage={() => { router.push("/statuses"); setGlobalPickerVisible(false); }}
        manageLabel="Керувати категоріями"
        showEmpty={false}
      />

      <GlassModal visible={pickerOpen} onClose={() => setPickerOpen(false)}>
        <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.pickerTitle, { color: colors.text }]}>Прив'язка</Text>
          <Pressable onPress={() => setPickerOpen(false)} hitSlop={12}>
            <Text style={[styles.pickerDone, { color: colors.accent }]}>Готово</Text>
          </Pressable>
        </View>
        <ScrollView style={styles.pickerScroll}>
          <Pressable
            style={[
              styles.pickerItem,
              target === GENERAL_KEY && { backgroundColor: colors.badgeBg },
            ]}
            onPress={() => {
              setTarget(GENERAL_KEY);
              setPickerOpen(false);
            }}
          >
            <Ionicons
              name="medical"
              size={16}
              color={target === GENERAL_KEY ? colors.accent : colors.chevron}
            />
            <Text
              style={[
                styles.pickerItemText,
                { color: target === GENERAL_KEY ? colors.text : colors.textSecondary },
                target === GENERAL_KEY && { fontWeight: "600" },
              ]}
            >
              Ротова порожнина (загальне)
            </Text>
            {target === GENERAL_KEY && (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.accent}
                style={{ marginLeft: "auto" }}
              />
            )}
          </Pressable>

          {QUADRANTS.map((q) => (
            <View key={q}>
              <Text style={[styles.pickerGroup, { color: colors.textTertiary }]}>{QUADRANT_LABELS[q]}</Text>
              {ALL_TOOTH_IDS.filter((id) => id[0] === q).map((id) => (
                <Pressable
                  key={id}
                  style={[
                    styles.pickerItem,
                    target === id && { backgroundColor: colors.badgeBg },
                  ]}
                  onPress={() => {
                    setTarget(id);
                    setPickerOpen(false);
                  }}
                >
                  <Text style={[styles.pickerToothNum, { color: colors.accent }]}>{id}</Text>
                  <Text
                    style={[
                      styles.pickerItemText,
                      { color: target === id ? colors.text : colors.textSecondary },
                      target === id && { fontWeight: "600" },
                    ]}
                  >
                    {TOOTH_NAMES[id[1]] ?? ""}
                  </Text>
                  {target === id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={colors.accent}
                      style={{ marginLeft: "auto" }}
                    />
                  )}
                </Pressable>
              ))}
            </View>
          ))}
        </ScrollView>
      </GlassModal>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 24 },

  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },

  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardRowBody: { flex: 1, paddingTop: 2 },
  cardRowLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  cardRowValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e8ece8",
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a3d32",
  },
  pickerDone: {
    fontSize: 16,
    fontWeight: "600",
  },
  pickerScroll: {
    maxHeight: 380,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  pickerGroup: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 4,
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 10,
  },
  pickerToothNum: {
    width: 28,
    fontSize: 14,
    fontWeight: "700",
  },
  pickerItemText: {
    flex: 1,
    fontSize: 15,
  },

  input: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    fontSize: 15,
    marginBottom: 8,
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },

  imagePlaceholder: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 20,
    borderRadius: 16,
  },
  imagePlaceholderText: { fontSize: 14, fontWeight: "500" },

  imagePreview: {
    borderRadius: 16,
    overflow: "hidden",
  },
  previewImg: { width: "100%", height: 200 },
  imageActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    paddingVertical: 10,
  },
  imageActionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  imageActionText: { fontSize: 13, fontWeight: "500" },

  categoryTrigger: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryTriggerText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },

  saveBtn: {
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  saveBtnPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  saveBtnText: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
