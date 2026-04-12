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
  deleteToothEvent,
  updateToothEvent,
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
  ToothEvent,
  ToothStatus,
  ToothRecord,
  StatusMaps,
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
  const [statusEditEvent, setStatusEditEvent] = useState<ToothEvent | null>(
    null,
  );
  const [androidDateEvent, setAndroidDateEvent] = useState<ToothEvent | null>(
    null,
  );
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

  const handleUpdateEventDate = async (event: ToothEvent, date: Date) => {
    await updateToothEvent(toothId, event.id, { date: date.toISOString() });
    refresh();
  };

  const handleUpdateEventStatus = async (status: string) => {
    if (!statusEditEvent) return;
    await updateToothEvent(toothId, statusEditEvent.id, {
      statusAfter: status,
    });
    setStatusEditEvent(null);
    refresh();
  };

  const handleDeleteEvent = (event: ToothEvent) => {
    const label = event.category
      ? (categoryMaps.labels[event.category] ?? event.category)
      : event.statusAfter
        ? (statusMaps.labels[event.statusAfter] ?? event.statusAfter)
        : "";
    Alert.alert(t("tooth.deleteStatus"), label, [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          await deleteToothEvent(toothId, event.id);
          refresh();
        },
      },
    ]);
  };

  const openAdd = () => router.push(`/add-record?toothId=${toothId}`);
  const openEdit = (event: ToothEvent) =>
    router.push(`/edit-record?toothId=${toothId}&changeId=${event.id}`);

  const events = (record?.events ?? [])
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));

  const currentStatus = events.find((e) => e.statusAfter)?.statusAfter;
  const currentStatusLabel = currentStatus
    ? (statusMaps.labels[currentStatus] ?? currentStatus)
    : t("tooth.noStatus");
  const currentStatusColor = currentStatus
    ? (statusMaps.borderColors[currentStatus] ?? "#999")
    : "#999";

  return (
    <>
      <Stack.Screen options={{ title: t("tooth.title", { id: toothId }) }} />
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
          alwaysBounceVertical={false}
        >
          {/* ── Статус + таймлайн в одному блоці ── */}
          <View
            style={[
              styles.statusCard,
              { backgroundColor: colors.card, shadowColor: colors.shadow },
            ]}
          >
            {/* Поточний статус */}
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

            {/* Таймлайн */}
            {events.length > 0 && (
              <>
                <View
                  style={[styles.divider, { backgroundColor: colors.border }]}
                />
                <Text
                  style={[styles.sectionLabel, { color: colors.textTertiary }]}
                >
                  {t("tooth.changesHistory")}
                </Text>
                {events.map((event, index) => {
                  const isStatusOnly = !event.category && !!event.statusAfter;
                  const canDelete =
                    role === "owner" || event.changedBy === user?.uid;
                  const isLast = index === events.length - 1;

                  return (
                    <View key={event.id}>
                      <View style={styles.eventRow}>
                        {/* Лівий стовпець: іконка або точка */}
                        <View style={styles.eventIconCol}>
                          {isStatusOnly ? (
                            <View
                              style={[
                                styles.eventStatusDot,
                                {
                                  backgroundColor:
                                    statusMaps.borderColors[
                                      event.statusAfter!
                                    ] ?? "#999",
                                  borderColor: colors.card,
                                },
                              ]}
                            />
                          ) : (
                            <View
                              style={[
                                styles.eventRecordIcon,
                                { backgroundColor: colors.inputBg },
                              ]}
                            >
                              <Ionicons
                                name="document-text-outline"
                                size={13}
                                color={colors.textTertiary}
                              />
                            </View>
                          )}
                          {!isLast && (
                            <View
                              style={[
                                styles.eventLine,
                                { backgroundColor: colors.border },
                              ]}
                            />
                          )}
                        </View>

                        {/* Правий стовпець: вміст */}
                        <View style={styles.eventContent}>
                          {/* Рядок 1: заголовок або статус + кнопки */}
                          <View style={styles.eventTopRow}>
                            <View style={styles.eventTitleBlock}>
                              {isStatusOnly ? (
                                <Pressable
                                  onPress={
                                    canEdit
                                      ? () => setStatusEditEvent(event)
                                      : undefined
                                  }
                                  disabled={!canEdit}
                                  style={({ pressed }) =>
                                    pressed && { opacity: 0.6 }
                                  }
                                >
                                  <View style={styles.eventStatusCol}>
                                    <Text
                                      style={[
                                        styles.eventStatusMeta,
                                        { color: colors.textTertiary },
                                      ]}
                                    >
                                      {t("tooth.statusChanged")}
                                    </Text>
                                    <View
                                      style={[
                                        styles.eventStatusBadge,
                                        {
                                          backgroundColor:
                                            (statusMaps.borderColors[
                                              event.statusAfter!
                                            ] ?? "#999") + "25",
                                        },
                                      ]}
                                    >
                                      <View
                                        style={[
                                          styles.eventStatusBadgeDot,
                                          {
                                            backgroundColor:
                                              statusMaps.borderColors[
                                                event.statusAfter!
                                              ] ?? "#999",
                                          },
                                        ]}
                                      />
                                      <Text
                                        style={[
                                          styles.eventStatusBadgeText,
                                          {
                                            color:
                                              statusMaps.borderColors[
                                                event.statusAfter!
                                              ] ?? "#999",
                                          },
                                        ]}
                                      >
                                        {statusMaps.labels[
                                          event.statusAfter!
                                        ] ?? event.statusAfter}
                                      </Text>
                                    </View>
                                  </View>
                                </Pressable>
                              ) : (
                                <Pressable
                                  onPress={
                                    canEdit ? () => openEdit(event) : undefined
                                  }
                                  disabled={!canEdit}
                                  style={({ pressed }) =>
                                    pressed && { opacity: 0.6 }
                                  }
                                >
                                  <View style={styles.eventTitleRow}>
                                    {/* Категорія запису */}
                                    {event.category && (
                                      <View
                                        style={[
                                          styles.eventStatusBadge,
                                          {
                                            backgroundColor:
                                              (categoryMaps.borderColors[
                                                event.category
                                              ] ?? "#999") + "20",
                                          },
                                        ]}
                                      >
                                        <View
                                          style={[
                                            styles.eventStatusBadgeDot,
                                            {
                                              backgroundColor:
                                                categoryMaps.borderColors[
                                                  event.category
                                                ] ?? "#999",
                                            },
                                          ]}
                                        />
                                        <Text
                                          style={[
                                            styles.eventStatusBadgeText,
                                            {
                                              color:
                                                categoryMaps.borderColors[
                                                  event.category
                                                ] ?? "#999",
                                            },
                                          ]}
                                        >
                                          {categoryMaps.labels[
                                            event.category
                                          ] ?? event.category}
                                        </Text>
                                      </View>
                                    )}
                                    {/* Бейдж статусу якщо є */}
                                    {event.statusAfter && (
                                      <View
                                        style={[
                                          styles.eventStatusBadge,
                                          {
                                            backgroundColor:
                                              (statusMaps.borderColors[
                                                event.statusAfter
                                              ] ?? "#999") + "20",
                                          },
                                        ]}
                                      >
                                        <View
                                          style={[
                                            styles.eventStatusBadgeDot,
                                            {
                                              backgroundColor:
                                                statusMaps.borderColors[
                                                  event.statusAfter
                                                ] ?? "#999",
                                            },
                                          ]}
                                        />
                                        <Text
                                          style={[
                                            styles.eventStatusBadgeText,
                                            {
                                              color:
                                                statusMaps.borderColors[
                                                  event.statusAfter
                                                ] ?? "#999",
                                            },
                                          ]}
                                        >
                                          {statusMaps.labels[
                                            event.statusAfter
                                          ] ?? event.statusAfter}
                                        </Text>
                                      </View>
                                    )}
                                  </View>
                                  {/* Нотатки всередині Pressable */}
                                  {event.notes ? (
                                    <Text
                                      style={[
                                        styles.eventNotes,
                                        { color: colors.textSecondary },
                                      ]}
                                      numberOfLines={2}
                                    >
                                      {event.notes}
                                    </Text>
                                  ) : null}
                                </Pressable>
                              )}
                            </View>

                            {/* Дата + видалення */}
                            <View style={styles.eventActions}>
                              {canDelete && Platform.OS === "ios" ? (
                                <DateTimePicker
                                  value={new Date(event.date)}
                                  mode="date"
                                  display="compact"
                                  maximumDate={new Date()}
                                  onChange={(
                                    _: DateTimePickerEvent,
                                    d?: Date,
                                  ) => {
                                    if (d) handleUpdateEventDate(event, d);
                                  }}
                                  locale={i18n.language}
                                  accentColor={colors.accent}
                                  textColor={colors.text}
                                  themeVariant={
                                    colors.isDark ? "dark" : "light"
                                  }
                                />
                              ) : (
                                <Pressable
                                  onPress={
                                    canDelete
                                      ? () => setAndroidDateEvent(event)
                                      : undefined
                                  }
                                  hitSlop={4}
                                >
                                  <Text
                                    style={[
                                      styles.eventDate,
                                      { color: colors.textTertiary },
                                    ]}
                                  >
                                    {new Date(event.date).toLocaleDateString(
                                      "uk-UA",
                                      {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "2-digit",
                                      },
                                    )}
                                  </Text>
                                </Pressable>
                              )}
                              {canDelete && (
                                <Pressable
                                  onPress={() => handleDeleteEvent(event)}
                                  hitSlop={8}
                                >
                                  <Ionicons
                                    name="trash-outline"
                                    size={15}
                                    color={colors.destructive}
                                  />
                                </Pressable>
                              )}
                            </View>
                          </View>

                          {/* Email автора (для спільних профілів) */}
                          {event.changedByEmail &&
                            event.changedByEmail !== user?.email && (
                              <Text
                                style={[
                                  styles.eventAuthor,
                                  { color: colors.textTertiary },
                                ]}
                                numberOfLines={1}
                              >
                                {event.changedByEmail}
                              </Text>
                            )}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </>
            )}

            {events.length === 0 && (
              <>
                <View
                  style={[styles.divider, { backgroundColor: colors.border }]}
                />
                <View
                  style={[
                    styles.emptyState,
                    { backgroundColor: colors.inputBg },
                  ]}
                >
                  <Ionicons
                    name="document-text-outline"
                    size={36}
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
              </>
            )}
          </View>
        </ScrollView>
      </View>

      <StatusPickerModal
        visible={statusEditEvent !== null}
        onClose={() => setStatusEditEvent(null)}
        title={t("tooth.pickStatus")}
        selected={statusEditEvent?.statusAfter}
        maps={statusMaps}
        onSelect={handleUpdateEventStatus}
        onManage={() => {
          router.push("/statuses");
          setStatusEditEvent(null);
        }}
        manageLabel={t("tooth.manageStatuses")}
        showEmpty={false}
      />

      {canEdit && (
        <Pressable
          style={({ pressed }) => [
            styles.fab,
            { backgroundColor: colors.accent, shadowColor: colors.shadow },
            pressed && styles.fabPressed,
          ]}
          onPress={openAdd}
        >
          <Text style={[styles.fabPlus, { color: colors.white }]}>+</Text>
        </Pressable>
      )}

      {androidDateEvent !== null && (
        <DateTimePicker
          value={new Date(androidDateEvent.date)}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={(_: DateTimePickerEvent, d?: Date) => {
            const event = androidDateEvent;
            setAndroidDateEvent(null);
            if (d) handleUpdateEventDate(event, d);
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 36,
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
  fabPlus: {
    fontSize: 48,
    fontWeight: "300",
    lineHeight: 52,
    includeFontPadding: false,
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
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 16,
  },
  // Timeline
  eventRow: {
    flexDirection: "row",
    gap: 12,
    paddingBottom: 4,
  },
  eventIconCol: {
    width: 24,
    alignItems: "center",
    paddingTop: 2,
  },
  eventStatusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  eventRecordIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  eventLine: {
    width: 1.5,
    flex: 1,
    marginTop: 4,
    marginBottom: 0,
    minHeight: 16,
  },
  eventContent: {
    flex: 1,
    paddingBottom: 14,
  },
  eventTopRow: {
    flexDirection: "row",
    gap: 8,
  },
  eventTitleBlock: {
    flex: 1,
  },
  eventStatusCol: {
    gap: 3,
  },
  eventStatusMeta: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  eventStatusLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  eventTitleRow: {
    gap: 5,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  eventStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  eventStatusBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  eventStatusBadgeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  eventActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  eventDate: {
    fontSize: 12,
  },
  eventNotes: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  eventAuthor: {
    fontSize: 11,
    marginTop: 3,
  },
  emptyState: {
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 8,
  },
  emptyHint: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  emptyCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  emptyCtaText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
