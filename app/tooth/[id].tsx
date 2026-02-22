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
import { buildStatusMaps } from "../../src/types";
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
          headerBackTitle: "Назад",
          headerRight: () => (
            <Pressable
              onPress={openAdd}
              hitSlop={8}
              style={styles.headerAddBtn}
            >
              <Ionicons name="add" size={26} color="#fff" />
            </Pressable>
          ),
        }}
      />
      <View style={styles.safe}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + 60,
              paddingBottom: insets.bottom + 24,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.statusCard}>
            <Text style={styles.sectionLabel}>Поточний статус</Text>
            <Pressable
              style={styles.statusTrigger}
              onPress={() => setPickerVisible(true)}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: currentStatusColor },
                ]}
              />
              <Text style={styles.statusTriggerText}>{currentStatusLabel}</Text>
              <Ionicons name="chevron-forward" size={18} color="#8a9a90" />
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
                  <View style={styles.statusSectionFooter}>
                    <Pressable
                      style={styles.manageBtn}
                      hitSlop={12}
                      onPress={() => {
                        router.push("/statuses");
                        setPickerVisible(false);
                      }}
                    >
                      <Ionicons
                        name="settings-outline"
                        size={16}
                        color="#5a7a6a"
                      />
                      <Text style={styles.manageBtnText}>
                        Керувати статусами
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            </Modal>
          </View>

          <View style={styles.historySection}>
            <Text style={styles.sectionLabel}>Історія змін</Text>
            {record && record.changes.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="document-text-outline"
                  size={40}
                  color="#b0c0b8"
                />
                <Text style={styles.emptyTitle}>Ще немає записів</Text>
                <Text style={styles.emptyHint}>
                  Додайте перший запис про лікування або огляд
                </Text>
                <Pressable style={styles.emptyCta} onPress={openAdd}>
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.emptyCtaText}>Додати запис</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.recordList}>
                {record?.changes.map((c) => (
                  <View key={c.id} style={styles.recordCard}>
                    <View style={styles.recordCardTop}>
                      <Text style={styles.recordTitle} numberOfLines={2}>
                        {c.title}
                      </Text>
                      <Text style={styles.recordDate}>
                        {formatDate(c.date)}
                      </Text>
                    </View>
                    {c.status && (
                      <View style={styles.recordBadge}>
                        <View
                          style={[
                            styles.recordBadgeDot,
                            {
                              backgroundColor:
                                statusMaps.borderColors[c.status] ?? "#999",
                            },
                          ]}
                        />
                        <Text style={styles.recordBadgeText}>
                          {statusMaps.labels[c.status] ?? c.status}
                        </Text>
                      </View>
                    )}
                    {c.notes ? (
                      <Text style={styles.recordNotes} numberOfLines={2}>
                        {c.notes}
                      </Text>
                    ) : null}
                    {c.imageUri && (
                      <Image
                        source={{ uri: c.imageUri }}
                        style={styles.recordImage}
                      />
                    )}
                    <View style={styles.recordActions}>
                      <Pressable
                        onPress={() => openEdit(c)}
                        style={styles.recordBtnEdit}
                      >
                        <Ionicons name="pencil" size={14} color="#2d5a4a" />
                        <Text style={styles.recordBtnEditText}>Редагувати</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => deleteChange(c)}
                        style={styles.recordBtnDelete}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={14}
                          color="#a04040"
                        />
                        <Text style={styles.recordBtnDeleteText}>Видалити</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f2f6f4" },
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  headerAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  statusCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#1a3d32",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8a9a90",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  statusTrigger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f8f6",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusTriggerText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#1a3d32",
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
  statusSectionFooter: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e8ece8",
  },
  manageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  manageBtnText: {
    fontSize: 14,
    color: "#5a7a6a",
    fontWeight: "500",
  },
  historySection: {},
  emptyState: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#1a3d32",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1a3d32",
    marginTop: 12,
  },
  emptyHint: {
    fontSize: 14,
    color: "#7a9a8a",
    marginTop: 4,
    textAlign: "center",
  },
  emptyCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
    backgroundColor: "#2d5a4a",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  emptyCtaText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  recordList: { gap: 12 },
  recordCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#1a3d32",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  recordCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  recordTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: "#1a3d32",
    lineHeight: 22,
  },
  recordDate: {
    fontSize: 12,
    color: "#8a9a90",
    fontWeight: "500",
  },
  recordBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  recordBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  recordBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2d5a4a",
  },
  recordNotes: {
    fontSize: 14,
    color: "#5a6a5a",
    marginTop: 8,
    lineHeight: 20,
  },
  recordImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginTop: 12,
    backgroundColor: "#e8ece8",
  },
  recordActions: {
    flexDirection: "row",
    marginTop: 12,
    gap: 16,
    alignItems: "center",
  },
  recordBtnEdit: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  recordBtnEditText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2d5a4a",
  },
  recordBtnDelete: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  recordBtnDeleteText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#a04040",
  },
});
