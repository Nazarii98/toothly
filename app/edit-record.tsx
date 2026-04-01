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
import { usePreventRemove } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { StatusPickerModal } from "../src/components/StatusPickerModal";
import {
  loadData,
  getToothRecord,
  updateToothChange,
  deleteToothChange,
} from "../src/store/teethStore";
import { TOOTH_CATEGORY_LABELS, buildToothCategoryMaps } from "../src/types";
import type { ToothId, StatusMaps } from "../src/types";
import { useTranslation } from "react-i18next";

export default function EditRecordScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ toothId: string; changeId: string }>();
  const toothId = params.toothId as ToothId;
  const changeId = params.changeId!;

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<string>("checkup");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [categoryMaps, setCategoryMaps] = useState<StatusMaps>(
    buildToothCategoryMaps(),
  );
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [initialVals, setInitialVals] = useState({
    title: "",
    notes: "",
    status: "checkup",
    dateDay: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const localizedToothCategories = Object.fromEntries(
      Object.keys(TOOTH_CATEGORY_LABELS).map((k) => [
        k,
        t(`categoryLabels.${k}`, { defaultValue: TOOTH_CATEGORY_LABELS[k] }),
      ]),
    );
    loadData().then((data) => {
      setCategoryMaps(
        buildToothCategoryMaps(
          data.customToothCategories,
          localizedToothCategories,
        ),
      );
      const record = getToothRecord(data, toothId);
      const change = record.changes.find((c) => c.id === changeId);
      if (change) {
        setTitle(change.title);
        setNotes(change.notes ?? "");
        setStatus(change.status ?? "checkup");
        setDate(new Date(change.date));
        setInitialVals({
          title: change.title,
          notes: change.notes ?? "",
          status: change.status ?? "checkup",
          dateDay: change.date.slice(0, 10),
        });
        setLoaded(true);
      }
    });
  }, [toothId, changeId, i18n.language]);

  const onDateChange = (_e: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selected) setDate(selected);
  };

  const save = (): boolean => {
    const titleStr = title.trim();
    if (!titleStr) {
      Alert.alert(t("common.error"), t("common.enterTitle"));
      return false;
    }
    updateToothChange(toothId, changeId, {
      title: titleStr,
      notes: notes.trim() || undefined,
      status,
      date: date.toISOString(),
    }).catch(() => {});
    setSaved(true);
    setTimeout(() => router.back(), 0);
    return true;
  };

  const isDirty =
    !saved &&
    loaded &&
    title.trim().length > 0 &&
    (title !== initialVals.title ||
      notes !== initialVals.notes ||
      status !== initialVals.status ||
      date.toISOString().slice(0, 10) !== initialVals.dateDay);

  usePreventRemove(isDirty, () => {
    Alert.alert(t("record.unsavedTitle"), t("record.unsavedMessage"), [
      {
        text: t("record.discardChanges"),
        style: "destructive",
        onPress: () => {
          setSaved(true);
          setTimeout(() => router.back(), 0);
        },
      },
      {
        text: t("common.save"),
        onPress: () => save(),
      },
    ]);
  });

  const handleDelete = () => {
    Alert.alert(t("record.deleteTitle"), title, [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => {
          deleteToothChange(toothId, changeId).catch(() => {});
          router.back();
        },
      },
    ]);
  };

  const toothLabel = `${toothId} · ${t(`toothNames.${toothId[1]}`, { defaultValue: "" })}`;

  if (!loaded) return null;

  return (
    <>
      <Stack.Screen options={{ title: t("record.editTitle") }} />
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
                  {t("common.tooth")}
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
              {t("record.categoryLabel")}
            </Text>
            <Pressable
              style={[
                styles.categoryTrigger,
                { backgroundColor: colors.inputBg },
              ]}
              onPress={() => setCategoryPickerVisible(true)}
            >
              <View
                style={[
                  styles.categoryDot,
                  {
                    backgroundColor:
                      categoryMaps.borderColors[status] ?? "#9E9E9E",
                  },
                ]}
              />
              <Text
                style={[styles.categoryTriggerText, { color: colors.text }]}
              >
                {categoryMaps.labels[status] ?? status}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.chevron}
              />
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
              {t("common.details")}
            </Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.inputBg, color: colors.text },
              ]}
              placeholder={t("record.titlePlaceholder")}
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
              placeholder={t("record.notesPlaceholder")}
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholderTextColor={colors.textTertiary}
            />
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
                  {t("record.dateLabel")}
                </Text>
              </View>
              {Platform.OS === "ios" ? (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="compact"
                  maximumDate={new Date()}
                  onChange={onDateChange}
                  locale={i18n.language}
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
              {t("record.deleteRecord")}
            </Text>
          </Pressable>
        </KeyboardAwareScrollView>
        <View
          style={[
            styles.bottomBar,
            { borderTopColor: colors.border, paddingBottom: insets.bottom + 8 },
          ]}
        >
          <Pressable
            style={({ pressed }) => [
              styles.saveBtn,
              { backgroundColor: colors.accent, shadowColor: colors.accent },
              pressed && styles.saveBtnPressed,
            ]}
            onPress={save}
          >
            <Text style={[styles.saveBtnText, { color: colors.white }]}>
              {t("common.save")}
            </Text>
          </Pressable>
        </View>
      </View>
      <StatusPickerModal
        visible={categoryPickerVisible}
        onClose={() => setCategoryPickerVisible(false)}
        title={t("record.categoryLabel")}
        selected={status}
        maps={categoryMaps}
        onSelect={(v) => {
          setStatus(v);
          setCategoryPickerVisible(false);
        }}
        onManage={() => {
          router.push("/statuses");
          setCategoryPickerVisible(false);
        }}
        manageLabel={t("common.manageCategories")}
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
