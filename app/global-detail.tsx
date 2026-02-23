import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../src/theme";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { loadData } from "../src/store/teethStore";
import { GLOBAL_PROCEDURE_TYPES } from "../src/types";
import type { GlobalProcedure } from "../src/types";

export default function GlobalDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  const [procedures, setProcedures] = useState<GlobalProcedure[]>([]);

  const refresh = useCallback(async () => {
    const data = await loadData();
    setProcedures(
      [...data.globalProcedures].sort((a, b) => b.date.localeCompare(a.date)),
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const openAdd = () => {
    router.push("/add-record?target=global");
  };

  const openEdit = (proc: GlobalProcedure) => {
    router.push(`/edit-global?id=${proc.id}`);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <>
      <Stack.Screen
        options={{
          title: "Ротова порожнина",
          headerRight: () => (
            <Pressable
              onPress={openAdd}
              hitSlop={8}
              style={styles.headerAddBtn}
            >
              <Ionicons name="add" size={26} color={colors.text} />
            </Pressable>
          ),
        }}
      />
      <View style={[styles.safe, { backgroundColor: colors.bg }]}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + 68,
              paddingBottom: insets.bottom + 24,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Info card */}
          <View
            style={[
              styles.infoCard,
              { backgroundColor: colors.card, shadowColor: colors.shadow },
            ]}
          >
            <View
              style={[styles.infoIcon, { backgroundColor: colors.accentBg }]}
            >
              <Ionicons
                name="medical-outline"
                size={24}
                color={colors.accent}
              />
            </View>
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              Загальні процедури
            </Text>
            <Text style={[styles.infoHint, { color: colors.textSecondary }]}>
              Чистка, відбілювання, огляд та інші процедури ротової порожнини
            </Text>
            <View
              style={[styles.infoBadge, { backgroundColor: colors.accentBg }]}
            >
              <Text style={[styles.infoBadgeText, { color: colors.accent }]}>
                {procedures.length}{" "}
                {procedures.length === 1
                  ? "запис"
                  : procedures.length < 5
                    ? "записи"
                    : "записів"}
              </Text>
            </View>
          </View>

          {/* History */}
          <View style={styles.historySection}>
            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
              Історія процедур
            </Text>

            {procedures.length === 0 ? (
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
                  Додайте першу загальну процедуру
                </Text>
                <Pressable
                  style={[styles.emptyCta, { backgroundColor: colors.accent }]}
                  onPress={openAdd}
                >
                  <Ionicons name="add" size={20} color={colors.white} />
                  <Text style={[styles.emptyCtaText, { color: colors.white }]}>
                    Додати запис
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.recordList}>
                {procedures.map((p) => (
                  <Pressable
                    key={p.id}
                    style={[
                      styles.recordCard,
                      {
                        backgroundColor: colors.card,
                        shadowColor: colors.shadow,
                      },
                    ]}
                    onPress={() => openEdit(p)}
                  >
                    <View style={styles.recordCardTop}>
                      <Text
                        style={[styles.recordTitle, { color: colors.text }]}
                        numberOfLines={2}
                      >
                        {p.title}
                      </Text>
                      <View style={styles.recordMeta}>
                        <View
                          style={[
                            styles.recordStatusBadge,
                            { backgroundColor: colors.accentBg },
                          ]}
                        >
                          <Text
                            style={[
                              styles.recordStatusText,
                              { color: colors.accent },
                            ]}
                          >
                            {GLOBAL_PROCEDURE_TYPES[p.type]}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.recordDate,
                            { color: colors.textTertiary },
                          ]}
                        >
                          {formatDate(p.date)}
                        </Text>
                      </View>
                    </View>

                    {p.notes ? (
                      <Text
                        style={[
                          styles.recordNotes,
                          { color: colors.textSecondary },
                        ]}
                        numberOfLines={3}
                      >
                        {p.notes}
                      </Text>
                    ) : null}
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
  },

  infoCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  infoIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  infoHint: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  infoBadge: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  infoBadgeText: {
    fontSize: 13,
    fontWeight: "600",
  },

  historySection: {},
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
  },

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
