import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { View, Text, StyleSheet, PanResponder, Pressable } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
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
import { buildStatusMaps, STATUS_LABELS } from "../../src/types";
import type {
  ToothId,
  ToothStatus,
  StatusMaps,
  ToothRecord,
} from "../../src/types";
import { Host, Button, HStack, Spacer } from "@expo/ui/swift-ui";
import { useTranslation } from "react-i18next";

const THUMB_SIZE = 22;
const HINT_DISMISSED_KEY = "@teeth_manager_chart_hint_dismissed";

function HistorySlider({
  index,
  total,
  onChange,
  label,
  colors,
}: {
  index: number;
  total: number;
  onChange: (i: number) => void;
  label: string;
  colors: any;
}) {
  const trackWidth = useRef(0);
  const [trackW, setTrackW] = useState(0);
  const indexRef = useRef(index);
  const totalRef = useRef(total);
  const startIndex = useRef(index);

  indexRef.current = index;
  totalRef.current = total;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startIndex.current = indexRef.current;
      },
      onPanResponderMove: (_, { dx }) => {
        const t = totalRef.current;
        const usable = trackWidth.current - THUMB_SIZE;
        if (usable <= 0 || t <= 1) return;
        const newI = Math.max(
          0,
          Math.min(
            t - 1,
            Math.round(startIndex.current + (dx / usable) * (t - 1)),
          ),
        );
        onChange(newI);
      },
    }),
  ).current;

  const position = total > 1 ? index / (total - 1) : 1;
  const thumbLeft = position * Math.max(0, trackW - THUMB_SIZE);

  const canPrev = index > 0;
  const canNext = index < total - 1;

  return (
    <View style={sliderStyles.container}>
      <Text style={[sliderStyles.label, { color: colors.text }]}>{label}</Text>
      <View style={sliderStyles.row}>
        <Pressable
          onPress={() => canPrev && onChange(index - 1)}
          hitSlop={10}
          style={sliderStyles.navBtn}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={canPrev ? colors.accent : colors.border}
          />
        </Pressable>

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
              { width: `${position * 100}%`, backgroundColor: colors.accent },
            ]}
          />
          {trackW > 0 &&
            Array.from({ length: total - 1 }, (_, i) => {
              const tickPos = total > 1 ? i / (total - 1) : 0;
              return (
                <View
                  key={i}
                  style={[
                    sliderStyles.tick,
                    { left: tickPos * trackW - 1, backgroundColor: colors.bg },
                  ]}
                />
              );
            })}
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

        <Pressable
          onPress={() => canNext && onChange(index + 1)}
          hitSlop={10}
          style={sliderStyles.navBtn}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={canNext ? colors.accent : colors.border}
          />
        </Pressable>
      </View>
    </View>
  );
}

export default function ChartScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [teethStatuses, setTeethStatuses] = useState<
    Record<ToothId, ToothStatus | undefined>
  >({});
  const [teethData, setTeethData] = useState<Record<ToothId, ToothRecord>>({});
  const [snapshotDates, setSnapshotDates] = useState<number[]>([]);
  const [statusMaps, setStatusMaps] = useState<StatusMaps>(buildStatusMaps());
  const [showStatuses, setShowStatuses] = useState(true);
  const [popupTooth, setPopupTooth] = useState<ToothId | null>(null);
  const [profileName, setProfileName] = useState("");
  const [role, setRole] = useState<string>("owner");
  const [sliderIndex, setSliderIndex] = useState(-1);
  const [showHint, setShowHint] = useState(false);

  const { dataRevision } = useDataSync();
  const { user } = useAuth();
  const canEdit = role !== "viewer";

  useEffect(() => {
    AsyncStorage.getItem(HINT_DISMISSED_KEY).then((val) => {
      if (val !== "true") setShowHint(true);
    });
  }, []);

  const dismissHint = useCallback(() => {
    setShowHint(false);
    AsyncStorage.setItem(HINT_DISMISSED_KEY, "true");
  }, []);

  const refresh = useCallback(async () => {
    const [data, profiles, currentId, r] = await Promise.all([
      loadData(),
      getProfiles(),
      getCurrentProfileId(),
      getCurrentProfileRole(),
    ]);
    const map: Record<ToothId, ToothStatus | undefined> = {};
    Object.values(data.teeth).forEach((rec) => {
      const status = rec.events
        .filter((e) => !!e.statusAfter)
        .sort((a, b) => b.date.localeCompare(a.date))[0]?.statusAfter;
      if (status) map[rec.toothId] = status;
    });
    setTeethStatuses(map);
    setTeethData(data.teeth as Record<ToothId, ToothRecord>);
    const localizedStatusLabels = Object.fromEntries(
      Object.keys(STATUS_LABELS).map((k) => [
        k,
        t(`statusLabels.${k}`, { defaultValue: STATUS_LABELS[k] }),
      ]),
    );
    setStatusMaps(buildStatusMaps(data.customStatuses, localizedStatusLabels));
    const current = profiles.find((p) => p.id === currentId);
    setProfileName(current?.name ?? "");
    setRole(r);
    const dates: number[] = [];
    Object.values(data.teeth).forEach((rec) => {
      rec.events
        .filter((e) => !!e.statusAfter)
        .forEach((e) => dates.push(new Date(e.date).getTime()));
    });
    dates.sort((a, b) => a - b);
    const unique = [...new Set(dates)];
    setSnapshotDates((prevDates) => {
      setSliderIndex((prev) => {
        const last = Math.max(0, unique.length - 1);
        if (prev === -1) return last;
        if (unique.length > prevDates.length) return last;
        return Math.min(prev, last);
      });
      return unique;
    });
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  useEffect(() => {
    if (dataRevision > 0) refresh();
  }, [dataRevision]);

  useEffect(() => {
    refresh();
  }, [i18n.language]);

  const handleToothPress = (toothId: ToothId) => {
    if (!canEdit) return;
    setPopupTooth(toothId);
  };

  const handleToothLongPress = (toothId: ToothId) => {
    router.push(`/tooth/${toothId}`);
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

  const hasHistory = snapshotDates.length > 0;
  const total = snapshotDates.length;

  const selectedDateMs =
    hasHistory && sliderIndex >= 0 && sliderIndex < snapshotDates.length
      ? snapshotDates[sliderIndex]
      : null;

  const displayStatuses = useMemo<
    Record<ToothId, ToothStatus | undefined>
  >(() => {
    if (selectedDateMs === null) return teethStatuses;
    const result: Record<ToothId, ToothStatus | undefined> = {};
    Object.entries(teethData).forEach(([id, record]) => {
      const entry = record.events
        .filter((e) => !!e.statusAfter)
        .sort((a, b) => b.date.localeCompare(a.date))
        .find((e) => new Date(e.date).getTime() <= selectedDateMs);
      result[id as ToothId] = entry?.statusAfter as ToothStatus | undefined;
    });
    return result;
  }, [selectedDateMs, teethData, teethStatuses]);

  const sliderLabel = useMemo(() => {
    const d = (hasHistory && sliderIndex >= 0 && sliderIndex < snapshotDates.length)
      ? new Date(snapshotDates[sliderIndex])
      : new Date();
    return d.toLocaleDateString(i18n.language, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, [sliderIndex, snapshotDates, hasHistory, i18n.language]);

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

      {hasHistory && (
        <View style={{ opacity: showStatuses ? 1 : 0 }}>
          <HistorySlider
            index={sliderIndex}
            total={total}
            onChange={setSliderIndex}
            label={sliderLabel}
            colors={colors}
          />
        </View>
      )}

      {showHint && canEdit && (
        <View
          style={[
            styles.hintCard,
            { backgroundColor: colors.card, shadowColor: colors.shadow },
          ]}
        >
          <View style={styles.hintRows}>
            <View style={styles.hintRow}>
              <Ionicons name="hand-left-outline" size={15} color={colors.accent} />
              <Text style={[styles.hintText, { color: colors.textSecondary }]}>
                {t("chart.hintTap")}
              </Text>
            </View>
            <View style={styles.hintRow}>
              <Ionicons name="finger-print-outline" size={15} color={colors.accent} />
              <Text style={[styles.hintText, { color: colors.textSecondary }]}>
                {t("chart.hintLongPress")}
              </Text>
            </View>
          </View>
          <Pressable onPress={dismissHint} hitSlop={10} style={styles.hintClose}>
            <Ionicons name="close" size={16} color={colors.textTertiary} />
          </Pressable>
        </View>
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
        title={
          popupTooth
            ? `${t("tooth.title", { id: popupTooth })} — ${t(`toothNames.${popupTooth[1]}`, { defaultValue: "" })}`
            : ""
        }
        selected={popupTooth ? teethStatuses[popupTooth] : undefined}
        maps={statusMaps}
        onSelect={handleStatusSelect}
        onManage={() => {
          router.push("/statuses");
          setPopupTooth(null);
        }}
        manageLabel={t("tooth.manageStatuses")}
        showEmpty={false}
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  navBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  track: {
    flex: 1,
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
  container: { flex: 1, justifyContent: "center", paddingTop: 40 },
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
  hintCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
    gap: 8,
  },
  hintRows: {
    flex: 1,
    gap: 6,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  hintClose: {
    padding: 2,
  },
});
