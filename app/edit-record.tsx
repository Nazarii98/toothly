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
import { useAppTheme } from "../src/theme";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as ImagePicker from "expo-image-picker";
import { StatusPickerModal } from "../src/components/StatusPickerModal";
import {
  loadData,
  getToothRecord,
  updateToothChange,
  deleteToothChange,
} from "../src/store/teethStore";
import { TOOTH_NAMES, buildToothCategoryMaps } from "../src/types";
import type { ToothId, StatusMaps } from "../src/types";

export default function EditRecordScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ toothId: string; changeId: string }>();
  const toothId = params.toothId as ToothId;
  const changeId = params.changeId!;

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<string>("checkup");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [categoryMaps, setCategoryMaps] = useState<StatusMaps>(buildToothCategoryMaps());
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadData().then((data) => {
      setCategoryMaps(buildToothCategoryMaps(data.customToothCategories));
      const record = getToothRecord(data, toothId);
      const change = record.changes.find((c) => c.id === changeId);
      if (change) {
        setTitle(change.title);
        setNotes(change.notes ?? "");
        setStatus(change.status ?? "checkup");
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

  const save = () => {
    const t = title.trim();
    if (!t) {
      Alert.alert("Помилка", "Введіть назву запису");
      return;
    }
    updateToothChange(toothId, changeId, {
      title: t,
      notes: notes.trim() || undefined,
      status,
      date: date.toISOString(),
      imageUri: imageUri ?? undefined,
    }).catch(() => {});
    router.back();
  };

  const handleDelete = () => {
    Alert.alert("Видалити запис?", title, [
      { text: "Скасувати", style: "cancel" },
      {
        text: "Видалити",
        style: "destructive",
        onPress: () => {
          deleteToothChange(toothId, changeId).catch(() => {});
          router.back();
        },
      },
    ]);
  };

  const toothLabel = `${toothId} · ${TOOTH_NAMES[toothId[1]] ?? ""}`;

  if (!loaded) return null;

  return (
    <>
      <Stack.Screen options={{ title: "Редагувати запис" }} />
      <View style={[styles.root, { backgroundColor: colors.bg }]}>
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
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, shadowColor: colors.shadow },
            ]}
          >
            <View style={styles.cardRow}>
              <View
                style={[
                  styles.cardRowIcon,
                  { backgroundColor: colors.accentBg },
                ]}
              >
                <Ionicons
                  name="lock-closed"
                  size={14}
                  color={colors.textSecondary}
                />
              </View>
              <View style={styles.cardRowBody}>
                <Text
                  style={[styles.cardRowLabel, { color: colors.textTertiary }]}
                >
                  Зуб
                </Text>
                <Text style={[styles.cardRowValue, { color: colors.text }]}>
                  {toothLabel}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Category ── */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, shadowColor: colors.shadow },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>
              Категорія
            </Text>
            <Pressable
              style={[styles.categoryTrigger, { backgroundColor: colors.inputBg }]}
              onPress={() => setCategoryPickerVisible(true)}
            >
              <View
                style={[
                  styles.categoryDot,
                  { backgroundColor: categoryMaps.borderColors[status] ?? "#9E9E9E" },
                ]}
              />
              <Text style={[styles.categoryTriggerText, { color: colors.text }]}>
                {categoryMaps.labels[status] ?? status}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.chevron} />
            </Pressable>
          </View>

          {/* ── Details ── */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, shadowColor: colors.shadow },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>
              Деталі
            </Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.inputBg, color: colors.text },
              ]}
              placeholder="Назва (наприклад: пломба, огляд)"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor={colors.textTertiary}
            />
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { backgroundColor: colors.inputBg, color: colors.text },
              ]}
              placeholder="Нотатки..."
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          {/* ── Photo ── */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, shadowColor: colors.shadow },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>
              Фото
            </Text>
            {imageUri ? (
              <View
                style={[
                  styles.imagePreview,
                  { backgroundColor: colors.border },
                ]}
              >
                <Image source={{ uri: imageUri }} style={styles.previewImg} />
                <View
                  style={[
                    styles.imageActions,
                    { backgroundColor: colors.inputBg },
                  ]}
                >
                  <Pressable style={styles.imageActionBtn} onPress={pickImage}>
                    <Ionicons
                      name="swap-horizontal"
                      size={16}
                      color={colors.accent}
                    />
                    <Text
                      style={[styles.imageActionText, { color: colors.accent }]}
                    >
                      Змінити
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.imageActionBtn}
                    onPress={() => setImageUri(null)}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color={colors.destructive}
                    />
                    <Text
                      style={[
                        styles.imageActionText,
                        { color: colors.destructive },
                      ]}
                    >
                      Видалити
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                style={[
                  styles.imagePlaceholder,
                  {
                    backgroundColor: colors.inputBg,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: colors.border,
                  },
                ]}
                onPress={pickImage}
              >
                <Ionicons
                  name="camera-outline"
                  size={24}
                  color={colors.textTertiary}
                />
                <Text
                  style={[
                    styles.imagePlaceholderText,
                    { color: colors.textTertiary },
                  ]}
                >
                  Обрати з галереї
                </Text>
              </Pressable>
            )}
          </View>

          {/* ── Date ── */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, shadowColor: colors.shadow },
            ]}
          >
            <View style={styles.cardRow}>
              <View
                style={[
                  styles.cardRowIcon,
                  { backgroundColor: colors.accentBg },
                ]}
              >
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={colors.accent}
                />
              </View>
              <View style={styles.cardRowBody}>
                <Text
                  style={[styles.cardRowLabel, { color: colors.textTertiary }]}
                >
                  Дата
                </Text>
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
              { backgroundColor: colors.accent, shadowColor: colors.accent },
              pressed && styles.saveBtnPressed,
            ]}
            onPress={save}
          >
            <Text style={[styles.saveBtnText, { color: colors.white }]}>
              Зберегти
            </Text>
          </Pressable>

          {/* ── Delete ── */}
          <Pressable
            style={({ pressed }) => [
              styles.deleteBtn,
              pressed && { opacity: 0.7 },
            ]}
            onPress={handleDelete}
          >
            <Ionicons
              name="trash-outline"
              size={18}
              color={colors.destructive}
            />
            <Text style={[styles.deleteBtnText, { color: colors.destructive }]}>
              Видалити запис
            </Text>
          </Pressable>
        </KeyboardAwareScrollView>
      </View>
      <StatusPickerModal
        visible={categoryPickerVisible}
        onClose={() => setCategoryPickerVisible(false)}
        title="Категорія"
        selected={status}
        maps={categoryMaps}
        onSelect={(v) => { setStatus(v); setCategoryPickerVisible(false); }}
        onManage={() => { router.push("/statuses"); setCategoryPickerVisible(false); }}
        manageLabel="Керувати категоріями"
        showEmpty={false}
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 120 },

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

  saveBtn: {
    marginTop: 4,
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

  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
    paddingVertical: 12,
  },
  deleteBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
