import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  Platform,
  Image,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as ImagePicker from "expo-image-picker";
import {
  loadData,
  getToothRecord,
  updateToothChange,
} from "../src/store/teethStore";
import { TOOTH_NAMES, buildStatusMaps } from "../src/types";
import type { ToothId, ToothChange, StatusMaps } from "../src/types";

export default function EditRecordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ toothId: string; changeId: string }>();
  const toothId = params.toothId as ToothId;
  const changeId = params.changeId!;

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<ToothChange["status"]>("other");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [statusMaps, setStatusMaps] = useState<StatusMaps>(buildStatusMaps());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadData().then((data) => {
      setStatusMaps(buildStatusMaps(data.customStatuses));
      const record = getToothRecord(data, toothId);
      const change = record.changes.find((c) => c.id === changeId);
      if (change) {
        setTitle(change.title);
        setNotes(change.notes ?? "");
        setStatus(change.status ?? "other");
        setDate(new Date(change.date));
        setImageUri(change.imageUri ?? null);
        setLoaded(true);
      }
    });
  }, [toothId, changeId]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
  };

  const onDateChange = (_e: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selected) setDate(selected);
  };

  const save = async () => {
    const t = title.trim();
    if (!t) {
      Alert.alert("Помилка", "Введіть назву запису");
      return;
    }
    await updateToothChange(toothId, changeId, {
      title: t,
      notes: notes.trim() || undefined,
      status,
      date: date.toISOString(),
      imageUri: imageUri ?? undefined,
    });
    router.back();
  };

  const toothLabel = `${toothId} · ${TOOTH_NAMES[toothId[1]] ?? ""}`;

  if (!loaded) return null;

  return (
    <>
      <Stack.Screen options={{ title: "Редагувати запис" }} />
      <View style={styles.root}>
        <KeyboardAwareScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid
          extraScrollHeight={160}
          extraHeight={160}
          keyboardOpeningTime={0}
        >
          {/* ── Tooth info ── */}
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.cardRowIcon}>
                <Ionicons name="lock-closed" size={14} color="#5a7a6a" />
              </View>
              <View style={styles.cardRowBody}>
                <Text style={styles.cardRowLabel}>Зуб</Text>
                <Text style={styles.cardRowValue}>{toothLabel}</Text>
              </View>
            </View>
          </View>

          {/* ── Category ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Категорія</Text>
            <View style={styles.chipGrid}>
              {statusMaps.options.map(([value, label]) => {
                const active = status === value;
                const dotColor = statusMaps.borderColors[value] ?? "#9E9E9E";
                return (
                  <Pressable
                    key={value}
                    onPress={() => setStatus(value as ToothChange["status"])}
                    style={[
                      styles.chip,
                      active && { backgroundColor: dotColor },
                    ]}
                  >
                    <View
                      style={[
                        styles.chipDot,
                        { backgroundColor: active ? "#fff" : dotColor },
                      ]}
                    />
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ── Details ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Деталі</Text>
            <TextInput
              style={styles.input}
              placeholder="Назва (наприклад: пломба, огляд)"
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

          {/* ── Photo ── */}
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

          {/* ── Date ── */}
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.cardRowIcon}>
                <Ionicons name="calendar-outline" size={18} color="#2d5a4a" />
              </View>
              <View style={styles.cardRowBody}>
                <Text style={styles.cardRowLabel}>Дата</Text>
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
                      {date.toLocaleDateString("uk-UA", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
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
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f2f6f4" },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 120 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
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
    borderRadius: 10,
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
    borderRadius: 20,
    backgroundColor: "#f0f5f2",
  },
  chipDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  chipText: { fontSize: 13, color: "#3d5a4a", fontWeight: "500" },
  chipTextActive: { color: "#fff" },

  input: {
    backgroundColor: "#f5f8f6",
    borderRadius: 12,
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
    borderRadius: 12,
    backgroundColor: "#f5f8f6",
  },
  imagePlaceholderText: { fontSize: 14, color: "#8a9a90", fontWeight: "500" },
  imagePreview: {
    borderRadius: 12,
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
    borderRadius: 14,
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
