import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
} from "react-native";
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
} from "../../src/store/teethStore";
import { getCurrentProfileRole } from "../../src/store/profileStore";
import { buildStatusMaps } from "../../src/types";
import type {
  ToothId,
  ToothChange,
  ToothStatus,
  ToothRecord,
  StatusMaps,
} from "../../src/types";

export default function ToothDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toothId = id as ToothId;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerHeight = useStableHeaderHeight();
  const { colors } = useAppTheme();

  const [record, setRecord] = useState<ToothRecord | null>(null);
  const [statusMaps, setStatusMaps] = useState<StatusMaps>(buildStatusMaps());
  const [pickerVisible, setPickerVisible] = useState(false);
  const [role, setRole] = useState<string>("owner");
  const { dataRevision } = useDataSync();

  const canEdit = role !== "viewer";

  const refresh = useCallback(async () => {
    const [data, r] = await Promise.all([loadData(), getCurrentProfileRole()]);
    setRecord(getToothRecord(data, toothId));
    setStatusMaps(buildStatusMaps(data.customStatuses));
    setRole(r);
  }, [toothId]);

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

  const handleStatusChange = async (status: ToothStatus) => {
    setPickerVisible(false);
    await setToothStatus(toothId, status);
    refresh();
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

  const currentStatus = record?.currentStatus;
  const currentStatusLabel = currentStatus
    ? (statusMaps.labels[currentStatus] ?? currentStatus)
    : "Не встановлено";
  const currentStatusColor = currentStatus
    ? (statusMaps.borderColors[currentStatus] ?? "#999")
    : "#999";

  return (
    <>
      <Stack.Screen
        options={{
          title: `Зуб ${toothId}`,
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
              Поточний статус
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
              title="Оберіть статус"
              selected={currentStatus}
              maps={statusMaps}
              onSelect={handleStatusChange}
              onManage={() => {
                router.push("/statuses");
                setPickerVisible(false);
              }}
              manageLabel="Керувати статусами"
            />
          </View>

          <View style={styles.historySection}>
            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
              Історія змін
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
                  Ще немає записів
                </Text>
                <Text
                  style={[styles.emptyHint, { color: colors.textSecondary }]}
                >
                  Додайте перший запис про лікування або огляд
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
                      Додати запис
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
                                  (statusMaps.borderColors[c.status] ??
                                    "#999") + "18",
                              },
                            ]}
                          >
                            <View
                              style={[
                                styles.recordStatusDot,
                                {
                                  backgroundColor:
                                    statusMaps.borderColors[c.status] ?? "#999",
                                },
                              ]}
                            />
                            <Text
                              style={[
                                styles.recordStatusText,
                                {
                                  color:
                                    statusMaps.borderColors[c.status] ??
                                    colors.textSecondary,
                                },
                              ]}
                            >
                              {statusMaps.labels[c.status] ?? c.status}
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
                    {c.imageUri && (
                      <Image
                        source={{ uri: c.imageUri }}
                        style={[
                          styles.recordImage,
                          { backgroundColor: colors.border },
                        ]}
                      />
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
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
  recordImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginTop: 12,
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
