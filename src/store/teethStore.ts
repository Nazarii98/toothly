import { ensureCurrentProfileId } from "./profileStore";
import { getProfileData, saveProfileData } from "./firestoreService";
import type {
  AppData,
  ToothId,
  ToothChange,
  ToothRecord,
  ToothStatus,
  GlobalProcedure,
  CustomStatus,
  CustomCategory,
  StatusHistoryEntry,
} from "../types";
import { ALL_TOOTH_IDS } from "../types";

const defaultToothRecord = (toothId: ToothId): ToothRecord => ({
  toothId,
  changes: [],
});

function getDefaultData(): AppData {
  const teeth: Record<ToothId, ToothRecord> = {};
  ALL_TOOTH_IDS.forEach((id) => {
    teeth[id] = defaultToothRecord(id);
  });
  return {
    teeth,
    globalProcedures: [],
    customStatuses: [],
    customToothCategories: [],
    customGlobalCategories: [],
  };
}

let cached: { profileId: string; data: AppData } | null = null;

export function clearDataCache(): void {
  cached = null;
}

export function updateCachedData(profileId: string, data: AppData): void {
  cached = { profileId, data };
}

export async function loadDataForProfile(profileId: string): Promise<AppData> {
  return getProfileData(profileId);
}

export async function saveDataForProfile(
  profileId: string,
  data: AppData,
): Promise<void> {
  await saveProfileData(profileId, data);
}

export async function loadData(): Promise<AppData> {
  const profileId = await ensureCurrentProfileId();
  if (cached && cached.profileId === profileId) return cached.data;
  const data = await getProfileData(profileId);
  cached = { profileId, data };
  return cached.data;
}

async function saveData(data: AppData): Promise<void> {
  if (!cached) return;
  cached = { ...cached, data };
  await saveProfileData(cached.profileId, data);
}

export function getToothRecord(data: AppData, toothId: ToothId): ToothRecord {
  return data.teeth[toothId] ?? defaultToothRecord(toothId);
}

export async function addToothChange(
  toothId: ToothId,
  change: Omit<ToothChange, "id" | "toothId">,
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
  updates: Partial<Omit<ToothChange, "id" | "toothId">>,
): Promise<void> {
  const data = await loadData();
  const record = getToothRecord(data, toothId);
  const idx = record.changes.findIndex((c) => c.id === changeId);
  if (idx === -1) return;
  record.changes[idx] = { ...record.changes[idx], ...updates };
  record.lastUpdated = new Date().toISOString();
  await saveData(data);
}

export async function deleteToothChange(
  toothId: ToothId,
  changeId: string,
): Promise<void> {
  const data = await loadData();
  const record = getToothRecord(data, toothId);
  record.changes = record.changes.filter((c) => c.id !== changeId);
  record.lastUpdated = record.changes[0]?.date ?? undefined;
  await saveData(data);
}

export async function addGlobalProcedure(
  procedure: Omit<GlobalProcedure, "id">,
): Promise<void> {
  const data = await loadData();
  const entry: GlobalProcedure = {
    ...procedure,
    id: `gp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  };
  data.globalProcedures = [entry, ...data.globalProcedures];
  await saveData(data);
}

export async function updateGlobalProcedure(
  id: string,
  updates: Partial<Omit<GlobalProcedure, "id">>,
): Promise<void> {
  const data = await loadData();
  const idx = data.globalProcedures.findIndex((p) => p.id === id);
  if (idx >= 0) {
    data.globalProcedures[idx] = { ...data.globalProcedures[idx], ...updates };
    await saveData(data);
  }
}

export async function deleteGlobalProcedure(id: string): Promise<void> {
  const data = await loadData();
  data.globalProcedures = data.globalProcedures.filter((p) => p.id !== id);
  await saveData(data);
}

export async function setToothStatus(
  toothId: ToothId,
  status: ToothStatus,
  changedBy: string,
  changedByEmail: string,
): Promise<void> {
  const data = await loadData();
  const old = getToothRecord(data, toothId);
  const entry: StatusHistoryEntry = {
    id: `sh-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    status,
    date: new Date().toISOString(),
    changedBy,
    changedByEmail,
  };
  data.teeth[toothId] = {
    ...old,
    currentStatus: status,
    statusHistory: [entry, ...(old.statusHistory ?? [])],
    lastUpdated: new Date().toISOString(),
  };
  await saveData(data);
}

export async function updateStatusHistoryEntry(
  toothId: ToothId,
  entryId: string,
  updates: { status?: string; date?: string },
): Promise<void> {
  const data = await loadData();
  const record = getToothRecord(data, toothId);
  const history = record.statusHistory ?? [];
  const idx = history.findIndex((e) => e.id === entryId);
  if (idx === -1) return;
  history[idx] = { ...history[idx], ...updates };
  // re-sort by date descending
  history.sort((a, b) => b.date.localeCompare(a.date));
  record.statusHistory = history;
  // update currentStatus to the most recent entry's status
  if (history.length > 0) record.currentStatus = history[0].status;
  data.teeth[toothId] = record;
  await saveData(data);
}

export async function deleteStatusHistoryEntry(
  toothId: ToothId,
  entryId: string,
): Promise<void> {
  const data = await loadData();
  const record = getToothRecord(data, toothId);
  record.statusHistory = (record.statusHistory ?? []).filter((e) => e.id !== entryId);
  data.teeth[toothId] = record;
  await saveData(data);
}

export async function getCachedData(): Promise<AppData | null> {
  if (cached) return cached.data;
  return loadData();
}

export async function addCustomStatus(
  status: Omit<CustomStatus, "id">,
): Promise<CustomStatus> {
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

export async function addCustomToothCategory(
  category: Omit<CustomCategory, "id">,
): Promise<CustomCategory> {
  const data = await loadData();
  const entry: CustomCategory = {
    ...category,
    id: `tcat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  };
  data.customToothCategories = [...data.customToothCategories, entry];
  await saveData(data);
  return entry;
}

export async function deleteCustomToothCategory(id: string): Promise<void> {
  const data = await loadData();
  data.customToothCategories = data.customToothCategories.filter(
    (c) => c.id !== id,
  );
  await saveData(data);
}

export async function addCustomGlobalCategory(
  category: Omit<CustomCategory, "id">,
): Promise<CustomCategory> {
  const data = await loadData();
  const entry: CustomCategory = {
    ...category,
    id: `gcat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  };
  data.customGlobalCategories = [...data.customGlobalCategories, entry];
  await saveData(data);
  return entry;
}

export async function deleteCustomGlobalCategory(id: string): Promise<void> {
  const data = await loadData();
  data.customGlobalCategories = data.customGlobalCategories.filter(
    (c) => c.id !== id,
  );
  await saveData(data);
}
