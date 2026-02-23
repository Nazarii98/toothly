import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  Pressable,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../src/theme";
import { loadData } from "../src/store/teethStore";
import {
  QUADRANT_LABELS,
  TOOTH_NAMES,
  GLOBAL_PROCEDURE_TYPES,
  buildStatusMaps,
} from "../src/types";
import type { ToothChange, GlobalProcedure, StatusMaps } from "../src/types";

type HistoryItem =
  | { type: "tooth"; data: ToothChange }
  | { type: "global"; data: GlobalProcedure };

type FilterPreset = "day" | "week" | "month" | "year" | "all";

const FILTER_LABELS: Record<FilterPreset, string> = {
  day: "День",
  week: "Тиждень",
  month: "Місяць",
  year: "Рік",
  all: "Все",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("uk-UA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function getFilterRange(
  preset: FilterPreset,
  refDate: Date,
): { from: Date; to: Date } | null {
  const d = startOfDay(refDate);
  switch (preset) {
    case "day":
      return { from: d, to: new Date(d.getTime() + 86400000) };
    case "week": {
      const dow = d.getDay() === 0 ? 6 : d.getDay() - 1;
      const monday = new Date(d.getTime() - dow * 86400000);
      return { from: monday, to: new Date(monday.getTime() + 7 * 86400000) };
    }
    case "month":
      return {
        from: new Date(d.getFullYear(), d.getMonth(), 1),
        to: new Date(d.getFullYear(), d.getMonth() + 1, 1),
      };
    case "year":
      return {
        from: new Date(d.getFullYear(), 0, 1),
        to: new Date(d.getFullYear() + 1, 0, 1),
      };
    case "all":
      return null;
  }
}

function groupByDate(
  items: HistoryItem[],
): { title: string; data: HistoryItem[] }[] {
  const map = new Map<string, HistoryItem[]>();
  items.forEach((item) => {
    const key = formatDate(item.data.date);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  });
  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
}

export default function HistoryListScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ date?: string }>();

  const initialPreset: FilterPreset = params.date ? "day" : "all";
  const initialRef = params.date ? new Date(params.date + "T12:00:00") : new Date();

  const [allItems, setAllItems] = useState<HistoryItem[]>([]);
  const [statusMaps, setStatusMaps] = useState<StatusMaps>(buildStatusMaps());
  const [filterPreset, setFilterPreset] = useState<FilterPreset>(initialPreset);
  const [refDate, setRefDate] = useState(initialRef);

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

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const filteredItems = useMemo(() => {
    const range = getFilterRange(filterPreset, refDate);
    if (!range) return allItems;
    return allItems.filter((item) => {
      const d = new Date(item.data.date);
      return d >= range.from && d < range.to;
    });
  }, [allItems, filterPreset, refDate]);

  const sections = useMemo(() => groupByDate(filteredItems), [filteredItems]);

  const selectPreset = (preset: FilterPreset) => {
    setFilterPreset(preset);
    if (preset !== "day") {
      setRefDate(new Date());
    }
  };

  const renderItem = ({ item }: { item: HistoryItem }) => {
    if (item.type === "tooth") {
      const c = item.data;
      const q = c.toothId[0];
      const t = c.toothId[1];
      return (
        <Pressable
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push(`/tooth/${c.toothId}`)}
        >
          <View style={styles.cardRow}>
            <View style={[styles.badge, { backgroundColor: colors.accent }]}>
              <Text style={[styles.badgeText, { color: colors.white }]}>{c.toothId}</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{c.title}</Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                {TOOTH_NAMES[t] ?? ""} · {QUADRANT_LABELS[q] ?? ""}
              </Text>
              {c.status && (
                <Text style={[styles.cardStatus, { color: colors.accent }]}>
                  {statusMaps.labels[c.status] ?? c.status}
                </Text>
              )}
              {c.notes ? (
                <Text style={[styles.cardNotes, { color: colors.textSecondary }]} numberOfLines={2}>
                  {c.notes}
                </Text>
              ) : null}
            </View>
            <Text style={[styles.cardTime, { color: colors.textTertiary }]}>{formatTime(c.date)}</Text>
          </View>
          {c.imageUri && (
            <Image source={{ uri: c.imageUri }} style={[styles.cardImage, { backgroundColor: colors.border }]} />
          )}
        </Pressable>
      );
    }
    const p = item.data;
    return (
      <View style={[styles.card, styles.globalCard, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}>
        <View style={styles.cardRow}>
          <View style={[styles.badge, { backgroundColor: colors.textSecondary }]}>
            <Text style={[styles.badgeText, { color: colors.white }]}>GP</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{p.title}</Text>
            <Text style={[styles.cardStatus, { color: colors.textSecondary }]}>
              {GLOBAL_PROCEDURE_TYPES[p.type]}
            </Text>
            {p.notes ? (
              <Text style={[styles.cardNotes, { color: colors.textSecondary }]} numberOfLines={2}>
                {p.notes}
              </Text>
            ) : null}
          </View>
          <Text style={[styles.cardTime, { color: colors.textTertiary }]}>{formatTime(p.date)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top + 56 }]}>
      <View style={styles.filtersRow}>
        {(Object.keys(FILTER_LABELS) as FilterPreset[]).map((preset) => (
          <Pressable
            key={preset}
            style={[
              styles.filterChip,
              { backgroundColor: colors.card },
              filterPreset === preset && { backgroundColor: colors.accent },
            ]}
            onPress={() => selectPreset(preset)}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: colors.textSecondary },
                filterPreset === preset && { color: colors.white, fontWeight: "700" },
              ]}
            >
              {FILTER_LABELS[preset]}
            </Text>
          </Pressable>
        ))}
      </View>

      {filterPreset !== "all" && (
        <Text style={[styles.filterHint, { color: colors.textTertiary }]}>
          {filterPreset === "day"
            ? refDate.toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" })
            : filterPreset === "week"
              ? "Поточний тиждень"
              : filterPreset === "month"
                ? refDate.toLocaleDateString("uk-UA", { month: "long", year: "numeric" })
                : `${refDate.getFullYear()} рік`}
        </Text>
      )}

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.data.id}
        renderItem={renderItem}
        renderSectionHeader={({ section }) => (
          <Text style={[styles.sectionHeader, { color: colors.text, backgroundColor: colors.bg }]}>
            {section.title}
          </Text>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="document-text-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              Немає записів за цей період
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  filtersRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  filterHint: {
    fontSize: 13,
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: "700",
    paddingVertical: 10,
    marginTop: 8,
  },
  card: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  globalCard: {},
  cardRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  cardContent: { flex: 1 },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  cardSub: {
    fontSize: 12,
    marginTop: 2,
  },
  cardStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  cardNotes: {
    fontSize: 13,
    marginTop: 6,
  },
  cardTime: {
    fontSize: 12,
  },
  cardImage: {
    width: "100%",
    height: 160,
    borderRadius: 14,
    marginTop: 10,
  },
  emptyWrap: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
  },
});
