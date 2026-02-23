import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createProfile,
  saveProfileData,
  getUserProfiles,
} from "./firestoreService";
import type { AppData } from "../types";
import { ALL_TOOTH_IDS } from "../types";
import type { ToothId, ToothRecord } from "../types";

const OLD_PROFILES_KEY = "@teeth_manager_profiles";
const OLD_DATA_PREFIX = "@teeth_manager_data_";
const MIGRATION_DONE_KEY = "@teeth_manager_migration_done";

interface OldProfile {
  id: string;
  name: string;
}

function defaultToothRecord(toothId: ToothId): ToothRecord {
  return { toothId, changes: [] };
}

function normalizeAppData(raw: any): AppData {
  const defaults: Record<ToothId, ToothRecord> = {};
  ALL_TOOTH_IDS.forEach((id) => {
    defaults[id] = defaultToothRecord(id);
  });
  const teeth = { ...defaults, ...(raw?.teeth ?? {}) };
  ALL_TOOTH_IDS.forEach((id) => {
    if (!teeth[id]) teeth[id] = defaultToothRecord(id);
    if (!Array.isArray(teeth[id].changes)) teeth[id].changes = [];
  });
  return {
    teeth,
    globalProcedures: raw?.globalProcedures ?? [],
    customStatuses: raw?.customStatuses ?? [],
  };
}

export async function migrateLocalDataToFirestore(
  uid: string,
): Promise<boolean> {
  try {
    const done = await AsyncStorage.getItem(MIGRATION_DONE_KEY);
    if (done === "true") return false;

    const existing = await getUserProfiles(uid);
    if (existing.length > 0) {
      await AsyncStorage.setItem(MIGRATION_DONE_KEY, "true");
      return false;
    }

    const raw = await AsyncStorage.getItem(OLD_PROFILES_KEY);
    if (!raw) {
      await AsyncStorage.setItem(MIGRATION_DONE_KEY, "true");
      return false;
    }

    const oldProfiles: OldProfile[] = JSON.parse(raw);
    if (!Array.isArray(oldProfiles) || oldProfiles.length === 0) {
      await AsyncStorage.setItem(MIGRATION_DONE_KEY, "true");
      return false;
    }

    for (const oldProfile of oldProfiles) {
      const dataRaw = await AsyncStorage.getItem(
        `${OLD_DATA_PREFIX}${oldProfile.id}`,
      );
      const data = dataRaw ? normalizeAppData(JSON.parse(dataRaw)) : undefined;

      const newProfileId = await createProfile(oldProfile.name, uid);

      if (data) {
        await saveProfileData(newProfileId, data);
      }
    }

    await AsyncStorage.setItem(MIGRATION_DONE_KEY, "true");
    return true;
  } catch (e) {
    console.warn("Migration failed:", e);
    return false;
  }
}
