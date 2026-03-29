import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { View, Text, StyleSheet, PanResponder } from "react-native";
import { useAppTheme } from "../../src/theme";
import { StatusPickerModal } from "../../src/components/StatusPickerModal";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDataSync } from "../../src/DataSyncProvider";
import { DentalChart } from "../../src/components/DentalChart";
import { loadData, setToothStatus } from "../../src/store/teethStore";
import { useAuth } from "../../src/AuthProvider";
import {
  getProfiles,
  getCurrentProfileId,
  getCurrentProfileRole,
} from "../../src/store/profileStore";
import { buildStatusMaps, TOOTH_NAMES } from "../../src/types";
import type {
  ToothId,
  ToothStatus,
  StatusMaps,
  ToothRecord,
} from "../../src/types";
import { Host, Button, HStack, Spacer } from "@expo/ui/swift-ui";
import { useTranslation } from "react-i18next";

const THUMB_SIZE = 22;

function HistorySlider({
  value,
  onChange,
  label,
  colors,
  tickPositions,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  colors: any;
  tickPositions: number[];
}) {
  const trackWidth = useRef(0);
  const [trackW, setTrackW] = useState(0);
  const valueRef = useRef(value);
  const startVal = useRef(value);

  valueRef.current = value;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startVal.current = valueRef.current;
      },
      onPanResponderMove: (_, { dx }) => {
        const usable = trackWidth.current - THUMB_SIZE;
        if (usable <= 0) return;
        const newV = Math.max(0, Math.min(1, startVal.current + dx / usable));
        onChange(newV);
      },
    }),
  ).current;

  const thumbLeft = value * Math.max(0, trackW - THUMB_SIZE);

  return (
    <View style={sliderStyles.container}>
      <Text style={[sliderStyles.label, { color: colors.text }]}>{label}</Text>
      <View
        style={[sliderStyles.track, { backgroundColor: colors.border }]}
        onLayout={(e) => {
          trackWidth.current = e.nativeEvent.layout.width;
          setTrackW(e.nativeEvent.layout.width);
        }}
        {...panResponder.panHandlers}
      >
        <View
          style={[
            sliderStyles.fill,
            { width: `${value * 100}%`, backgroundColor: colors.accent },
          ]}
        />
        {trackW > 0 &&
          tickPositions.map((pos, i) => (
            <View
              key={i}
              style={[
                sliderStyles.tick,
                { left: pos * trackW - 1, backgroundColor: colors.bg },
              ]}
            />
          ))}
        <View
          style={[
            sliderStyles.thumb,
            {
              left: thumbLeft,
              backgroundColor: colors.white,
              borderColor: colors.accent,
            },
          ]}
        />
      </View>
    </View>
  );
}

export default function ChartScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [teethStatuses, setTeethStatuses] = useState<
    Record<ToothId, ToothStatus | undefined>
  >({});
  const [teethData, setTeethData] = useState<Record<ToothId, ToothRecord>>({});
  const [minDateMs, setMinDateMs] = useState<number | null>(null);
  const [statusMaps, setStatusMaps] = useState<StatusMaps>(buildStatusMaps());
  const [showStatuses, setShowStatuses] = useState(true);
  const [popupTooth, setPopupTooth] = useState<ToothId | null>(null);
  const [profileName, setProfileName] = useState("");
  const [role, setRole] = useState<string>("owner");
  const [sliderValue, setSliderValue] = useState(1);

  const { dataRevision } = useDataSync();
  const { user } = useAuth();
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
    setTeethData(data.teeth as Record<ToothId, ToothRecord>);
    setStatusMaps(buildStatusMaps(data.customStatuses));
    const current = profiles.find((p) => p.id === currentId);
    setProfileName(current?.name ?? "");
    setRole(r);
    setSliderValue(1);
    let earliest = Infinity;
    Object.values(data.teeth).forEach((rec) => {
      (rec.statusHistory ?? []).forEach((e) => {
        const t = new Date(e.date).getTime();
        if (t < earliest) earliest = t;
      });
    });
    if (earliest !== Infinity) {
      const now = Date.now();
      const range = now - earliest;
      const padding = range > 0 ? range * 0.1 : 24 * 60 * 60 * 1000;
      setMinDateMs(earliest - padding);
    } else {
      setMinDateMs(null);
    }
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
    await setToothStatus(
      popupTooth,
      status,
      user?.uid ?? "",
      user?.email ?? "",
    );
    refresh();
  };

  const hasHistory = minDateMs !== null;
  const maxDateMs = useRef(Date.now()).current;

  const tickPositions = useMemo(() => {
    if (!hasHistory) return [];
    const range = maxDateMs - minDateMs!;
    if (range <= 0) return [];
    const dates: number[] = [];
    Object.values(teethData).forEach((rec) => {
      (rec.statusHistory ?? []).forEach((e) => {
        dates.push(new Date(e.date).getTime());
      });
    });
    return dates.map((d) => (d - minDateMs!) / range);
  }, [teethData, minDateMs, maxDateMs, hasHistory]);

  const selectedDateMs = useMemo(() => {
    if (!hasHistory || sliderValue >= 1) return null;
    return minDateMs! + sliderValue * (maxDateMs - minDateMs!);
  }, [sliderValue, minDateMs, maxDateMs, hasHistory]);

  const displayStatuses = useMemo<
    Record<ToothId, ToothStatus | undefined>
  >(() => {
    if (selectedDateMs === null) return teethStatuses;
    const result: Record<ToothId, ToothStatus | undefined> = {};
    Object.entries(teethData).forEach(([id, record]) => {
      const entry = (record.statusHistory ?? []).find(
        (e) => new Date(e.date).getTime() <= selectedDateMs,
      );
      result[id as ToothId] = entry?.status as ToothStatus | undefined;
    });
    return result;
  }, [selectedDateMs, teethData, teethStatuses]);

  const sliderLabel = useMemo(() => {
    if (!hasHistory || sliderValue >= 1) return t("common.now");
    const d = new Date(selectedDateMs!);
    return d.toLocaleDateString("uk-UA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, [sliderValue, selectedDateMs, hasHistory]);

  const usedStatuses = [
    ...new Set(Object.values(displayStatuses).filter(Boolean)),
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
          teethStatuses={showStatuses ? displayStatuses : {}}
          statusColors={statusMaps.colors}
          statusBorderColors={statusMaps.borderColors}
        />
      </View>

      {hasHistory && showStatuses && (
        <HistorySlider
          value={sliderValue}
          onChange={setSliderValue}
          label={sliderLabel}
          colors={colors}
          tickPositions={tickPositions}
        />
      )}

      <View
        style={[styles.legend, { marginBottom: insets.bottom, marginTop: 4 }]}
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
        onManage={() => {
          router.push("/statuses");
          setPopupTooth(null);
        }}
        manageLabel="Керувати статусами"
      />
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  track: {
    height: 4,
    borderRadius: 2,
    overflow: "visible",
  },
  tick: {
    position: "absolute",
    width: 2,
    height: 8,
    top: -2,
    borderRadius: 1,
  },
  fill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 2,
  },
  thumb: {
    position: "absolute",
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    top: -(THUMB_SIZE / 2 - 2),
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
});

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
