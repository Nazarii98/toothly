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
import { GlassModal } from "../src/components/GlassModal";
import { useFocusEffect } from "@react-navigation/native";
import {
  loadData,
  addGlobalProcedure,
  deleteGlobalProcedure,
} from "../src/store/teethStore";
import { GLOBAL_PROCEDURE_TYPES } from "../src/types";
import type { GlobalProcedure } from "../src/types";
import { useAppTheme } from "../src/theme";

const TYPE_OPTIONS = Object.entries(GLOBAL_PROCEDURE_TYPES);

export default function GlobalProceduresScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useStableHeaderHeight();
  const [procedures, setProcedures] = useState<GlobalProcedure[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formType, setFormType] = useState<GlobalProcedure["type"]>("cleaning");

  const refresh = useCallback(async () => {
    const data = await loadData();
    setProcedures(data.globalProcedures);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const openAdd = () => {
    setFormTitle("");
    setFormNotes("");
    setFormType("cleaning");
    setModalVisible(true);
  };

  const save = async () => {
    const title = formTitle.trim() || GLOBAL_PROCEDURE_TYPES[formType];
    await addGlobalProcedure({
      date: new Date().toISOString(),
      title,
      notes: formNotes.trim() || undefined,
      type: formType,
    });
    setModalVisible(false);
    refresh();
  };

  const deleteProc = (p: GlobalProcedure) => {
    Alert.alert("Видалити процедуру?", p.title, [
      { text: "Скасувати", style: "cancel" },
      {
        text: "Видалити",
        style: "destructive",
        onPress: async () => {
          await deleteGlobalProcedure(p.id);
          refresh();
        },
      },
    ]);
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <View style={styles.safe}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.bg }]}
        contentContainerStyle={{
          paddingTop: headerHeight + 12,
          paddingBottom: insets.bottom + 20,
        }}
      >
        <Text style={[styles.title, { color: colors.text }]}>Глобальні процедури</Text>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Наприклад: чистка, відбілювання, огляд усієї порожнини рота.
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.addBtn,
            { backgroundColor: colors.accent },
            pressed && styles.pressed,
          ]}
          onPress={openAdd}
        >
          <Text style={[styles.addBtnText, { color: colors.white }]}>+ Додати процедуру</Text>
        </Pressable>

        {procedures.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textTertiary }]}>
            Ще немає записів. Додайте першу процедуру.
          </Text>
        ) : (
          <View style={styles.list}>
            {procedures.map((p) => (
              <View
                key={p.id}
                style={[
                  styles.card,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{p.title}</Text>
                  <Text style={[styles.cardDate, { color: colors.textTertiary }]}>{formatDate(p.date)}</Text>
                </View>
                <Text style={[styles.cardType, { color: colors.accent }]}>
                  {GLOBAL_PROCEDURE_TYPES[p.type]}
                </Text>
                {p.notes ? (
                  <Text style={[styles.cardNotes, { color: colors.textSecondary }]}>{p.notes}</Text>
                ) : null}
                <Pressable
                  onPress={() => deleteProc(p)}
                  style={styles.deleteBtn}
                >
                  <Text style={[styles.deleteBtnText, { color: colors.destructive }]}>Видалити</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <GlassModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        position="bottom"
        animationType="slide"
      >
        <Text style={[styles.modalTitle, { color: colors.text }]}>Нова процедура</Text>
        <Text style={[styles.label, { color: colors.text }]}>Тип</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.typeRow}
        >
          {TYPE_OPTIONS.map(([value, label]) => (
            <Pressable
              key={value}
              onPress={() => setFormType(value as GlobalProcedure["type"])}
              style={[
                styles.typeChip,
                { backgroundColor: formType === value ? colors.accent : colors.statusOptionBg },
              ]}
            >
              <Text
                style={[
                  styles.typeChipText,
                  { color: formType === value ? colors.white : colors.accent },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBg,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          placeholder="Назва (опційно)"
          value={formTitle}
          onChangeText={setFormTitle}
          placeholderTextColor={colors.textTertiary}
        />
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            {
              backgroundColor: colors.inputBg,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          placeholder="Нотатки"
          value={formNotes}
          onChangeText={setFormNotes}
          multiline
          placeholderTextColor={colors.textTertiary}
        />
        <View style={styles.modalActions}>
          <Pressable
            onPress={() => setModalVisible(false)}
            style={styles.cancelBtn}
          >
            <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Скасувати</Text>
          </Pressable>
          <Pressable
            onPress={save}
            style={[styles.saveBtn, { backgroundColor: colors.accent }]}
          >
            <Text style={[styles.saveBtnText, { color: colors.white }]}>Зберегти</Text>
          </Pressable>
        </View>
      </GlassModal>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 12,
  },
  hint: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
    marginHorizontal: 24,
  },
  addBtn: {
    margin: 16,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  pressed: { opacity: 0.85 },
  addBtnText: { fontSize: 16, fontWeight: "600" },
  empty: {
    textAlign: "center",
    marginTop: 24,
    paddingHorizontal: 24,
  },
  list: { padding: 16, paddingTop: 0 },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTitle: { fontSize: 16, fontWeight: "600", flex: 1 },
  cardDate: { fontSize: 12 },
  cardType: { fontSize: 12, marginTop: 4 },
  cardNotes: { fontSize: 14, marginTop: 8 },
  deleteBtn: { marginTop: 12 },
  deleteBtnText: { fontSize: 14, fontWeight: "600" },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  typeRow: { marginBottom: 12, maxHeight: 44 },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    marginRight: 8,
  },
  typeChipText: { fontSize: 13 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  modalActions: { flexDirection: "row", gap: 12, justifyContent: "flex-end" },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 20 },
  cancelBtnText: { fontSize: 16 },
  saveBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  saveBtnText: { fontSize: 16, fontWeight: "600" },
});
