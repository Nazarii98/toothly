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
import { GlassModal } from "../src/components/GlassModal";
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
  GLOBAL_PROCEDURE_TYPES,
  buildStatusMaps,
} from "../src/types";
import type {
  ToothChange,
  GlobalProcedure,
  ToothId,
  StatusMaps,
} from "../src/types";

const PROCEDURE_OPTIONS = Object.entries(GLOBAL_PROCEDURE_TYPES);
const GENERAL_KEY = "__general__";

function toothShort(id: ToothId): string {
  return `${id} · ${TOOTH_NAMES[id[1]] ?? ""}`;
}

function toothFull(id: ToothId): string {
  return `${id} — ${TOOTH_NAMES[id[1]] ?? ""} (${QUADRANT_LABELS[id[0]] ?? ""})`;
}

const QUADRANTS = ["1", "2", "3", "4"] as const;

export default function AddRecordModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ toothId?: string }>();
  const locked = !!params.toothId;

  const [target, setTarget] = useState<string>(params.toothId ?? GENERAL_KEY);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState<string>("other");
  const [procedureType, setProcedureType] =
    useState<GlobalProcedure["type"]>("checkup");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [statusMaps, setStatusMaps] = useState<StatusMaps>(buildStatusMaps());

  const isGeneral = target === GENERAL_KEY;

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
    loadData().then((data) =>
      setStatusMaps(buildStatusMaps(data.customStatuses)),
    );
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

  const save = async () => {
    const dateISO = date.toISOString();
    if (isGeneral) {
      const t = title.trim() || GLOBAL_PROCEDURE_TYPES[procedureType];
      await addGlobalProcedure({
        date: dateISO,
        title: t,
        notes: notes.trim() || undefined,
        type: procedureType,
      });
    } else {
      const t = title.trim();
      if (!t) {
        Alert.alert("Помилка", "Введіть назву запису");
        return;
      }
      await addToothChange(target as ToothId, {
        date: dateISO,
        title: t,
        notes: notes.trim() || undefined,
        status: category as ToothChange["status"],
        imageUri: imageUri ?? undefined,
      });
    }
    router.back();
  };

  const displayTarget = isGeneral
    ? "Ротова порожнина"
    : toothFull(target as ToothId);

  return (
    <>
      <Stack.Screen options={{ title: "Новий запис" }} />
      <View style={styles.root}>
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
            style={[styles.card, styles.cardRow]}
            onPress={locked ? undefined : () => setPickerOpen(true)}
            disabled={locked}
          >
            <View style={styles.cardRowIcon}>
              <Ionicons
                name={locked ? "lock-closed" : "medical-outline"}
                size={20}
                color="#2d5a4a"
              />
            </View>
            <View style={styles.cardRowBody}>
              <Text style={styles.cardRowLabel}>Прив'язка</Text>
              <Text style={styles.cardRowValue} numberOfLines={1}>
                {locked
                  ? `Зуб ${toothShort(target as ToothId)}`
                  : displayTarget}
              </Text>
            </View>
            {!locked && (
              <Ionicons name="chevron-forward" size={22} color="#8a9a90" />
            )}
          </Pressable>

          {/* ── Category card ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {isGeneral ? "Тип процедури" : "Категорія"}
            </Text>
            <View style={styles.chipGrid}>
              {isGeneral
                ? PROCEDURE_OPTIONS.map(([value, label]) => {
                    const active = procedureType === value;
                    return (
                      <Pressable
                        key={value}
                        onPress={() =>
                          setProcedureType(value as GlobalProcedure["type"])
                        }
                        style={[styles.chip, active && styles.chipActive]}
                      >
                        <View
                          style={[
                            styles.chipDot,
                            {
                              backgroundColor: active ? "#fff" : "#2d5a4a",
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.chipText,
                            active && styles.chipTextActive,
                          ]}
                        >
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })
                : statusMaps.options.map(([value, label]) => {
                    const active = category === value;
                    const dotColor =
                      statusMaps.borderColors[value] ?? "#9E9E9E";
                    return (
                      <Pressable
                        key={value}
                        onPress={() => setCategory(value)}
                        style={[styles.chip, active && styles.chipActive]}
                      >
                        <View
                          style={[
                            styles.chipDot,
                            {
                              backgroundColor: active ? "#fff" : dotColor,
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.chipText,
                            active && styles.chipTextActive,
                          ]}
                        >
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
            </View>
          </View>

          {/* ── Details card ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Деталі</Text>
            <TextInput
              style={styles.input}
              placeholder={
                isGeneral
                  ? "Назва (наприклад: профілактичний огляд)"
                  : "Назва (наприклад: пломба, огляд)"
              }
              value={title}
              onChangeText={setTitle}
              placeholderTextColor="#b0bab4"
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Нотатки..."
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholderTextColor="#b0bab4"
            />
          </View>

          {/* ── Photo card ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Фото</Text>
            {imageUri ? (
              <View style={styles.imagePreview}>
                <Image source={{ uri: imageUri }} style={styles.previewImg} />
                <View style={styles.imageActions}>
                  <Pressable style={styles.imageActionBtn} onPress={pickImage}>
                    <Ionicons
                      name="swap-horizontal"
                      size={16}
                      color="#2d5a4a"
                    />
                    <Text style={styles.imageActionText}>Змінити</Text>
                  </Pressable>
                  <Pressable
                    style={styles.imageActionBtn}
                    onPress={() => setImageUri(null)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#c0392b" />
                    <Text
                      style={[styles.imageActionText, { color: "#c0392b" }]}
                    >
                      Видалити
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable style={styles.imagePlaceholder} onPress={pickImage}>
                <Ionicons name="camera-outline" size={24} color="#8a9a90" />
                <Text style={styles.imagePlaceholderText}>
                  Обрати з галереї
                </Text>
              </Pressable>
            )}
          </View>

          {/* ── Date card (optional) ── */}
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.cardRowIcon}>
                <Ionicons name="calendar-outline" size={18} color="#2d5a4a" />
              </View>
              <View style={styles.cardRowBody}>
                <Text style={styles.cardRowLabel}>Дата (необов'язково)</Text>
              </View>
              {Platform.OS === "ios" ? (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="compact"
                  maximumDate={new Date()}
                  onChange={onDateChange}
                  locale="uk"
                  accentColor="#2d5a4a"
                  style={{ alignSelf: "center" }}
                />
              ) : (
                <>
                  <Pressable
                    onPress={() => setShowDatePicker(true)}
                    style={{ alignSelf: "center" }}
                  >
                    <Text style={styles.cardRowValue}>
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

          {/* ── Save ── */}
          <Pressable
            style={({ pressed }) => [
              styles.saveBtn,
              pressed && styles.saveBtnPressed,
            ]}
            onPress={save}
          >
            <Text style={styles.saveBtnText}>Зберегти</Text>
          </Pressable>
        </KeyboardAwareScrollView>
      </View>

      <GlassModal visible={pickerOpen} onClose={() => setPickerOpen(false)}>
        <View style={styles.pickerHeader}>
          <Text style={styles.pickerTitle}>Прив'язка</Text>
          <Pressable onPress={() => setPickerOpen(false)} hitSlop={12}>
            <Text style={styles.pickerDone}>Готово</Text>
          </Pressable>
        </View>
        <ScrollView style={styles.pickerScroll}>
          <Pressable
            style={[
              styles.pickerItem,
              target === GENERAL_KEY && styles.pickerItemActive,
            ]}
            onPress={() => {
              setTarget(GENERAL_KEY);
              setPickerOpen(false);
            }}
          >
            <Ionicons
              name="medical"
              size={16}
              color={target === GENERAL_KEY ? "#2d5a4a" : "#8a9a90"}
            />
            <Text
              style={[
                styles.pickerItemText,
                target === GENERAL_KEY && styles.pickerItemTextActive,
              ]}
            >
              Ротова порожнина (загальне)
            </Text>
            {target === GENERAL_KEY && (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color="#2d5a4a"
                style={{ marginLeft: "auto" }}
              />
            )}
          </Pressable>

          {QUADRANTS.map((q) => (
            <View key={q}>
              <Text style={styles.pickerGroup}>{QUADRANT_LABELS[q]}</Text>
              {ALL_TOOTH_IDS.filter((id) => id[0] === q).map((id) => (
                <Pressable
                  key={id}
                  style={[
                    styles.pickerItem,
                    target === id && styles.pickerItemActive,
                  ]}
                  onPress={() => {
                    setTarget(id);
                    setPickerOpen(false);
                  }}
                >
                  <Text style={styles.pickerToothNum}>{id}</Text>
                  <Text
                    style={[
                      styles.pickerItemText,
                      target === id && styles.pickerItemTextActive,
                    ]}
                  >
                    {TOOTH_NAMES[id[1]] ?? ""}
                  </Text>
                  {target === id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#2d5a4a"
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
  root: { flex: 1, backgroundColor: "#f2f6f4" },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 120 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#1a3d32",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#5a7a6a",
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
    backgroundColor: "#eef5f1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardRowBody: { flex: 1, paddingTop: 2 },
  cardRowLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#8a9a90",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  cardRowValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a3d32",
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
    color: "#2d5a4a",
  },
  pickerScroll: {
    maxHeight: 380,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  pickerGroup: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8a9a90",
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
  pickerItemActive: {
    backgroundColor: "#e8f5ee",
  },
  pickerToothNum: {
    width: 28,
    fontSize: 14,
    fontWeight: "700",
    color: "#2d5a4a",
  },
  pickerItemText: {
    flex: 1,
    fontSize: 15,
    color: "#3d5a4a",
  },
  pickerItemTextActive: {
    fontWeight: "600",
    color: "#1a3d32",
  },

  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 24,
    backgroundColor: "#f0f5f2",
  },
  chipActive: {
    backgroundColor: "#2d5a4a",
  },
  chipDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  chipText: {
    fontSize: 13,
    color: "#3d5a4a",
    fontWeight: "500",
  },
  chipTextActive: {
    color: "#fff",
  },

  input: {
    backgroundColor: "#f5f8f6",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#1a3d32",
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
    backgroundColor: "#f5f8f6",
  },
  imagePlaceholderText: { fontSize: 14, color: "#8a9a90", fontWeight: "500" },

  imagePreview: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#e0e0e0",
  },
  previewImg: { width: "100%", height: 200 },
  imageActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    paddingVertical: 10,
    backgroundColor: "#f5f8f6",
  },
  imageActionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  imageActionText: { fontSize: 13, color: "#2d5a4a", fontWeight: "500" },

  saveBtn: {
    marginTop: 4,
    paddingVertical: 16,
    backgroundColor: "#2d5a4a",
    borderRadius: 18,
    alignItems: "center",
    shadowColor: "#2d5a4a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  saveBtnPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  saveBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
