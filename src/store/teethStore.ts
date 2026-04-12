import { ensureCurrentProfileId } from "./profileStore";
import { getProfileData, saveProfileData } from "./firestoreService";
import type {
  AppData,
  ToothId,
  ToothEvent,
  ToothRecord,
  ToothStatus,
  GlobalProcedure,
  CustomStatus,
  CustomCategory,
} from "../types";

const defaultToothRecord = (toothId: ToothId): ToothRecord => ({
  toothId,
  events: [],
});

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

// ── Events ────────────────────────────────────────────────────────────────────

export async function addToothEvent(
  toothId: ToothId,
  event: Omit<ToothEvent, "id">,
): Promise<void> {
  const data = await loadData();
  const record = getToothRecord(data, toothId);
  const entry: ToothEvent = {
    ...event,
    id: `ev-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  };
  record.events = [entry, ...record.events].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
  record.lastUpdated = new Date().toISOString();
  data.teeth[toothId] = record;
  await saveData(data);
}

export async function updateToothEvent(
  toothId: ToothId,
  eventId: string,
  updates: Partial<Omit<ToothEvent, "id">>,
): Promise<void> {
  const data = await loadData();
  const record = getToothRecord(data, toothId);
  const idx = record.events.findIndex((e) => e.id === eventId);
  if (idx === -1) return;
  record.events[idx] = { ...record.events[idx], ...updates };
  record.events.sort((a, b) => b.date.localeCompare(a.date));
  record.lastUpdated = new Date().toISOString();
  data.teeth[toothId] = record;
  await saveData(data);
}

export async function deleteToothEvent(
  toothId: ToothId,
  eventId: string,
): Promise<void> {
  const data = await loadData();
  const record = getToothRecord(data, toothId);
  record.events = record.events.filter((e) => e.id !== eventId);
  record.lastUpdated = new Date().toISOString();
  data.teeth[toothId] = record;
  await saveData(data);
}

// Convenience: quick status change from home screen (no title/notes)
export async function setToothStatus(
  toothId: ToothId,
  status: ToothStatus,
  changedBy: string,
  changedByEmail: string,
): Promise<void> {
  await addToothEvent(toothId, {
    date: new Date().toISOString(),
    statusAfter: status,
    changedBy,
    changedByEmail,
  });
}

// ── Global procedures ─────────────────────────────────────────────────────────

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

export async function getCachedData(): Promise<AppData | null> {
  if (cached) return cached.data;
  return loadData();
}

// ── Custom statuses & categories ──────────────────────────────────────────────

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
