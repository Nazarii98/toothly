import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../src/theme";
import { GlassModal } from "../src/components/GlassModal";
import { StatusPickerModal } from "../src/components/StatusPickerModal";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { usePreventRemove } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import {
  loadData,
  addToothEvent,
  addGlobalProcedure,
} from "../src/store/teethStore";
import {
  ALL_TOOTH_IDS,
  TOOTH_CATEGORY_LABELS,
  GLOBAL_PROCEDURE_TYPES,
  buildToothCategoryMaps,
  buildGlobalCategoryMaps,
} from "../src/types";
import type { ToothId, StatusMaps } from "../src/types";
const GENERAL_KEY = "__general__";

const QUADRANTS = ["1", "2", "3", "4"] as const;

export default function AddRecordModal() {
  const { t, i18n } = useTranslation();

  const toothShort = (id: ToothId): string =>
    `${id} · ${t(`toothNames.${id[1]}`, { defaultValue: id[1] })}`;

  const toothFull = (id: ToothId): string =>
    `${id} — ${t(`toothNames.${id[1]}`, { defaultValue: id[1] })} (${t(`quadrantLabels.${id[0]}`, { defaultValue: id[0] })})`;
  const { colors } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ toothId?: string }>();
  const locked = !!params.toothId;
  const [saved, setSaved] = useState(false);

  const [target, setTarget] = useState<string>(params.toothId ?? GENERAL_KEY);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [title, setTitle] = useState(""); // тільки для global
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState<string>("checkup");
  const [procedureType, setProcedureType] = useState<string>("checkup");
  const [toothCategoryMaps, setToothCategoryMaps] = useState<StatusMaps>(
    buildToothCategoryMaps(),
  );
  const [globalCategoryMaps, setGlobalCategoryMaps] = useState<StatusMaps>(
    buildGlobalCategoryMaps(),
  );
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
    d.toLocaleDateString(i18n.language, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  useEffect(() => {
    const localizedToothCategories = Object.fromEntries(
      Object.keys(TOOTH_CATEGORY_LABELS).map((k) => [
        k,
        t(`categoryLabels.${k}`, { defaultValue: TOOTH_CATEGORY_LABELS[k] }),
      ]),
    );
    const localizedGlobalTypes = Object.fromEntries(
      Object.keys(GLOBAL_PROCEDURE_TYPES).map((k) => [
        k,
        t(`globalProcedureTypes.${k}`, {
          defaultValue: GLOBAL_PROCEDURE_TYPES[k],
        }),
      ]),
    );
    loadData().then((data) => {
      setToothCategoryMaps(
        buildToothCategoryMaps(
          data.customToothCategories,
          localizedToothCategories,
        ),
      );
      setGlobalCategoryMaps(
        buildGlobalCategoryMaps(
          data.customGlobalCategories,
          localizedGlobalTypes,
        ),
      );
    });
  }, [i18n.language]);

  const save = (): boolean => {
    const dateISO = date.toISOString();
    if (isGeneral) {
      const titleStr =
        title.trim() ||
        (globalCategoryMaps.labels[procedureType] ?? procedureType);
      addGlobalProcedure({
        date: dateISO,
        title: titleStr,
        notes: notes.trim() || undefined,
        type: procedureType,
      }).catch(() => {});
    } else {
      addToothEvent(target as ToothId, {
        date: dateISO,
        notes: notes.trim() || undefined,
        category,
      }).catch(() => {});
    }
    setSaved(true);
    setTimeout(() => router.back(), 0);
    return true;
  };

  const isDirty =
    !saved &&
    (isGeneral
      ? title.trim().length > 0 || notes.trim().length > 0
      : notes.trim().length > 0);

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

  const displayTarget = isGeneral
    ? t("record.oralCavity")
    : toothFull(target as ToothId);

  return (
    <>
      <Stack.Screen options={{ title: t("record.addTitle") }} />
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
            style={[
              styles.card,
              styles.cardRow,
              { backgroundColor: colors.card, shadowColor: colors.shadow },
            ]}
            onPress={locked ? undefined : () => setPickerOpen(true)}
            disabled={locked}
          >
            <View
              style={[styles.cardRowIcon, { backgroundColor: colors.accentBg }]}
            >
              <Ionicons
                name={locked ? "lock-closed" : "medical-outline"}
                size={20}
                color={colors.accent}
              />
            </View>
            <View style={styles.cardRowBody}>
              <Text
                style={[styles.cardRowLabel, { color: colors.textTertiary }]}
              >
                {t("record.binding")}
              </Text>
              <Text
                style={[styles.cardRowValue, { color: colors.text }]}
                numberOfLines={1}
              >
                {locked
                  ? t("record.toothLabel", {
                      label: toothShort(target as ToothId),
                    })
                  : displayTarget}
              </Text>
            </View>
            {!locked && (
              <Ionicons
                name="chevron-forward"
                size={22}
                color={colors.chevron}
              />
            )}
          </Pressable>

          {/* ── Category card ── */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, shadowColor: colors.shadow },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>
              {isGeneral ? t("global.typeLabel") : t("record.categoryLabel")}
            </Text>
            <Pressable
              style={[
                styles.categoryTrigger,
                { backgroundColor: colors.inputBg },
              ]}
              onPress={() =>
                isGeneral
                  ? setGlobalPickerVisible(true)
                  : setCategoryPickerVisible(true)
              }
            >
              <View
                style={[
                  styles.categoryDot,
                  { backgroundColor: currentCategoryColor },
                ]}
              />
              <Text
                style={[styles.categoryTriggerText, { color: colors.text }]}
              >
                {currentCategoryLabel}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.chevron}
              />
            </Pressable>
          </View>

          {/* ── Details card ── */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, shadowColor: colors.shadow },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>
              {t("common.details")}
            </Text>
            {isGeneral && (
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.inputBg, color: colors.text },
                ]}
                placeholder={t("record.titlePlaceholderGlobal")}
                value={title}
                onChangeText={setTitle}
                placeholderTextColor={colors.textTertiary}
              />
            )}
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

          {/* ── Date card (optional) ── */}
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
                  {t("record.dateOptional")}
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
        selected={category}
        maps={toothCategoryMaps}
        onSelect={(v) => {
          setCategory(v);
          setCategoryPickerVisible(false);
        }}
        onManage={() => {
          router.push("/statuses");
          setCategoryPickerVisible(false);
        }}
        manageLabel={t("common.manageCategories")}
        showEmpty={false}
      />
      <StatusPickerModal
        visible={globalPickerVisible}
        onClose={() => setGlobalPickerVisible(false)}
        title={t("global.typeLabel")}
        selected={procedureType}
        maps={globalCategoryMaps}
        onSelect={(v) => {
          setProcedureType(v);
          setGlobalPickerVisible(false);
        }}
        onManage={() => {
          router.push("/statuses");
          setGlobalPickerVisible(false);
        }}
        manageLabel={t("common.manageCategories")}
        showEmpty={false}
      />

      <GlassModal visible={pickerOpen} onClose={() => setPickerOpen(false)}>
        <View
          style={[styles.pickerHeader, { borderBottomColor: colors.border }]}
        >
          <Text style={[styles.pickerTitle, { color: colors.text }]}>
            {t("record.binding")}
          </Text>
          <Pressable onPress={() => setPickerOpen(false)} hitSlop={12}>
            <Text style={[styles.pickerDone, { color: colors.accent }]}>
              {t("common.done")}
            </Text>
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
                {
                  color:
                    target === GENERAL_KEY ? colors.text : colors.textSecondary,
                },
                target === GENERAL_KEY && { fontWeight: "600" },
              ]}
            >
              {t("record.oralCavityGeneral")}
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
              <Text
                style={[styles.pickerGroup, { color: colors.textTertiary }]}
              >
                {t(`quadrantLabels.${q}`, { defaultValue: q })}
              </Text>
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
                  <Text
                    style={[styles.pickerToothNum, { color: colors.accent }]}
                  >
                    {id}
                  </Text>
                  <Text
                    style={[
                      styles.pickerItemText,
                      {
                        color:
                          target === id ? colors.text : colors.textSecondary,
                      },
                      target === id && { fontWeight: "600" },
                    ]}
                  >
                    {t(`toothNames.${id[1]}`, { defaultValue: "" })}
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
