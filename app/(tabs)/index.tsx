import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useAppTheme } from "../../src/theme";
import { StatusPickerModal } from "../../src/components/StatusPickerModal";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { DentalChart } from "../../src/components/DentalChart";
import { loadData, setToothStatus } from "../../src/store/teethStore";
import { getProfiles, getCurrentProfileId } from "../../src/store/profileStore";
import { buildStatusMaps, TOOTH_NAMES } from "../../src/types";
import type { ToothId, ToothStatus, StatusMaps } from "../../src/types";

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

  const refresh = useCallback(async () => {
    const [data, profiles, currentId] = await Promise.all([
      loadData(),
      getProfiles(),
      getCurrentProfileId(),
    ]);
    const map: Record<ToothId, ToothStatus | undefined> = {};
    Object.values(data.teeth).forEach((r) => {
      if (r.currentStatus) map[r.toothId] = r.currentStatus;
    });
    setTeethStatuses(map);
    setStatusMaps(buildStatusMaps(data.customStatuses));
    const current = profiles.find((p) => p.id === currentId);
    setProfileName(current?.name ?? "");
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

  const profileBadgeBg = colors.isDark
    ? "rgba(30,50,40,0.85)"
    : "rgba(255,255,255,0.92)";
  const btnBorder = colors.isDark ? "transparent" : "rgba(0,0,0,0.1)";
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {profileName ? (
        <Pressable
          style={[
            styles.profileBadge,
            {
              top: insets.top + 10,
              backgroundColor: profileBadgeBg,
              borderColor: btnBorder,
              borderWidth: 1,
            },
          ]}
          onPress={() => router.push("/profiles")}
          hitSlop={6}
        >
          <Ionicons
            name="person-circle-outline"
            size={18}
            color={colors.accent}
          />
          <Text
            style={[styles.profileBadgeText, { color: colors.text }]}
            numberOfLines={1}
          >
            {profileName}
          </Text>
        </Pressable>
      ) : null}

      <Pressable
        onPress={() => setShowStatuses((v) => !v)}
        style={[
          styles.eyeBtn,
          {
            top: insets.top + 8,
            backgroundColor: profileBadgeBg,
            borderColor: btnBorder,
            borderWidth: 1,
          },
        ]}
        hitSlop={8}
      >
        <Ionicons
          name={showStatuses ? "eye" : "eye-off"}
          size={22}
          color={showStatuses ? colors.accent : colors.textTertiary}
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
        currentStatus={popupTooth ? teethStatuses[popupTooth] : undefined}
        statusMaps={statusMaps}
        onSelect={handleStatusSelect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center" },
  chartArea: { alignItems: "center" },
  profileBadge: {
    position: "absolute",
    left: 16,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: 180,
  },
  profileBadgeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  eyeBtn: {
    position: "absolute",
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 24,
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
  },
});
