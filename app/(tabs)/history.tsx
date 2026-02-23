import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  Pressable,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAppTheme } from '../../src/theme';
import { loadData } from '../../src/store/teethStore';
import { QUADRANT_LABELS, TOOTH_NAMES, GLOBAL_PROCEDURE_TYPES, buildStatusMaps } from '../../src/types';
import type { ToothChange, GlobalProcedure, StatusMaps } from '../../src/types';

type HistoryItem =
  | { type: 'tooth'; data: ToothChange }
  | { type: 'global'; data: GlobalProcedure };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('uk-UA', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function groupByDate(items: HistoryItem[]): { title: string; data: HistoryItem[] }[] {
  const map = new Map<string, HistoryItem[]>();
  items.forEach((item) => {
    const date = item.data.date;
    const key = formatDate(date);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  });
  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
}

export default function HistoryScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const [sections, setSections] = useState<{ title: string; data: HistoryItem[] }[]>([]);
  const [statusMaps, setStatusMaps] = useState<StatusMaps>(buildStatusMaps());

  const refresh = useCallback(async () => {
    const appData = await loadData();
    setStatusMaps(buildStatusMaps(appData.customStatuses));
    const items: HistoryItem[] = [];
    Object.values(appData.teeth).forEach((r) => {
      r.changes.forEach((c) => items.push({ type: 'tooth', data: c }));
    });
    appData.globalProcedures.forEach((p) => items.push({ type: 'global', data: p }));
    items.sort((a, b) => b.data.date.localeCompare(a.data.date));
    setSections(groupByDate(items));
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const renderItem = ({ item }: { item: HistoryItem }) => {
    if (item.type === 'tooth') {
      const c = item.data;
      const q = c.toothId[0];
      const t = c.toothId[1];
      return (
        <Pressable
          style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
          onPress={() => router.push(`/tooth/${c.toothId}`)}
        >
          <View style={styles.cardRow}>
            <View style={[styles.badge, { backgroundColor: colors.accent }]}>
              <Text style={styles.badgeText}>{c.toothId}</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{c.title}</Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                {TOOTH_NAMES[t] ?? ''} · {QUADRANT_LABELS[q] ?? ''}
              </Text>
              {c.status && (
                <Text style={[styles.cardStatus, { color: colors.accent }]}>{statusMaps.labels[c.status] ?? c.status}</Text>
              )}
              {c.notes ? <Text style={[styles.cardNotes, { color: colors.textSecondary }]}>{c.notes}</Text> : null}
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
      <View style={[styles.card, styles.globalCard, { backgroundColor: colors.cardSecondary, shadowColor: colors.shadow }]}>
        <View style={styles.cardRow}>
          <View style={[styles.badge, styles.globalBadge, { backgroundColor: colors.textSecondary }]}>
            <Text style={styles.badgeText}>GP</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{p.title}</Text>
            <Text style={[styles.cardStatus, { color: colors.textSecondary }]}>{GLOBAL_PROCEDURE_TYPES[p.type]}</Text>
            {p.notes ? <Text style={[styles.cardNotes, { color: colors.textSecondary }]}>{p.notes}</Text> : null}
          </View>
          <Text style={[styles.cardTime, { color: colors.textTertiary }]}>{formatTime(p.date)}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.data.id}
        renderItem={renderItem}
        renderSectionHeader={({ section }) => (
          <Text style={[styles.sectionHeader, { color: colors.text, backgroundColor: colors.bg }]}>{section.title}</Text>
        )}
        contentContainerStyle={[styles.listContent, { backgroundColor: colors.bg }]}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.textSecondary }]}>Історія порожня. Додайте перший запис.</Text>
        }
      />
      <Pressable
        style={({ pressed }) => [styles.fab, { backgroundColor: colors.accent }, pressed && styles.fabPressed]}
        onPress={() => router.push('/add-record')}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  listContent: { paddingBottom: 120, paddingHorizontal: 16 },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    paddingVertical: 10,
    marginTop: 8,
  },
  card: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e8e4',
  },
  globalCard: {
    borderColor: '#d0dcd6',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  globalBadge: {},
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
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
    width: '100%',
    height: 160,
    borderRadius: 14,
    marginTop: 10,
  },
  empty: {
    textAlign: 'center',
    marginTop: 48,
    fontSize: 15,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1a3d32',
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
