import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import {
  loadData,
  addGlobalProcedure,
  deleteGlobalProcedure,
} from "../src/store/teethStore";
import { GLOBAL_PROCEDURE_TYPES } from "../src/types";
import type { GlobalProcedure } from "../src/types";

const TYPE_OPTIONS = Object.entries(GLOBAL_PROCEDURE_TYPES);

export default function GlobalProceduresScreen() {
  const insets = useSafeAreaInsets();
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
      <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: insets.top + 56, paddingBottom: insets.bottom + 20 }}>
        <Text style={styles.title}>Глобальні процедури</Text>
        <Text style={styles.hint}>
          Наприклад: чистка, відбілювання, огляд усієї порожнини рота.
        </Text>

        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
          onPress={openAdd}
        >
          <Text style={styles.addBtnText}>+ Додати процедуру</Text>
        </Pressable>

        {procedures.length === 0 ? (
          <Text style={styles.empty}>
            Ще немає записів. Додайте першу процедуру.
          </Text>
        ) : (
          <View style={styles.list}>
            {procedures.map((p) => (
              <View key={p.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{p.title}</Text>
                  <Text style={styles.cardDate}>{formatDate(p.date)}</Text>
                </View>
                <Text style={styles.cardType}>
                  {GLOBAL_PROCEDURE_TYPES[p.type]}
                </Text>
                {p.notes ? (
                  <Text style={styles.cardNotes}>{p.notes}</Text>
                ) : null}
                <Pressable
                  onPress={() => deleteProc(p)}
                  style={styles.deleteBtn}
                >
                  <Text style={styles.deleteBtnText}>Видалити</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Нова процедура</Text>
            <Text style={styles.label}>Тип</Text>
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
                    formType === value && styles.typeChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      formType === value && styles.typeChipTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <TextInput
              style={styles.input}
              placeholder="Назва (опційно)"
              value={formTitle}
              onChangeText={setFormTitle}
              placeholderTextColor="#888"
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Нотатки"
              value={formNotes}
              onChangeText={setFormNotes}
              multiline
              placeholderTextColor="#888"
            />
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Скасувати</Text>
              </Pressable>
              <Pressable onPress={save} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Зберегти</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f0f5f2" },
  container: { flex: 1 },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a3d32",
    textAlign: "center",
    marginTop: 12,
  },
  hint: {
    fontSize: 13,
    color: "#5a7a6a",
    textAlign: "center",
    marginTop: 4,
    marginHorizontal: 24,
  },
  addBtn: {
    margin: 16,
    paddingVertical: 14,
    backgroundColor: "#2d5a4a",
    borderRadius: 12,
    alignItems: "center",
  },
  pressed: { opacity: 0.85 },
  addBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  empty: {
    textAlign: "center",
    color: "#7a9a8a",
    marginTop: 24,
    paddingHorizontal: 24,
  },
  list: { padding: 16, paddingTop: 0 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e8e4",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#1a3d32", flex: 1 },
  cardDate: { fontSize: 12, color: "#7a9a8a" },
  cardType: { fontSize: 12, color: "#2d5a4a", marginTop: 4 },
  cardNotes: { fontSize: 14, color: "#3d5a4a", marginTop: 8 },
  deleteBtn: { marginTop: 12 },
  deleteBtnText: { fontSize: 14, color: "#a04040", fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a3d32",
    marginBottom: 16,
  },
  label: { fontSize: 14, fontWeight: "600", color: "#1a3d32", marginBottom: 8 },
  typeRow: { marginBottom: 12, maxHeight: 44 },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#e8f0ec",
    marginRight: 8,
  },
  typeChipActive: { backgroundColor: "#2d5a4a" },
  typeChipText: { fontSize: 13, color: "#2d5a4a" },
  typeChipTextActive: { color: "#fff" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: "#fafafa",
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  modalActions: { flexDirection: "row", gap: 12, justifyContent: "flex-end" },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 20 },
  cancelBtnText: { fontSize: 16, color: "#5a7a6a" },
  saveBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#2d5a4a",
    borderRadius: 10,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
