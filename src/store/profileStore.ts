import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Profile {
  id: string;
  name: string;
}

const PROFILES_KEY = "@teeth_manager_profiles";
const CURRENT_PROFILE_KEY = "@teeth_manager_current_profile";
const DATA_KEY_PREFIX = "@teeth_manager_data_";

let cachedProfiles: Profile[] | null = null;
let cachedCurrentId: string | null = null;

export async function getProfiles(): Promise<Profile[]> {
  if (cachedProfiles) return cachedProfiles;
  try {
    const raw = await AsyncStorage.getItem(PROFILES_KEY);
    if (raw) {
      const list = JSON.parse(raw) as Profile[];
      cachedProfiles = Array.isArray(list) ? list : [];
      return cachedProfiles;
    }
  } catch (_) {}
  cachedProfiles = [];
  return [];
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

/** Returns current profile id; if none, ensures at least one profile exists and returns its id */
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
  const profiles = await getProfiles();
  const profile: Profile = {
    id: `profile_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim() || "Профіль",
  };
  const next = [...profiles, profile];
  await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(next));
  cachedProfiles = next;
  if (profiles.length === 0) {
    await setCurrentProfileId(profile.id);
  }
  return profile;
}

export async function updateProfile(id: string, name: string): Promise<void> {
  const profiles = await getProfiles();
  const next = profiles.map((p) =>
    p.id === id ? { ...p, name: name.trim() || p.name } : p,
  );
  await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(next));
  cachedProfiles = next;
}

export async function deleteProfile(id: string): Promise<void> {
  const profiles = await getProfiles().then((list) =>
    list.filter((p) => p.id !== id),
  );
  await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  await AsyncStorage.removeItem(`${DATA_KEY_PREFIX}${id}`);
  cachedProfiles = profiles;
  const current = await getCurrentProfileId();
  if (current === id && profiles.length > 0) {
    await setCurrentProfileId(profiles[0].id);
  } else if (current === id) {
    cachedCurrentId = null;
    await AsyncStorage.removeItem(CURRENT_PROFILE_KEY);
  }
}

export function invalidateProfileCache(): void {
  cachedProfiles = null;
  cachedCurrentId = null;
}
