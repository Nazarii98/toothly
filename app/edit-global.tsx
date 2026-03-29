import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../src/theme";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { StatusPickerModal } from "../src/components/StatusPickerModal";
import {
  loadData,
  updateGlobalProcedure,
  deleteGlobalProcedure,
} from "../src/store/teethStore";
import { buildGlobalCategoryMaps } from "../src/types";
import type { StatusMaps } from "../src/types";

export default function EditGlobalScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string }>();
  const procedureId = params.id!;

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [type, setType] = useState<string>("cleaning");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [categoryMaps, setCategoryMaps] = useState<StatusMaps>(buildGlobalCategoryMaps());
  const [typePickerVisible, setTypePickerVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadData().then((data) => {
      setCategoryMaps(buildGlobalCategoryMaps(data.customGlobalCategories));
      const proc = data.globalProcedures.find((p) => p.id === procedureId);
      if (proc) {
        setTitle(proc.title);
        setNotes(proc.notes ?? "");
        setType(proc.type);
        setDate(new Date(proc.date));
        setLoaded(true);
      }
    });
  }, [procedureId]);

  const onDateChange = (_e: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selected) setDate(selected);
  };

  const save = () => {
    const t = title.trim();
    if (!t) {
      Alert.alert("Помилка", "Введіть назву");
      return;
    }
    updateGlobalProcedure(procedureId, {
      title: t,
      notes: notes.trim() || undefined,
      type,
      date: date.toISOString(),
    }).catch(() => {});
    router.back();
  };

  const handleDelete = () => {
    Alert.alert("Видалити процедуру?", title, [
      { text: "Скасувати", style: "cancel" },
      {
        text: "Видалити",
        style: "destructive",
        onPress: () => {
          deleteGlobalProcedure(procedureId).catch(() => {});
          router.back();
        },
      },
    ]);
  };

  if (!loaded) return null;

  return (
    <>
      <Stack.Screen options={{ title: "Редагувати процедуру" }} />
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
          {/* Type */}
          <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Тип процедури</Text>
            <Pressable
              style={[styles.categoryTrigger, { backgroundColor: colors.inputBg }]}
              onPress={() => setTypePickerVisible(true)}
            >
              <View
                style={[
                  styles.categoryDot,
                  { backgroundColor: categoryMaps.borderColors[type] ?? "#9E9E9E" },
                ]}
              />
              <Text style={[styles.categoryTriggerText, { color: colors.text }]}>
                {categoryMaps.labels[type] ?? type}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.chevron} />
            </Pressable>
          </View>

          {/* Details */}
          <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Деталі</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]}
              placeholder="Назва (наприклад: чистка, огляд)"
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

          {/* Date */}
          <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <View style={styles.cardRow}>
              <View style={[styles.cardRowIcon, { backgroundColor: colors.accentBg }]}>
                <Ionicons name="calendar-outline" size={18} color={colors.accent} />
              </View>
              <View style={styles.cardRowBody}>
                <Text style={[styles.cardRowLabel, { color: colors.textTertiary }]}>Дата</Text>
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
                  textColor={colors.text}
                  themeVariant={colors.isDark ? "dark" : "light"}
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

          {/* Delete */}
          <Pressable
            style={({ pressed }) => [
              styles.deleteBtn,
              pressed && { opacity: 0.7 },
            ]}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={18} color={colors.destructive} />
            <Text style={[styles.deleteBtnText, { color: colors.destructive }]}>
              Видалити процедуру
            </Text>
          </Pressable>
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
        visible={typePickerVisible}
        onClose={() => setTypePickerVisible(false)}
        title="Тип процедури"
        selected={type}
        maps={categoryMaps}
        onSelect={(v) => { setType(v); setTypePickerVisible(false); }}
        onManage={() => { router.push("/statuses"); setTypePickerVisible(false); }}
        manageLabel="Керувати категоріями"
        showEmpty={false}
      />
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
