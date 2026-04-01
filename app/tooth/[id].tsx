import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStableHeaderHeight } from "../../src/hooks/useStableHeaderHeight";
import { useAppTheme } from "../../src/theme";
import { StatusPickerModal } from "../../src/components/StatusPickerModal";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useDataSync } from "../../src/DataSyncProvider";
import {
  loadData,
  getToothRecord,
  setToothStatus,
  deleteStatusHistoryEntry,
  updateStatusHistoryEntry,
} from "../../src/store/teethStore";
import { getCurrentProfileRole } from "../../src/store/profileStore";
import {
  buildStatusMaps,
  buildToothCategoryMaps,
  STATUS_LABELS,
  TOOTH_CATEGORY_LABELS,
} from "../../src/types";
import type {
  ToothId,
  ToothChange,
  ToothStatus,
  ToothRecord,
  StatusMaps,
  StatusHistoryEntry,
} from "../../src/types";
import { useAuth } from "../../src/AuthProvider";
import { useTranslation } from "react-i18next";

export default function ToothDetailScreen() {
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const toothId = id as ToothId;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerHeight = useStableHeaderHeight();
  const { colors } = useAppTheme();

  const [record, setRecord] = useState<ToothRecord | null>(null);
  const [statusMaps, setStatusMaps] = useState<StatusMaps>(buildStatusMaps());
  const [categoryMaps, setCategoryMaps] = useState<StatusMaps>(
    buildToothCategoryMaps(),
  );
  const [pickerVisible, setPickerVisible] = useState(false);
  const [statusEditEntry, setStatusEditEntry] =
    useState<StatusHistoryEntry | null>(null);
  const [androidDateEntry, setAndroidDateEntry] =
    useState<StatusHistoryEntry | null>(null);
  const [role, setRole] = useState<string>("owner");
  const { dataRevision } = useDataSync();
  const { user } = useAuth();

  const canEdit = role !== "viewer";

  const refresh = useCallback(async () => {
    const [data, r] = await Promise.all([loadData(), getCurrentProfileRole()]);
    setRecord(getToothRecord(data, toothId));
    const localizedStatusLabels = Object.fromEntries(
      Object.keys(STATUS_LABELS).map((k) => [
        k,
        t(`statusLabels.${k}`, { defaultValue: STATUS_LABELS[k] }),
      ]),
    );
    const localizedCategoryLabels = Object.fromEntries(
      Object.keys(TOOTH_CATEGORY_LABELS).map((k) => [
        k,
        t(`categoryLabels.${k}`, { defaultValue: TOOTH_CATEGORY_LABELS[k] }),
      ]),
    );
    setStatusMaps(buildStatusMaps(data.customStatuses, localizedStatusLabels));
    setCategoryMaps(
      buildToothCategoryMaps(
        data.customToothCategories,
        localizedCategoryLabels,
      ),
    );
    setRole(r);
  }, [toothId, t]);

  useEffect(() => {
    refresh();
  }, [refresh]);

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

  const handleStatusChange = async (status: ToothStatus) => {
    setPickerVisible(false);
    await setToothStatus(toothId, status, user?.uid ?? "", user?.email ?? "");
    refresh();
  };

  const handleUpdateEntryDate = async (
    entry: StatusHistoryEntry,
    date: Date,
  ) => {
    await updateStatusHistoryEntry(toothId, entry.id, {
      date: date.toISOString(),
    });
    refresh();
  };

  const handleUpdateEntryStatus = async (status: string) => {
    if (!statusEditEntry) return;
    await updateStatusHistoryEntry(toothId, statusEditEntry.id, { status });
    setStatusEditEntry(null);
    refresh();
  };

  const handleDeleteHistoryEntry = (entry: StatusHistoryEntry) => {
    Alert.alert(
      t("tooth.deleteStatus"),
      t("tooth.deleteStatusMessage", {
        label: statusMaps.labels[entry.status] ?? entry.status,
      }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            await deleteStatusHistoryEntry(toothId, entry.id);
            refresh();
          },
        },
      ],
    );
  };

  const openAdd = () => {
    router.push(`/add-record?toothId=${toothId}`);
  };

  const openEdit = (change: ToothChange) => {
    router.push(`/edit-record?toothId=${toothId}&changeId=${change.id}`);
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

  const currentStatus = (record?.statusHistory ?? []).sort((a, b) =>
    b.date.localeCompare(a.date),
  )[0]?.status;
  const currentStatusLabel = currentStatus
    ? (statusMaps.labels[currentStatus] ?? currentStatus)
    : t("tooth.noStatus");
  const currentStatusColor = currentStatus
    ? (statusMaps.borderColors[currentStatus] ?? "#999")
    : "#999";

  return (
    <>
      <Stack.Screen
        options={{
          title: t("tooth.title", { id: toothId }),
          headerRight: canEdit
            ? () => (
                <Pressable
                  onPress={openAdd}
                  hitSlop={8}
                  style={styles.headerAddBtn}
                >
                  <Ionicons name="add" size={26} color={colors.text} />
                </Pressable>
              )
            : undefined,
        }}
      />
      <View style={[styles.safe, { backgroundColor: colors.bg }]}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: headerHeight + 12,
              paddingBottom: insets.bottom + 24,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.statusCard,
              { backgroundColor: colors.card, shadowColor: colors.shadow },
            ]}
          >
            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
              {t("tooth.currentStatus")}
            </Text>
            <Pressable
              style={[
                styles.statusTrigger,
                { backgroundColor: colors.inputBg },
              ]}
              onPress={canEdit ? () => setPickerVisible(true) : undefined}
              disabled={!canEdit}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: currentStatusColor },
                ]}
              />
              <Text style={[styles.statusTriggerText, { color: colors.text }]}>
                {currentStatusLabel}
              </Text>
              {canEdit && (
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.chevron}
                />
              )}
            </Pressable>
            <StatusPickerModal
              visible={pickerVisible}
              onClose={() => setPickerVisible(false)}
              title={t("tooth.pickStatus")}
              selected={currentStatus}
              maps={statusMaps}
              onSelect={handleStatusChange}
              onManage={() => {
                router.push("/statuses");
                setPickerVisible(false);
              }}
              manageLabel={t("tooth.manageStatuses")}
              showEmpty={false}
            />
          </View>

          {(record?.statusHistory?.length ?? 0) > 0 && (
            <View
              style={[
                styles.statusCard,
                { backgroundColor: colors.card, shadowColor: colors.shadow },
              ]}
            >
              <Text
                style={[styles.sectionLabel, { color: colors.textTertiary }]}
              >
                {t("tooth.statusHistory")}
              </Text>
              {record!.statusHistory!.map((entry, index) => {
                const canDelete =
                  role === "owner" || entry.changedBy === user?.uid;
                const isLast = index === record!.statusHistory!.length - 1;
                return (
                  <View key={entry.id}>
                    <View style={styles.historyEntry}>
                      {/* Left: dot + status + email */}
                      <View style={styles.historyLeft}>
                        <View style={styles.historyTopRow}>
                          <View
                            style={[
                              styles.historyDot,
                              {
                                backgroundColor:
                                  statusMaps.borderColors[entry.status] ??
                                  "#999",
                              },
                            ]}
                          />
                          <Text
                            style={[
                              styles.historyStatus,
                              { color: colors.text },
                            ]}
                          >
                            {statusMaps.labels[entry.status] ?? entry.status}
                          </Text>
                        </View>
                        {entry.changedByEmail &&
                          entry.changedByEmail !== user?.email && (
                            <Text
                              style={[
                                styles.historyMeta,
                                { color: colors.textTertiary },
                              ]}
                              numberOfLines={1}
                            >
                              {entry.changedByEmail}
                            </Text>
                          )}
                      </View>
                      {/* Right: date picker + edit + delete */}
                      <View style={styles.historyRight}>
                        {canDelete && Platform.OS === "ios" ? (
                          <DateTimePicker
                            value={new Date(entry.date)}
                            mode="date"
                            display="compact"
                            maximumDate={new Date()}
                            onChange={(_: DateTimePickerEvent, d?: Date) => {
                              if (d) handleUpdateEntryDate(entry, d);
                            }}
                            locale={i18n.language}
                            accentColor={colors.accent}
                            textColor={colors.text}
                            themeVariant={colors.isDark ? "dark" : "light"}
                          />
                        ) : (
                          <Pressable
                            onPress={
                              canDelete
                                ? () => setAndroidDateEntry(entry)
                                : undefined
                            }
                            hitSlop={4}
                          >
                            <Text
                              style={[
                                styles.historyMeta,
                                { color: colors.textTertiary },
                              ]}
                            >
                              {new Date(entry.date).toLocaleDateString(
                                "uk-UA",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                },
                              )}
                            </Text>
                          </Pressable>
                        )}
                        {canDelete && (
                          <>
                            <Pressable
                              onPress={() => setStatusEditEntry(entry)}
                              hitSlop={8}
                            >
                              <Ionicons
                                name="pencil-outline"
                                size={16}
                                color={colors.accent}
                              />
                            </Pressable>
                            <Pressable
                              onPress={() => handleDeleteHistoryEntry(entry)}
                              hitSlop={8}
                            >
                              <Ionicons
                                name="trash-outline"
                                size={16}
                                color={colors.destructive}
                              />
                            </Pressable>
                          </>
                        )}
                      </View>
                    </View>
                    {!isLast && (
                      <View style={styles.historyConnector}>
                        <View
                          style={[
                            styles.historyLine,
                            { backgroundColor: colors.border },
                          ]}
                        />
                        <Ionicons
                          name="chevron-up"
                          size={14}
                          color={colors.textTertiary}
                        />
                        <View
                          style={[
                            styles.historyLine,
                            { backgroundColor: colors.border },
                          ]}
                        />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.historySection}>
            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
              {t("tooth.changesHistory")}
            </Text>
            {record && record.changes.length === 0 ? (
              <View
                style={[
                  styles.emptyState,
                  {
                    backgroundColor: colors.cardSecondary,
                    shadowColor: colors.shadow,
                  },
                ]}
              >
                <Ionicons
                  name="document-text-outline"
                  size={40}
                  color={colors.textTertiary}
                />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  {t("tooth.noRecords")}
                </Text>
                <Text
                  style={[styles.emptyHint, { color: colors.textSecondary }]}
                >
                  {t("tooth.noRecordsHint")}
                </Text>
                {canEdit && (
                  <Pressable
                    style={[
                      styles.emptyCta,
                      { backgroundColor: colors.accent },
                    ]}
                    onPress={openAdd}
                  >
                    <Ionicons name="add" size={20} color={colors.white} />
                    <Text
                      style={[styles.emptyCtaText, { color: colors.white }]}
                    >
                      {t("tooth.addRecord")}
                    </Text>
                  </Pressable>
                )}
              </View>
            ) : (
              <View style={styles.recordList}>
                {record?.changes.map((c) => (
                  <Pressable
                    key={c.id}
                    style={[
                      styles.recordCard,
                      {
                        backgroundColor: colors.card,
                        shadowColor: colors.shadow,
                      },
                    ]}
                    onPress={canEdit ? () => openEdit(c) : undefined}
                    disabled={!canEdit}
                  >
                    <View style={styles.recordCardTop}>
                      <Text
                        style={[styles.recordTitle, { color: colors.text }]}
                        numberOfLines={2}
                      >
                        {c.title}
                      </Text>
                      <View style={styles.recordMeta}>
                        {c.status && (
                          <View
                            style={[
                              styles.recordStatusBadge,
                              {
                                backgroundColor:
                                  (categoryMaps.borderColors[c.status] ??
                                    statusMaps.borderColors[c.status] ??
                                    "#999") + "18",
                              },
                            ]}
                          >
                            <View
                              style={[
                                styles.recordStatusDot,
                                {
                                  backgroundColor:
                                    categoryMaps.borderColors[c.status] ??
                                    statusMaps.borderColors[c.status] ??
                                    "#999",
                                },
                              ]}
                            />
                            <Text
                              style={[
                                styles.recordStatusText,
                                {
                                  color:
                                    categoryMaps.borderColors[c.status] ??
                                    statusMaps.borderColors[c.status] ??
                                    colors.textSecondary,
                                },
                              ]}
                            >
                              {categoryMaps.labels[c.status] ??
                                statusMaps.labels[c.status] ??
                                c.status}
                            </Text>
                          </View>
                        )}
                        <Text
                          style={[
                            styles.recordDate,
                            { color: colors.textTertiary },
                          ]}
                        >
                          {formatDate(c.date)}
                        </Text>
                      </View>
                    </View>
                    {c.notes ? (
                      <Text
                        style={[
                          styles.recordNotes,
                          { color: colors.textSecondary },
                        ]}
                        numberOfLines={2}
                      >
                        {c.notes}
                      </Text>
                    ) : null}
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      <StatusPickerModal
        visible={statusEditEntry !== null}
        onClose={() => setStatusEditEntry(null)}
        title={t("tooth.pickStatus")}
        selected={statusEditEntry?.status}
        maps={statusMaps}
        onSelect={handleUpdateEntryStatus}
        onManage={() => {
          router.push("/statuses");
          setStatusEditEntry(null);
        }}
        manageLabel={t("tooth.manageStatuses")}
        showEmpty={false}
      />

      {androidDateEntry !== null && (
        <DateTimePicker
          value={new Date(androidDateEntry.date)}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={(_: DateTimePickerEvent, d?: Date) => {
            const entry = androidDateEntry;
            setAndroidDateEntry(null);
            if (d) handleUpdateEntryDate(entry, d);
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  headerAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 0,
    flexShrink: 0,
  },
  statusCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  statusTrigger: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusTriggerText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    borderRadius: 20,
    width: "100%",
    maxWidth: 360,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  historySection: {},
  emptyState: {
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginTop: 12,
  },
  emptyHint: {
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
  },
  emptyCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 18,
  },
  emptyCtaText: {
    fontSize: 15,
    fontWeight: "600",
  },
  historyEntry: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 8,
  },
  historyLeft: {
    flex: 1,
    gap: 2,
  },
  historyTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  historyStatus: {
    fontSize: 15,
    fontWeight: "600",
  },
  historyRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
  },
  historyMeta: {
    fontSize: 12,
    flexShrink: 1,
  },
  historyConnector: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 4,
    paddingVertical: 2,
    gap: 4,
  },
  historyLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  recordList: { gap: 12 },
  recordCard: {
    borderRadius: 20,
    padding: 18,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  recordCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  recordTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 22,
  },
  recordMeta: {
    alignItems: "flex-end",
    gap: 6,
  },
  recordStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  recordStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  recordStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  recordDate: {
    fontSize: 12,
    fontWeight: "500",
  },
  recordNotes: {
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  recordActions: {
    flexDirection: "row",
    marginTop: 12,
    gap: 6,
    alignItems: "center",
  },
  recordActionHint: {
    flex: 1,
    fontSize: 12,
  },
});
