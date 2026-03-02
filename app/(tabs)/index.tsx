import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAppTheme } from "../../src/theme";
import { StatusPickerModal } from "../../src/components/StatusPickerModal";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDataSync } from "../../src/DataSyncProvider";
import { DentalChart } from "../../src/components/DentalChart";
import { loadData, setToothStatus } from "../../src/store/teethStore";
import {
  getProfiles,
  getCurrentProfileId,
  getCurrentProfileRole,
} from "../../src/store/profileStore";
import { buildStatusMaps, TOOTH_NAMES } from "../../src/types";
import type { ToothId, ToothStatus, StatusMaps } from "../../src/types";
import { Host, Button, HStack, Spacer } from "@expo/ui/swift-ui";

export default function ChartScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [teethStatuses, setTeethStatuses] = useState<
    Record<ToothId, ToothStatus | undefined>
  >({});
  const [statusMaps, setStatusMaps] = useState<StatusMaps>(buildStatusMaps());
  const [showStatuses, setShowStatuses] = useState(true);
  const [popupTooth, setPopupTooth] = useState<ToothId | null>(null);
  const [profileName, setProfileName] = useState("");
  const [role, setRole] = useState<string>("owner");

  const { dataRevision } = useDataSync();
  const canEdit = role !== "viewer";

  const refresh = useCallback(async () => {
    const [data, profiles, currentId, r] = await Promise.all([
      loadData(),
      getProfiles(),
      getCurrentProfileId(),
      getCurrentProfileRole(),
    ]);
    const map: Record<ToothId, ToothStatus | undefined> = {};
    Object.values(data.teeth).forEach((rec) => {
      if (rec.currentStatus) map[rec.toothId] = rec.currentStatus;
    });
    setTeethStatuses(map);
    setStatusMaps(buildStatusMaps(data.customStatuses));
    const current = profiles.find((p) => p.id === currentId);
    setProfileName(current?.name ?? "");
    setRole(r);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  useEffect(() => {
    if (dataRevision > 0) refresh();
  }, [dataRevision]);

  const handleToothPress = (toothId: ToothId) => {
    router.push(`/tooth/${toothId}`);
  };

  const handleToothLongPress = (toothId: ToothId) => {
    if (!canEdit) return;
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

  const scheme = colors.isDark ? "dark" : "light";
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Host
        colorScheme={scheme}
        style={[styles.topBar, { top: insets.top + 8 }]}
      >
        <HStack alignment="center">
          {profileName ? (
            <Button
              variant="glass"
              systemImage="person.circle"
              onPress={() => router.push("/profiles")}
              color={colors.accent}
              controlSize="large"
            >
              {profileName}
            </Button>
          ) : null}
          <Spacer />
          <Button
            variant="glass"
            systemImage={showStatuses ? "eye" : "eye.slash"}
            onPress={() => setShowStatuses((v) => !v)}
            color={showStatuses ? colors.accent : colors.textTertiary}
            controlSize="large"
          />
        </HStack>
      </Host>

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
                <Text
                  style={[styles.legendText, { color: colors.textSecondary }]}
                >
                  {statusMaps.labels[s] ?? s}
                </Text>
              </View>
            ))
          : null}
      </View>

      <StatusPickerModal
        visible={popupTooth !== null}
        onClose={() => setPopupTooth(null)}
        title={`Зуб ${popupTooth} — ${popupTooth ? (TOOTH_NAMES[popupTooth[1]] ?? "") : ""}`}
        selected={popupTooth ? teethStatuses[popupTooth] : undefined}
        maps={statusMaps}
        onSelect={handleStatusSelect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center" },
  chartArea: { alignItems: "center" },
  topBar: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 10,
    height: 36,
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
  },
});
