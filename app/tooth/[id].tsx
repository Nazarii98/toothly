import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ScrollView,
  Image,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import {
  loadData,
  deleteToothChange,
  getToothRecord,
  setToothStatus,
} from "../../src/store/teethStore";
import { QUADRANT_LABELS, TOOTH_NAMES, buildStatusMaps } from "../../src/types";
import type {
  ToothId,
  ToothChange,
  ToothStatus,
  ToothRecord,
  StatusMaps,
} from "../../src/types";

export default function ToothDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toothId = id as ToothId;
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [record, setRecord] = useState<ToothRecord | null>(null);
  const [statusMaps, setStatusMaps] = useState<StatusMaps>(buildStatusMaps());
  const [pickerVisible, setPickerVisible] = useState(false);

  const quadrant = toothId[0];
  const toothNum = toothId[1];
  const quadrantLabel = QUADRANT_LABELS[quadrant] ?? "";
  const toothLabel = TOOTH_NAMES[toothNum] ?? `Зуб ${toothId}`;

  const refresh = useCallback(async () => {
    const data = await loadData();
    setRecord(getToothRecord(data, toothId));
    setStatusMaps(buildStatusMaps(data.customStatuses));
  }, [toothId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const handleStatusChange = async (status: ToothStatus) => {
    setPickerVisible(false);
    await setToothStatus(toothId, status);
    refresh();
  };

  const openAdd = () => {
    router.push(`/add-record?toothId=${toothId}`);
  };

  const openEdit = (change: ToothChange) => {
    router.push(`/edit-record?toothId=${toothId}&changeId=${change.id}`);
  };

  const deleteChange = (change: ToothChange) => {
    Alert.alert("Видалити запис?", `"${change.title}"`, [
      { text: "Скасувати", style: "cancel" },
      {
        text: "Видалити",
        style: "destructive",
        onPress: async () => {
          await deleteToothChange(toothId, change.id);
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

  const currentStatus = record?.currentStatus;
  const currentStatusLabel = currentStatus
    ? (statusMaps.labels[currentStatus] ?? currentStatus)
    : "Не встановлено";
  const currentStatusColor = currentStatus
    ? (statusMaps.borderColors[currentStatus] ?? "#999")
    : "#999";

  return (
    <>
      <Stack.Screen
        options={{
          title: `Зуб ${toothId}`,
          headerRight: () => (
            <Pressable onPress={openAdd} hitSlop={8} style={{}}>
              <Ionicons name="add" size={36} color="#2d5a4a" />
            </Pressable>
          ),
        }}
      />
      <View style={styles.safe}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={{
            paddingTop: insets.top + 56,
            paddingBottom: insets.bottom + 20,
          }}
        >
          <View style={styles.header}>
            <Text style={styles.subtitle}>{quadrantLabel}</Text>
            <Text style={styles.subtitle}>{toothLabel}</Text>
          </View>

          <View style={styles.statusSection}>
            <Text style={styles.statusTitle}>Статус зуба</Text>
            <Pressable
              style={styles.dropdown}
              onPress={() => setPickerVisible(true)}
            >
              <View style={styles.dropdownLeft}>
                <View
                  style={[styles.dot, { backgroundColor: currentStatusColor }]}
                />
                <Text style={styles.dropdownText}>{currentStatusLabel}</Text>
              </View>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </Pressable>
            <Modal
              visible={pickerVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setPickerVisible(false)}
            >
              <Pressable
                style={styles.modalBackdrop}
                onPress={() => setPickerVisible(false)}
              >
                <View
                  style={styles.modalCard}
                  onStartShouldSetResponder={() => true}
                >
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Оберіть статус</Text>
                    <Pressable
                      onPress={() => setPickerVisible(false)}
                      hitSlop={12}
                    >
                      <Text style={styles.modalDone}>Готово</Text>
                    </Pressable>
                  </View>
                  <View style={styles.statusList}>
                    {[["", "Не встановлено"], ...statusMaps.options].map(
                      ([value, label]) => {
                        const isSelected = (currentStatus ?? "") === value;
                        const color =
                          value === ""
                            ? "#999"
                            : (statusMaps.borderColors[value] ?? "#999");
                        return (
                          <Pressable
                            key={value || "empty"}
                            style={({ pressed }) => [
                              styles.statusOption,
                              isSelected && styles.statusOptionSelected,
                              pressed && styles.statusOptionPressed,
                            ]}
                            onPress={() =>
                              handleStatusChange(value as ToothStatus)
                            }
                          >
                            <View
                              style={[
                                styles.statusOptionDot,
                                { backgroundColor: color },
                              ]}
                            />
                            <Text
                              style={[
                                styles.statusOptionText,
                                isSelected && styles.statusOptionTextSelected,
                              ]}
                            >
                              {label}
                            </Text>
                            {isSelected && (
                              <Ionicons
                                name="checkmark-circle"
                                size={22}
                                color="#2d5a4a"
                                style={styles.statusOptionCheck}
                              />
                            )}
                          </Pressable>
                        );
                      },
                    )}
                  </View>
                </View>
              </Pressable>
            </Modal>
            <Pressable
              style={styles.manageBtn}
              onPress={() => router.push("/statuses")}
            >
              <Ionicons name="settings-outline" size={16} color="#5a7a6a" />
              <Text style={styles.manageBtnText}>Керувати статусами</Text>
            </Pressable>
          </View>

          {record && record.changes.length === 0 ? (
            <Text style={styles.empty}>
              Історія змін порожня. Додайте перший запис.
            </Text>
          ) : (
            <View style={styles.list}>
              {record?.changes.map((c) => (
                <View key={c.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{c.title}</Text>
                    <Text style={styles.cardDate}>{formatDate(c.date)}</Text>
                  </View>
                  {c.status && (
                    <View style={styles.cardStatusRow}>
                      <View
                        style={[
                          styles.dotSmall,
                          {
                            backgroundColor:
                              statusMaps.borderColors[c.status] ?? "#999",
                          },
                        ]}
                      />
                      <Text style={styles.cardStatus}>
                        {statusMaps.labels[c.status] ?? c.status}
                      </Text>
                    </View>
                  )}
                  {c.notes ? (
                    <Text style={styles.cardNotes}>{c.notes}</Text>
                  ) : null}
                  {c.imageUri && (
                    <Image
                      source={{ uri: c.imageUri }}
                      style={styles.cardImage}
                    />
                  )}
                  <View style={styles.cardActions}>
                    <Pressable
                      onPress={() => openEdit(c)}
                      style={styles.cardBtn}
                    >
                      <Text style={styles.cardBtnText}>Редагувати</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => deleteChange(c)}
                      style={styles.cardBtn}
                    >
                      <Text style={[styles.cardBtnText, styles.deleteBtnText]}>
                        Видалити
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f0f5f2" },
  container: { flex: 1 },
  header: {
    padding: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e8e4",
  },
  toothId: { fontSize: 24, fontWeight: "700", color: "#1a3d32" },
  subtitle: { fontSize: 14, color: "#5a7a6a", marginTop: 4 },
  statusSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e8e4",
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a3d32",
    marginBottom: 10,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d0d8d4",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dropdownText: {
    fontSize: 16,
    color: "#1a3d32",
    fontWeight: "500",
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "100%",
    maxWidth: 340,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e8ece8",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a3d32",
  },
  modalDone: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d5a4a",
  },
  statusList: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  statusOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 12,
  },
  statusOptionSelected: {
    backgroundColor: "#e8f5ee",
  },
  statusOptionPressed: {
    backgroundColor: "#f0f5f2",
  },
  statusOptionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusOptionText: {
    flex: 1,
    fontSize: 16,
    color: "#3d5a4a",
  },
  statusOptionTextSelected: {
    fontWeight: "600",
    color: "#1a3d32",
  },
  statusOptionCheck: {
    marginLeft: "auto",
  },
  manageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    marginTop: 8,
  },
  manageBtnText: {
    fontSize: 14,
    color: "#5a7a6a",
    fontWeight: "500",
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
  cardStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  cardStatus: { fontSize: 13, color: "#2d5a4a" },
  cardNotes: { fontSize: 14, color: "#3d5a4a", marginTop: 8 },
  cardImage: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    marginTop: 10,
    backgroundColor: "#e0e0e0",
  },
  cardActions: { flexDirection: "row", marginTop: 12, gap: 12 },
  cardBtn: { paddingVertical: 6, paddingHorizontal: 12 },
  cardBtnText: { fontSize: 14, color: "#2d5a4a", fontWeight: "600" },
  deleteBtnText: { color: "#a04040" },
});
