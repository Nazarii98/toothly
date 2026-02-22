import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { DentalChart } from "../../src/components/DentalChart";
import { loadData } from "../../src/store/teethStore";
import { buildStatusMaps } from "../../src/types";
import type { ToothId, ToothStatus, StatusMaps } from "../../src/types";

export default function ChartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [teethStatuses, setTeethStatuses] = useState<
    Record<ToothId, ToothStatus | undefined>
  >({});
  const [statusMaps, setStatusMaps] = useState<StatusMaps>(buildStatusMaps());
  const [showStatuses, setShowStatuses] = useState(true);

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
          teethStatuses={showStatuses ? teethStatuses : {}}
          statusColors={statusMaps.colors}
          statusBorderColors={statusMaps.borderColors}
        />
      </View>

      <View style={[styles.legend, { marginBottom: insets.bottom + 50 }]}>
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
});
