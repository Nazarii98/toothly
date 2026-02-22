import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppData, ToothId, ToothChange, ToothRecord, ToothStatus, GlobalProcedure, CustomStatus } from '../types';
import { ALL_TOOTH_IDS } from '../types';

const STORAGE_KEY = '@teeth_manager_data';

const defaultToothRecord = (toothId: ToothId): ToothRecord => ({
  toothId,
  changes: [],
});

function getDefaultData(): AppData {
  const teeth: Record<ToothId, ToothRecord> = {};
  ALL_TOOTH_IDS.forEach((id) => {
    teeth[id] = defaultToothRecord(id);
  });
  return { teeth, globalProcedures: [], customStatuses: [] };
}

let cached: AppData | null = null;

export async function loadData(): Promise<AppData> {
  if (cached) return cached;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppData;
      // ensure all teeth exist
      const teeth = { ...getDefaultData().teeth, ...parsed.teeth };
      ALL_TOOTH_IDS.forEach((id) => {
        if (!teeth[id]) teeth[id] = defaultToothRecord(id);
        if (!Array.isArray(teeth[id].changes)) teeth[id].changes = [];
      });
      cached = { teeth, globalProcedures: parsed.globalProcedures ?? [], customStatuses: parsed.customStatuses ?? [] };
      return cached!;
    }
  } catch (_) {}
  cached = getDefaultData();
  return cached;
}

async function saveData(data: AppData): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  cached = null;
}

export function getToothRecord(data: AppData, toothId: ToothId): ToothRecord {
  return data.teeth[toothId] ?? defaultToothRecord(toothId);
}

export async function addToothChange(
  toothId: ToothId,
  change: Omit<ToothChange, 'id' | 'toothId'>
): Promise<void> {
  const data = await loadData();
  const record = getToothRecord(data, toothId);
  const entry: ToothChange = {
    ...change,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    toothId,
  };
  record.changes = [entry, ...record.changes];
  record.lastUpdated = new Date().toISOString();
  data.teeth[toothId] = record;
  await saveData(data);
}

export async function updateToothChange(
  toothId: ToothId,
  changeId: string,
  updates: Partial<Omit<ToothChange, 'id' | 'toothId'>>
): Promise<void> {
  const data = await loadData();
  const record = getToothRecord(data, toothId);
  const idx = record.changes.findIndex((c) => c.id === changeId);
  if (idx === -1) return;
  record.changes[idx] = { ...record.changes[idx], ...updates };
  record.lastUpdated = new Date().toISOString();
  await saveData(data);
}

export async function deleteToothChange(toothId: ToothId, changeId: string): Promise<void> {
  const data = await loadData();
  const record = getToothRecord(data, toothId);
  record.changes = record.changes.filter((c) => c.id !== changeId);
  record.lastUpdated = record.changes[0]?.date ?? undefined;
  await saveData(data);
}

export async function addGlobalProcedure(
  procedure: Omit<GlobalProcedure, 'id'>
): Promise<void> {
  const data = await loadData();
  const entry: GlobalProcedure = {
    ...procedure,
    id: `gp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  };
  data.globalProcedures = [entry, ...data.globalProcedures];
  await saveData(data);
}

export async function deleteGlobalProcedure(id: string): Promise<void> {
  const data = await loadData();
  data.globalProcedures = data.globalProcedures.filter((p) => p.id !== id);
  await saveData(data);
}

export async function setToothStatus(toothId: ToothId, status: ToothStatus): Promise<void> {
  const data = await loadData();
  const old = getToothRecord(data, toothId);
  data.teeth[toothId] = {
    ...old,
    currentStatus: status,
    lastUpdated: new Date().toISOString(),
  };
  await saveData(data);
}

export async function getCachedData(): Promise<AppData | null> {
  if (cached) return cached;
  return loadData();
}

export async function addCustomStatus(status: Omit<CustomStatus, 'id'>): Promise<CustomStatus> {
  const data = await loadData();
  const entry: CustomStatus = {
    ...status,
    id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  };
  data.customStatuses = [...data.customStatuses, entry];
  await saveData(data);
  return entry;
}

export async function deleteCustomStatus(id: string): Promise<void> {
  const data = await loadData();
  data.customStatuses = data.customStatuses.filter((s) => s.id !== id);
  await saveData(data);
}
