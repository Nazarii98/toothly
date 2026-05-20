import AsyncStorage from "@react-native-async-storage/async-storage";

const ONBOARDING_COMPLETED_KEY = "@toothly_onboarding_completed";
const PENDING_PROFILE_NAME_KEY = "@toothly_onboarding_pending_profile_name";

type Listener = (completed: boolean) => void;

const listeners = new Set<Listener>();
let cachedCompleted: boolean | null = null;

function notify(completed: boolean): void {
  listeners.forEach((listener) => listener(completed));
}

export function subscribeToOnboardingCompletion(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function getOnboardingCompleted(): Promise<boolean> {
  if (cachedCompleted !== null) return cachedCompleted;
  try {
    cachedCompleted =
      (await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY)) === "true";
  } catch {
    cachedCompleted = false;
  }
  return cachedCompleted;
}

export async function markOnboardingCompleted(): Promise<void> {
  cachedCompleted = true;
  await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, "true");
  notify(true);
}

export async function savePendingProfileName(name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) {
    await AsyncStorage.removeItem(PENDING_PROFILE_NAME_KEY);
    return;
  }
  await AsyncStorage.setItem(PENDING_PROFILE_NAME_KEY, trimmed);
}

export async function getPendingProfileName(): Promise<string | null> {
  try {
    const name = await AsyncStorage.getItem(PENDING_PROFILE_NAME_KEY);
    return name?.trim() || null;
  } catch {
    return null;
  }
}

export async function clearPendingProfileName(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_PROFILE_NAME_KEY);
}
