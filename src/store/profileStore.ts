import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "../firebase";
import {
  createProfile as fsCreateProfile,
  getUserProfiles,
  updateProfileName,
  deleteProfile as fsDeleteProfile,
  type ProfileWithRole,
} from "./firestoreService";

export interface Profile {
  id: string;
  name: string;
  role?: string;
}

const CURRENT_PROFILE_KEY = "@teeth_manager_current_profile";

let cachedProfiles: Profile[] | null = null;
let cachedCurrentId: string | null = null;

function getUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not authenticated");
  return uid;
}

export async function getProfiles(): Promise<Profile[]> {
  if (cachedProfiles) return cachedProfiles;
  const uid = getUid();
  const list = await getUserProfiles(uid);
  cachedProfiles = list.map((p: ProfileWithRole) => ({
    id: p.id,
    name: p.name,
    role: p.role,
  }));
  return cachedProfiles;
}

export async function getCurrentProfileId(): Promise<string | null> {
  if (cachedCurrentId) return cachedCurrentId;
  try {
    const id = await AsyncStorage.getItem(CURRENT_PROFILE_KEY);
    cachedCurrentId = id;
    return id;
  } catch (_) {}
  return null;
}

export async function ensureCurrentProfileId(): Promise<string> {
  let id = await getCurrentProfileId();
  const profiles = await getProfiles();
  if (profiles.length === 0) {
    const newProfile = await addProfile("Профіль 1");
    await setCurrentProfileId(newProfile.id);
    return newProfile.id;
  }
  if (!id || !profiles.some((p) => p.id === id)) {
    id = profiles[0].id;
    await setCurrentProfileId(id);
  }
  return id;
}

export async function setCurrentProfileId(id: string): Promise<void> {
  await AsyncStorage.setItem(CURRENT_PROFILE_KEY, id);
  cachedCurrentId = id;
}

export async function addProfile(name: string): Promise<Profile> {
  const uid = getUid();
  const profileId = await fsCreateProfile(name.trim() || "Профіль", uid);
  const profile: Profile = { id: profileId, name: name.trim() || "Профіль", role: "owner" };
  if (cachedProfiles) {
    cachedProfiles = [...cachedProfiles, profile];
  } else {
    cachedProfiles = [profile];
  }
  if (cachedProfiles.length === 1) {
    await setCurrentProfileId(profile.id);
  }
  return profile;
}

export async function updateProfile(id: string, name: string): Promise<void> {
  await updateProfileName(id, name.trim());
  if (cachedProfiles) {
    cachedProfiles = cachedProfiles.map((p) =>
      p.id === id ? { ...p, name: name.trim() || p.name } : p,
    );
  }
}

export async function deleteProfile(id: string): Promise<void> {
  await fsDeleteProfile(id);
  if (cachedProfiles) {
    cachedProfiles = cachedProfiles.filter((p) => p.id !== id);
  }
  const current = await getCurrentProfileId();
  if (current === id) {
    const profiles = cachedProfiles ?? [];
    if (profiles.length > 0) {
      await setCurrentProfileId(profiles[0].id);
    } else {
      cachedCurrentId = null;
      await AsyncStorage.removeItem(CURRENT_PROFILE_KEY);
    }
  }
}

export async function getCurrentProfileRole(): Promise<string> {
  const profiles = await getProfiles();
  const id = await getCurrentProfileId();
  return profiles.find((p) => p.id === id)?.role ?? "owner";
}

export function invalidateProfileCache(): void {
  cachedProfiles = null;
  cachedCurrentId = null;
}
