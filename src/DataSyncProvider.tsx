import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./AuthProvider";
import { ensureCurrentProfileId, invalidateProfileCache } from "./store/profileStore";
import { updateCachedData, clearDataCache } from "./store/teethStore";
import {
  subscribeToProfileData,
  subscribeToProfileAccess,
} from "./store/firestoreService";
import type { AppData } from "./types";

interface DataSyncContextValue {
  dataRevision: number;
  profilesRevision: number;
  resubscribe: () => void;
}

const DataSyncContext = createContext<DataSyncContextValue>({
  dataRevision: 0,
  profilesRevision: 0,
  resubscribe: () => {},
});

export function DataSyncProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [dataRevision, setDataRevision] = useState(0);
  const [profilesRevision, setProfilesRevision] = useState(0);
  const [subKey, setSubKey] = useState(0);

  const resubscribe = useCallback(() => {
    setSubKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!user) return;

    let unsub: (() => void) | null = null;
    let cancelled = false;

    const setup = async () => {
      try {
        const profileId = await ensureCurrentProfileId();
        if (cancelled) return;

        let isFirst = true;
        unsub = subscribeToProfileData(profileId, (data: AppData) => {
          if (isFirst) {
            isFirst = false;
            return;
          }
          updateCachedData(profileId, data);
          setDataRevision((r) => r + 1);
        });
      } catch {
        /* profile not ready yet */
      }
    };

    setup();

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [user, subKey]);

  useEffect(() => {
    if (!user) return;

    let isFirst = true;
    const unsub = subscribeToProfileAccess(user.uid, () => {
      if (isFirst) {
        isFirst = false;
        return;
      }
      invalidateProfileCache();
      setProfilesRevision((r) => r + 1);
    });

    return () => unsub();
  }, [user]);

  const value = useMemo(
    () => ({ dataRevision, profilesRevision, resubscribe }),
    [dataRevision, profilesRevision, resubscribe],
  );

  return (
    <DataSyncContext.Provider value={value}>
      {children}
    </DataSyncContext.Provider>
  );
}

export function useDataSync() {
  return useContext(DataSyncContext);
}
