import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  Pressable,
} from "react-native";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStableHeaderHeight } from "../src/hooks/useStableHeaderHeight";
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

type FilterPreset = "month" | "year" | "all";

const FILTER_VALUES: FilterPreset[] = ["month", "year", "all"];
const FILTER_LABELS: Record<FilterPreset, string> = {
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
  const headerHeight = useStableHeaderHeight();
  const params = useLocalSearchParams<{ date?: string }>();

  const initialPreset: FilterPreset = params.date ? "month" : "all";
  const initialRef = params.date
    ? new Date(params.date + "T12:00:00")
    : new Date();

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

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

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
    setRefDate(new Date());
  };

  const shiftRef = (direction: -1 | 1) => {
    setRefDate((prev) => {
      const d = new Date(prev);
      if (filterPreset === "month") {
        d.setMonth(d.getMonth() + direction);
      } else if (filterPreset === "year") {
        d.setFullYear(d.getFullYear() + direction);
      }
      return d;
    });
  };

  const periodLabel = useMemo(() => {
    if (filterPreset === "month") {
      return refDate.toLocaleDateString("uk-UA", {
        month: "long",
        year: "numeric",
      });
    }
    if (filterPreset === "year") {
      return `${refDate.getFullYear()} рік`;
    }
    return "";
  }, [filterPreset, refDate]);

  const goToCurrentPeriod = () => setRefDate(new Date());

  const renderItem = ({ item }: { item: HistoryItem }) => {
    if (item.type === "tooth") {
      const c = item.data;
      const q = c.toothId[0];
      const t = c.toothId[1];
      return (
        <Pressable
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={() => router.push(`/edit-record?toothId=${c.toothId}&changeId=${c.id}`)}
        >
          <View style={styles.cardRow}>
            <View style={[styles.badge, { backgroundColor: colors.accent }]}>
              <Text style={[styles.badgeText, { color: colors.white }]}>
                {c.toothId}
              </Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {c.title}
              </Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                {TOOTH_NAMES[t] ?? ""} · {QUADRANT_LABELS[q] ?? ""}
              </Text>
              {c.status && (
                <Text style={[styles.cardStatus, { color: colors.accent }]}>
                  {statusMaps.labels[c.status] ?? c.status}
                </Text>
              )}
              {c.notes ? (
                <Text
                  style={[styles.cardNotes, { color: colors.textSecondary }]}
                  numberOfLines={2}
                >
                  {c.notes}
                </Text>
              ) : null}
            </View>
            <Text style={[styles.cardTime, { color: colors.textTertiary }]}>
              {formatTime(c.date)}
            </Text>
          </View>
        </Pressable>
      );
    }
    const p = item.data;
    return (
      <Pressable
        style={[
          styles.card,
          styles.globalCard,
          { backgroundColor: colors.cardSecondary, borderColor: colors.border },
        ]}
        onPress={() => router.push(`/edit-global?id=${p.id}`)}
      >
        <View style={styles.cardRow}>
          <View
            style={[styles.badge, { backgroundColor: colors.textSecondary }]}
          >
            <Text style={[styles.badgeText, { color: colors.white }]}>GP</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {p.title}
            </Text>
            <Text style={[styles.cardStatus, { color: colors.textSecondary }]}>
              {GLOBAL_PROCEDURE_TYPES[p.type]}
            </Text>
            {p.notes ? (
              <Text
                style={[styles.cardNotes, { color: colors.textSecondary }]}
                numberOfLines={2}
              >
                {p.notes}
              </Text>
            ) : null}
          </View>
          <Text style={[styles.cardTime, { color: colors.textTertiary }]}>
            {formatTime(p.date)}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: colors.bg, paddingTop: headerHeight + 12 },
      ]}
    >
      <View style={styles.filtersRow}>
        <SegmentedControl
          values={FILTER_VALUES.map((p) => FILTER_LABELS[p])}
          selectedIndex={FILTER_VALUES.indexOf(filterPreset)}
          onChange={(e) => {
            selectPreset(FILTER_VALUES[e.nativeEvent.selectedSegmentIndex]);
          }}
          style={styles.segmented}
          tintColor={colors.accent}
          fontStyle={{ color: colors.textSecondary, fontSize: 13 }}
          activeFontStyle={{
            color: colors.white,
            fontWeight: "600",
            fontSize: 13,
          }}
        />
      </View>

      {filterPreset !== "all" && (
        <View style={styles.navRow}>
          <Pressable
            onPress={() => shiftRef(-1)}
            hitSlop={12}
            style={styles.navArrow}
          >
            <Ionicons name="chevron-back" size={20} color={colors.accent} />
          </Pressable>
          <Pressable onPress={goToCurrentPeriod} hitSlop={8}>
            <Text style={[styles.navLabel, { color: colors.text }]}>
              {periodLabel}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => shiftRef(1)}
            hitSlop={12}
            style={styles.navArrow}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.accent} />
          </Pressable>
        </View>
      )}

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.data.id}
        renderItem={renderItem}
        renderSectionHeader={({ section }) => (
          <Text
            style={[
              styles.sectionHeader,
              { color: colors.text, backgroundColor: colors.bg },
            ]}
          >
            {section.title}
          </Text>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons
              name="document-text-outline"
              size={48}
              color={colors.textTertiary}
            />
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
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  segmented: {
    height: 38,
    maxWidth: 260,
    alignSelf: "center",
    width: "100%",
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  navArrow: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  navLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: "700",
    paddingVertical: 10,
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
