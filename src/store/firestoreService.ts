import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  addDoc,
  serverTimestamp,
  writeBatch,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../firebase";
import type {
  AppData,
  ToothRecord,
  ToothChange,
  GlobalProcedure,
  CustomStatus,
} from "../types";
import { ALL_TOOTH_IDS } from "../types";
import type { ToothId } from "../types";

export type AccessRole = "owner" | "editor" | "viewer";

export interface ProfileMeta {
  id: string;
  name: string;
  ownerUid: string;
  createdAt: any;
}

export interface ProfileAccessEntry {
  id: string;
  profileId: string;
  uid: string;
  role: AccessRole;
  grantedAt: any;
  grantedBy: string;
}

export interface ProfileWithRole extends ProfileMeta {
  role: AccessRole;
}

// --------------- Snake_case converters ---------------

function toSnakeChange(c: ToothChange): Record<string, any> {
  const out: Record<string, any> = {
    id: c.id,
    tooth_id: c.toothId,
    date: c.date,
    title: c.title,
  };
  if (c.notes !== undefined) out.notes = c.notes;
  if (c.imageUri !== undefined) out.image_uri = c.imageUri;
  if (c.status !== undefined) out.status = c.status;
  return out;
}

function fromSnakeChange(raw: any): ToothChange {
  return {
    id: raw.id,
    toothId: raw.tooth_id ?? raw.toothId,
    date: raw.date,
    title: raw.title,
    notes: raw.notes,
    imageUri: raw.image_uri ?? raw.imageUri,
    status: raw.status,
  };
}

function toSnakeTooth(r: ToothRecord): Record<string, any> {
  const out: Record<string, any> = {
    tooth_id: r.toothId,
    changes: r.changes.map(toSnakeChange),
  };
  if (r.currentStatus !== undefined) out.current_status = r.currentStatus;
  if (r.lastUpdated !== undefined) out.last_updated = r.lastUpdated;
  return out;
}

function fromSnakeTooth(raw: any): ToothRecord {
  return {
    toothId: raw.tooth_id ?? raw.toothId,
    currentStatus: raw.current_status ?? raw.currentStatus,
    lastUpdated: raw.last_updated ?? raw.lastUpdated,
    changes: (raw.changes ?? []).map(fromSnakeChange),
  };
}

function toSnakeAppData(data: AppData): Record<string, any> {
  const teeth: Record<string, any> = {};
  for (const [id, rec] of Object.entries(data.teeth)) {
    teeth[id] = toSnakeTooth(rec);
  }
  return {
    teeth,
    global_procedures: data.globalProcedures,
    custom_statuses: data.customStatuses,
  };
}

function fromSnakeAppData(raw: any): AppData {
  const defaults = getDefaultData();
  const rawTeeth = raw.teeth ?? {};
  const teeth: Record<ToothId, ToothRecord> = { ...defaults.teeth };

  for (const [id, rec] of Object.entries(rawTeeth)) {
    teeth[id] = fromSnakeTooth(rec);
  }

  ALL_TOOTH_IDS.forEach((id) => {
    if (!teeth[id]) teeth[id] = defaultToothRecord(id);
    if (!Array.isArray(teeth[id].changes)) teeth[id].changes = [];
  });

  return {
    teeth,
    globalProcedures: raw.global_procedures ?? raw.globalProcedures ?? [],
    customStatuses: raw.custom_statuses ?? raw.customStatuses ?? [],
  };
}

// --------------- Helpers ---------------

function defaultToothRecord(toothId: ToothId): ToothRecord {
  return { toothId, changes: [] };
}

function getDefaultData(): AppData {
  const teeth: Record<ToothId, ToothRecord> = {};
  ALL_TOOTH_IDS.forEach((id) => {
    teeth[id] = defaultToothRecord(id);
  });
  return { teeth, globalProcedures: [], customStatuses: [] };
}

// --------------- Users ---------------

export async function createUserDoc(
  uid: string,
  email: string,
  displayName?: string,
): Promise<void> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      email,
      display_name: displayName ?? "",
      created_at: serverTimestamp(),
    });
  }
}

export async function getUserDoc(uid: string) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

export async function findUserByEmail(
  email: string,
): Promise<{ uid: string; email: string; displayName: string } | null> {
  const q = query(
    collection(db, "users"),
    where("email", "==", email.toLowerCase().trim()),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  const data = d.data();
  return {
    uid: d.id,
    email: data.email,
    displayName: data.display_name ?? "",
  };
}

// --------------- Profiles ---------------

export async function createProfile(
  name: string,
  ownerUid: string,
): Promise<string> {
  const batch = writeBatch(db);

  const profileRef = doc(collection(db, "profiles"));
  const profileId = profileRef.id;

  batch.set(profileRef, {
    name,
    owner_uid: ownerUid,
    created_at: serverTimestamp(),
  });

  const dataRef = doc(db, "profiles", profileId, "data", "main");
  batch.set(dataRef, toSnakeAppData(getDefaultData()));

  const accessRef = doc(collection(db, "profile_access"));
  batch.set(accessRef, {
    profile_id: profileId,
    uid: ownerUid,
    role: "owner" as AccessRole,
    granted_at: serverTimestamp(),
    granted_by: ownerUid,
  });

  await batch.commit();
  return profileId;
}

export async function getUserProfiles(uid: string): Promise<ProfileWithRole[]> {
  const q = query(collection(db, "profile_access"), where("uid", "==", uid));
  const snap = await getDocs(q);

  const results: ProfileWithRole[] = [];

  for (const accessDoc of snap.docs) {
    const access = accessDoc.data();
    const pid = access.profile_id ?? access.profileId;
    const profileSnap = await getDoc(doc(db, "profiles", pid));
    if (profileSnap.exists()) {
      const profile = profileSnap.data();
      results.push({
        id: pid,
        name: profile.name,
        ownerUid: profile.owner_uid ?? profile.ownerUid,
        createdAt: profile.created_at ?? profile.createdAt,
        role: access.role,
      });
    }
  }

  return results;
}

export async function updateProfileName(
  profileId: string,
  name: string,
): Promise<void> {
  await setDoc(doc(db, "profiles", profileId), { name }, { merge: true });
}

export async function deleteProfile(profileId: string): Promise<void> {
  const batch = writeBatch(db);

  batch.delete(doc(db, "profiles", profileId, "data", "main"));
  batch.delete(doc(db, "profiles", profileId));

  const q = query(
    collection(db, "profile_access"),
    where("profile_id", "==", profileId),
  );
  const snap = await getDocs(q);
  snap.docs.forEach((d) => batch.delete(d.ref));

  await batch.commit();
}

// --------------- Profile Data ---------------

export async function getProfileData(profileId: string): Promise<AppData> {
  const snap = await getDoc(doc(db, "profiles", profileId, "data", "main"));
  if (!snap.exists()) return getDefaultData();
  return fromSnakeAppData(snap.data());
}

export async function saveProfileData(
  profileId: string,
  data: AppData,
): Promise<void> {
  await setDoc(
    doc(db, "profiles", profileId, "data", "main"),
    toSnakeAppData(data),
  );
}

// --------------- Real-time Listeners ---------------

export function subscribeToProfileData(
  profileId: string,
  callback: (data: AppData) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, "profiles", profileId, "data", "main"),
    (snap) => {
      if (snap.exists()) {
        callback(fromSnakeAppData(snap.data()));
      }
    },
  );
}

export function subscribeToProfileAccess(
  uid: string,
  callback: () => void,
): Unsubscribe {
  const q = query(collection(db, "profile_access"), where("uid", "==", uid));
  return onSnapshot(q, () => {
    callback();
  });
}

// --------------- Access Management ---------------

export async function grantAccess(
  profileId: string,
  targetUid: string,
  role: AccessRole,
  grantedBy: string,
): Promise<void> {
  const q = query(
    collection(db, "profile_access"),
    where("profile_id", "==", profileId),
    where("uid", "==", targetUid),
  );
  const existing = await getDocs(q);

  if (!existing.empty) {
    const ref = existing.docs[0].ref;
    await setDoc(
      ref,
      { role, granted_at: serverTimestamp(), granted_by: grantedBy },
      { merge: true },
    );
  } else {
    await addDoc(collection(db, "profile_access"), {
      profile_id: profileId,
      uid: targetUid,
      role,
      granted_at: serverTimestamp(),
      granted_by: grantedBy,
    });
  }
}

export async function revokeAccess(
  profileId: string,
  targetUid: string,
): Promise<void> {
  const q = query(
    collection(db, "profile_access"),
    where("profile_id", "==", profileId),
    where("uid", "==", targetUid),
  );
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

export async function getProfileMembers(
  profileId: string,
): Promise<ProfileAccessEntry[]> {
  const q = query(
    collection(db, "profile_access"),
    where("profile_id", "==", profileId),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const raw = d.data();
    return {
      id: d.id,
      profileId: raw.profile_id ?? raw.profileId,
      uid: raw.uid,
      role: raw.role,
      grantedAt: raw.granted_at ?? raw.grantedAt,
      grantedBy: raw.granted_by ?? raw.grantedBy,
    } as ProfileAccessEntry;
  });
}

// --------------- Delete All User Data ---------------

export async function deleteAllUserData(uid: string): Promise<void> {
  const profiles = await getUserProfiles(uid);

  for (const profile of profiles) {
    if (profile.ownerUid === uid) {
      await deleteProfile(profile.id);
    } else {
      await revokeAccess(profile.id, uid);
    }
  }

  await deleteDoc(doc(db, "users", uid));
}
