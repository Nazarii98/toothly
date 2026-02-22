import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable, Modal } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { DentalChart } from "../../src/components/DentalChart";
import { loadData, setToothStatus } from "../../src/store/teethStore";
import { buildStatusMaps, TOOTH_NAMES } from "../../src/types";
import type { ToothId, ToothStatus, StatusMaps } from "../../src/types";

export default function ChartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [teethStatuses, setTeethStatuses] = useState<
    Record<ToothId, ToothStatus | undefined>
  >({});
  const [statusMaps, setStatusMaps] = useState<StatusMaps>(buildStatusMaps());
  const [showStatuses, setShowStatuses] = useState(true);
  const [popupTooth, setPopupTooth] = useState<ToothId | null>(null);

  const refresh = useCallback(async () => {
    const data = await loadData();
    const map: Record<ToothId, ToothStatus | undefined> = {};
    Object.values(data.teeth).forEach((r) => {
      if (r.currentStatus) map[r.toothId] = r.currentStatus;
    });
    setTeethStatuses(map);
    setStatusMaps(buildStatusMaps(data.customStatuses));
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const handleToothPress = (toothId: ToothId) => {
    router.push(`/tooth/${toothId}`);
  };

  const handleToothLongPress = (toothId: ToothId) => {
    setPopupTooth(toothId);
  };

  const handleStatusSelect = async (status: ToothStatus) => {
    if (!popupTooth) return;
    setPopupTooth(null);
    await setToothStatus(popupTooth, status);
    refresh();
  };

  const usedStatuses = [
    ...new Set(Object.values(teethStatuses).filter(Boolean)),
  ] as ToothStatus[];

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => setShowStatuses((v) => !v)}
        style={[styles.eyeBtn, { top: insets.top + 8 }]}
        hitSlop={8}
      >
        <Ionicons
          name={showStatuses ? "eye" : "eye-off"}
          size={22}
          color={showStatuses ? "#2d5a4a" : "#aaa"}
        />
      </Pressable>

      <View style={styles.chartArea}>
        <DentalChart
          onToothPress={handleToothPress}
          onToothLongPress={handleToothLongPress}
          teethStatuses={showStatuses ? teethStatuses : {}}
          statusColors={statusMaps.colors}
          statusBorderColors={statusMaps.borderColors}
        />
      </View>

      <View
        style={[styles.legend, { marginBottom: insets.bottom, marginTop: 10 }]}
      >
        {showStatuses && usedStatuses.length > 0
          ? usedStatuses.map((s) => (
              <View key={s} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: statusMaps.borderColors[s] ?? "#999" },
                  ]}
                />
                <Text style={styles.legendText}>
                  {statusMaps.labels[s] ?? s}
                </Text>
              </View>
            ))
          : null}
      </View>

      <Modal
        visible={popupTooth !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPopupTooth(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setPopupTooth(null)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Зуб {popupTooth} —{" "}
                {popupTooth ? (TOOTH_NAMES[popupTooth[1]] ?? "") : ""}
              </Text>
              <Pressable onPress={() => setPopupTooth(null)} hitSlop={12}>
                <Text style={styles.modalDone}>Готово</Text>
              </Pressable>
            </View>
            <View style={styles.statusList}>
              {[
                ["", "Не встановлено"] as [string, string],
                ...statusMaps.options,
              ].map(([value, label]) => {
                const currentStatus = popupTooth
                  ? teethStatuses[popupTooth]
                  : undefined;
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
                    onPress={() => handleStatusSelect(value as ToothStatus)}
                  >
                    <View
                      style={[styles.statusDot, { backgroundColor: color }]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        isSelected && styles.statusTextSelected,
                      ]}
                    >
                      {label}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color="#2d5a4a"
                        style={styles.statusCheck}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", justifyContent: "center" },
  chartArea: { alignItems: "center" },
  eyeBtn: {
    position: "absolute",
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingHorizontal: 16,
    height: 36,
    gap: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: "#444",
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
    maxWidth: 360,
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
    padding: 12,
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
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    flex: 1,
    fontSize: 16,
    color: "#3d5a4a",
  },
  statusTextSelected: {
    fontWeight: "600",
    color: "#1a3d32",
  },
  statusCheck: {
    marginLeft: "auto",
  },
});
