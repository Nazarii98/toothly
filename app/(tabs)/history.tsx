import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useAppTheme } from "../../src/theme";
import { useDataSync } from "../../src/DataSyncProvider";
import { loadData } from "../../src/store/teethStore";
import {
  QUADRANT_LABELS,
  TOOTH_NAMES,
  GLOBAL_PROCEDURE_TYPES,
  buildStatusMaps,
} from "../../src/types";
import type { ToothChange, GlobalProcedure, StatusMaps } from "../../src/types";

type HistoryItem =
  | { type: "tooth"; data: ToothChange }
  | { type: "global"; data: GlobalProcedure };

type ViewMode = "month" | "year";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];
const MONTH_NAMES = [
  "Січень",
  "Лютий",
  "Березень",
  "Квітень",
  "Травень",
  "Червень",
  "Липень",
  "Серпень",
  "Вересень",
  "Жовтень",
  "Листопад",
  "Грудень",
];
const MONTH_SHORT = [
  "Січ",
  "Лют",
  "Бер",
  "Кві",
  "Тра",
  "Чер",
  "Лип",
  "Сер",
  "Вер",
  "Жов",
  "Лис",
  "Гру",
];

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isoToDateKey(iso: string): string {
  return iso.slice(0, 10);
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("uk-UA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const CALENDAR_ROWS = 6;

function getCalendarDays(year: number, month: number) {
  const lastDay = new Date(year, month + 1, 0).getDate();
  let startDow = new Date(year, month, 1).getDay() - 1;
  if (startDow < 0) startDow = 6;
  const days: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= lastDay; d++) days.push(d);
  while (days.length < CALENDAR_ROWS * 7) days.push(null);
  return days;
}

function getMiniMonthDays(year: number, month: number) {
  const lastDay = new Date(year, month + 1, 0).getDate();
  let startDow = new Date(year, month, 1).getDay() - 1;
  if (startDow < 0) startDow = 6;
  const days: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= lastDay; d++) days.push(d);
  while (days.length < CALENDAR_ROWS * 7) days.push(null);
  return days;
}

export default function HistoryScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const { dataRevision } = useDataSync();

  const today = new Date();
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [allItems, setAllItems] = useState<HistoryItem[]>([]);
  const [statusMaps, setStatusMaps] = useState<StatusMaps>(buildStatusMaps());

  const refresh = useCallback(async () => {
    const appData = await loadData();
    setStatusMaps(buildStatusMaps(appData.customStatuses));
    const items: HistoryItem[] = [];
    Object.values(appData.teeth).forEach((r) => {
      r.changes.forEach((c) => items.push({ type: "tooth", data: c }));
    });
    appData.globalProcedures.forEach((p) =>
      items.push({ type: "global", data: p }),
    );
    items.sort((a, b) => b.data.date.localeCompare(a.data.date));
    setAllItems(items);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  useEffect(() => {
    if (dataRevision > 0) refresh();
  }, [dataRevision]);

  const itemsByDate = useMemo(() => {
    const map = new Map<string, HistoryItem[]>();
    allItems.forEach((item) => {
      const key = isoToDateKey(item.data.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    });
    return map;
  }, [allItems]);

  const todayKey = toDateKey(today);

  const calendarDays = useMemo(
    () => getCalendarDays(year, month),
    [year, month],
  );

  const goToPrev = () => {
    if (viewMode === "year") {
      setYear((y) => y - 1);
    } else if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goToNext = () => {
    if (viewMode === "year") {
      setYear((y) => y + 1);
    } else if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  };

  const periodItems = useMemo(() => {
    if (viewMode === "month") {
      const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
      return allItems.filter((i) => i.data.date.startsWith(prefix));
    }
    const prefix = `${year}-`;
    return allItems.filter((i) => i.data.date.startsWith(prefix));
  }, [allItems, viewMode, year, month]);

  const recentItems = periodItems.slice(0, 3);

  const periodLabel =
    viewMode === "month"
      ? `за ${MONTH_NAMES[month].toLowerCase()} ${year}`
      : `за ${year} рік`;

  const countForMonth = useCallback(
    (m: number) => {
      const prefix = `${year}-${String(m + 1).padStart(2, "0")}`;
      let count = 0;
      itemsByDate.forEach((items, key) => {
        if (key.startsWith(prefix)) count += items.length;
      });
      return count;
    },
    [itemsByDate, year],
  );

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={["top"]}
    >
      {/* View mode toggle */}
      <View style={styles.toggleRow}>
        <SegmentedControl
          values={["Місяць", "Рік"]}
          selectedIndex={viewMode === "month" ? 0 : 1}
          onChange={(e) => {
            setViewMode(
              e.nativeEvent.selectedSegmentIndex === 0 ? "month" : "year",
            );
          }}
          style={styles.segmented}
          tintColor={colors.accent}
          fontStyle={{ color: colors.textSecondary, fontSize: 14 }}
          activeFontStyle={{
            color: colors.white,
            fontWeight: "600",
            fontSize: 14,
          }}
        />
      </View>

      {/* Navigation header */}
      <View style={styles.header}>
        <Pressable onPress={goToPrev} hitSlop={12} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.accent} />
        </Pressable>
        <Pressable onPress={goToToday} hitSlop={8}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {viewMode === "month" ? `${MONTH_NAMES[month]} ${year}` : `${year}`}
          </Text>
        </Pressable>
        <Pressable onPress={goToNext} hitSlop={12} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={22} color={colors.accent} />
        </Pressable>
      </View>

      {/* Month view */}
      {viewMode === "month" && (
        <View style={[styles.calendarCard, { backgroundColor: colors.card }]}>
          <View style={styles.weekRow}>
            {WEEKDAYS.map((d) => (
              <Text
                key={d}
                style={[styles.weekday, { color: colors.textTertiary }]}
              >
                {d}
              </Text>
            ))}
          </View>
          {Array.from({ length: calendarDays.length / 7 }, (_, row) => (
            <View key={row} style={styles.weekRow}>
              {calendarDays.slice(row * 7, row * 7 + 7).map((day, col) => {
                if (day === null)
                  return <View key={`e${col}`} style={styles.dayCell} />;
                const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const hasItems = itemsByDate.has(dateKey);
                const isToday = dateKey === todayKey;
                const count = itemsByDate.get(dateKey)?.length ?? 0;
                return (
                  <Pressable
                    key={day}
                    style={[
                      styles.dayCell,
                      isToday && { backgroundColor: colors.accent },
                      hasItems &&
                        !isToday && { backgroundColor: colors.accentBg },
                    ]}
                    onPress={() => {
                      if (hasItems)
                        router.push(`/history-list?date=${dateKey}`);
                    }}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { color: colors.text },
                        isToday && { color: colors.white, fontWeight: "700" },
                        hasItems &&
                          !isToday && {
                            color: colors.accent,
                            fontWeight: "600",
                          },
                      ]}
                    >
                      {day}
                    </Text>
                    {hasItems && (
                      <View
                        style={[
                          styles.dayDot,
                          {
                            backgroundColor: isToday
                              ? colors.white
                              : colors.accent,
                          },
                        ]}
                      />
                    )}
                    {count > 1 && (
                      <Text
                        style={[
                          styles.dayCount,
                          { color: isToday ? colors.white : colors.accent },
                        ]}
                      >
                        {count}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      )}

      {/* Year view */}
      {viewMode === "year" && (
        <View style={styles.yearGrid}>
          {Array.from({ length: 4 }, (_, gridRow) => (
            <View key={gridRow} style={styles.yearRow}>
              {Array.from({ length: 3 }, (_, gridCol) => {
                const m = gridRow * 3 + gridCol;
                const mCount = countForMonth(m);
                const isCurrentMonth =
                  year === today.getFullYear() && m === today.getMonth();
                const miniDays = getMiniMonthDays(year, m);
                return (
                  <Pressable
                    key={m}
                    style={[
                      styles.miniMonth,
                      { backgroundColor: colors.card },
                      isCurrentMonth && {
                        borderColor: colors.accent,
                        borderWidth: 1.5,
                      },
                    ]}
                    onPress={() => {
                      setMonth(m);
                      setViewMode("month");
                    }}
                  >
                    <View style={styles.miniMonthHeader}>
                      <Text
                        style={[
                          styles.miniMonthName,
                          {
                            color: isCurrentMonth ? colors.accent : colors.text,
                          },
                        ]}
                      >
                        {MONTH_SHORT[m]}
                      </Text>
                      {mCount > 0 && (
                        <Text
                          style={[
                            styles.miniMonthCount,
                            { color: colors.accent },
                          ]}
                        >
                          {mCount}
                        </Text>
                      )}
                    </View>
                    <View style={styles.miniGrid}>
                      {Array.from(
                        { length: Math.ceil(miniDays.length / 7) },
                        (_, wr) => (
                          <View key={wr} style={styles.miniWeekRow}>
                            {miniDays.slice(wr * 7, wr * 7 + 7).map((d, ci) => {
                              if (d === null)
                                return (
                                  <View
                                    key={`e${ci}`}
                                    style={styles.miniDayCell}
                                  />
                                );
                              const dk = `${year}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                              const cnt = itemsByDate.get(dk)?.length ?? 0;
                              const isTodayCell = dk === todayKey;
                              return (
                                <View
                                  key={d}
                                  style={[
                                    styles.miniDayCell,
                                    cnt === 1 && {
                                      backgroundColor: colors.accentBg,
                                    },
                                    cnt >= 2 && {
                                      backgroundColor: colors.accent,
                                    },
                                    isTodayCell &&
                                      cnt === 0 && {
                                        borderWidth: 1,
                                        borderColor: colors.accent,
                                      },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.miniDayText,
                                      { color: colors.textTertiary },
                                      cnt >= 1 && {
                                        color: colors.accent,
                                        fontWeight: "600",
                                      },
                                      cnt >= 2 && {
                                        color: colors.white,
                                        fontWeight: "700",
                                      },
                                      isTodayCell &&
                                        cnt === 0 && {
                                          color: colors.accent,
                                          fontWeight: "700",
                                        },
                                    ]}
                                  >
                                    {d}
                                  </Text>
                                </View>
                              );
                            })}
                          </View>
                        ),
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      )}

      {/* Recent records */}
      <View style={styles.recentSection}>
        <View style={styles.recentHeader}>
          <Text
            style={[styles.recentTitle, { color: colors.text }]}
            numberOfLines={1}
          >
            Останні записи {periodLabel}
          </Text>
          <Pressable onPress={() => router.push("/history-list")} hitSlop={8}>
            <Text style={[styles.showAll, { color: colors.accent }]}>
              {periodItems.length > 3
                ? `Усі ${periodItems.length}`
                : "Показати все"}
            </Text>
          </Pressable>
        </View>
        {recentItems.length === 0 && (
          <Text style={[styles.emptyHint, { color: colors.textTertiary }]}>
            Записів поки немає
          </Text>
        )}
        {recentItems.map((item) => {
          const isGlobal = item.type === "global";
          const data = item.data;
          const title = data.title;
          const time = formatTime(data.date);
          const badge = isGlobal ? "GP" : (data as ToothChange).toothId;
          const badgeBg = isGlobal ? colors.textSecondary : colors.accent;
          const onPress = isGlobal
            ? () => router.push("/global-detail")
            : () => router.push(`/tooth/${(data as ToothChange).toothId}`);
          return (
            <Pressable
              key={data.id}
              style={[styles.recentRow, { backgroundColor: colors.card }]}
              onPress={onPress}
            >
              <View style={[styles.recentBadge, { backgroundColor: badgeBg }]}>
                <Text style={[styles.recentBadgeText, { color: colors.white }]}>
                  {badge}
                </Text>
              </View>
              <Text
                style={[styles.recentRowTitle, { color: colors.text }]}
                numberOfLines={1}
              >
                {title}
              </Text>
              <Text
                style={[styles.recentRowTime, { color: colors.textTertiary }]}
              >
                {time}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.chevron}
              />
            </Pressable>
          );
        })}
      </View>

      {/* FAB */}
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: colors.accent, shadowColor: colors.shadow },
          pressed && styles.fabPressed,
        ]}
        onPress={() => router.push("/add-record")}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  toggleRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    alignItems: "center",
  },
  segmented: {
    height: 38,
    maxWidth: 200,
    width: "100%",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  navBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  calendarCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  weekRow: { flexDirection: "row" },
  weekday: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
    paddingBottom: 6,
  },
  dayCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    borderRadius: 10,
    minHeight: 38,
  },
  dayText: { fontSize: 14 },
  dayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 1,
  },
  dayCount: {
    fontSize: 7,
    fontWeight: "700",
    position: "absolute",
    top: 3,
    right: 5,
  },

  yearGrid: {
    paddingHorizontal: 10,
    gap: 6,
  },
  yearRow: {
    flexDirection: "row",
    gap: 6,
  },
  miniMonth: {
    flex: 1,
    borderRadius: 14,
    padding: 6,
  },
  miniMonthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  miniMonthName: {
    fontSize: 12,
    fontWeight: "700",
  },
  miniMonthCount: {
    fontSize: 10,
    fontWeight: "700",
  },
  miniGrid: { gap: 2 },
  miniWeekRow: { flexDirection: "row", gap: 2 },
  miniDayCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  miniDayText: {
    fontSize: 8,
    textAlign: "center",
  },

  recentSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  recentTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    marginRight: 8,
  },
  showAll: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyHint: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 12,
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 6,
    gap: 10,
  },
  recentBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  recentBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  recentRowTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  recentRowTime: {
    fontSize: 12,
  },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
});
