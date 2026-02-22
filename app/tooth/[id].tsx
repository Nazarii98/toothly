import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ScrollView,
  Image,
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
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

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
    setStatusDropdownOpen(false);
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
            <View style={styles.statusSectionHeader}>
              <Text style={styles.statusTitle}>Статус зуба</Text>
              <Pressable
                style={styles.dropdown}
                onPress={() => setStatusDropdownOpen(!statusDropdownOpen)}
              >
                <View style={styles.dropdownLeft}>
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: currentStatusColor },
                    ]}
                  />
                  <Text style={styles.dropdownText}>{currentStatusLabel}</Text>
                </View>
                <Ionicons
                  name={statusDropdownOpen ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#666"
                />
              </Pressable>
            </View>
            {statusDropdownOpen && (
              <View style={styles.dropdownList}>
                {statusMaps.options.map(([value, label]) => {
                  const isActive = currentStatus === value;
                  const color = statusMaps.borderColors[value];
                  return (
                    <Pressable
                      key={value}
                      style={({ pressed }) => [
                        styles.dropdownItem,
                        isActive && styles.dropdownItemActive,
                        pressed && styles.dropdownItemPressed,
                      ]}
                      onPress={() => handleStatusChange(value as ToothStatus)}
                    >
                      <View style={[styles.dot, { backgroundColor: color }]} />
                      <Text
                        style={[
                          styles.dropdownItemText,
                          isActive && styles.dropdownItemTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                      {isActive && (
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color="#2d5a4a"
                          style={{ marginLeft: "auto" }}
                        />
                      )}
                    </Pressable>
                  );
                })}
                <Pressable
                  style={styles.manageBtn}
                  onPress={() => {
                    setStatusDropdownOpen(false);
                    router.push("/statuses");
                  }}
                >
                  <Ionicons name="settings-outline" size={16} color="#5a7a6a" />
                  <Text style={styles.manageBtnText}>Керувати статусами</Text>
                </Pressable>
              </View>
            )}
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
  statusSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
  dropdownList: {
    marginTop: 6,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d0d8d4",
    borderRadius: 12,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e8ece8",
  },
  dropdownItemActive: {
    backgroundColor: "#e8f5ee",
  },
  dropdownItemPressed: {
    backgroundColor: "#f0f5f2",
  },
  dropdownItemText: {
    fontSize: 15,
    color: "#1a3d32",
  },
  dropdownItemTextActive: {
    fontWeight: "600",
  },
  manageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#d0d8d4",
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
