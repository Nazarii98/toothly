import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import type { User } from "firebase/auth";
import {
  signUp as authSignUp,
  signIn as authSignIn,
  signOutUser,
  resetPassword as authResetPassword,
  reauthenticate,
  deleteAccount as authDeleteAccount,
  onAuthChange,
} from "./store/authStore";
import { createUserDoc, deleteAllUserData } from "./store/firestoreService";
import { invalidateProfileCache } from "./store/profileStore";
import { clearDataCache } from "./store/teethStore";
import { migrateLocalDataToFirestore } from "./store/migrateLocal";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  deleteAccount: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (u) => {
      if (u) {
        await createUserDoc(u.uid, u.email ?? "");
        await migrateLocalDataToFirestore(u.uid);
      } else {
        invalidateProfileCache();
        clearDataCache();
      }
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleSignIn = useCallback(async (email: string, password: string) => {
    await authSignIn(email, password);
  }, []);

  const handleSignUp = useCallback(async (email: string, password: string) => {
    const u = await authSignUp(email, password);
    await createUserDoc(u.uid, u.email ?? email);
  }, []);

  const handleSignOut = useCallback(async () => {
    invalidateProfileCache();
    clearDataCache();
    await signOutUser();
  }, []);

  const handleResetPassword = useCallback(async (email: string) => {
    await authResetPassword(email);
  }, []);

  const handleDeleteAccount = useCallback(async (password: string) => {
    const u = user;
    if (!u) throw new Error("Not authenticated");
    await reauthenticate(password);
    await deleteAllUserData(u.uid);
    invalidateProfileCache();
    clearDataCache();
    await authDeleteAccount();
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      loading,
      signIn: handleSignIn,
      signUp: handleSignUp,
      signOut: handleSignOut,
      resetPassword: handleResetPassword,
      deleteAccount: handleDeleteAccount,
    }),
    [user, loading, handleSignIn, handleSignUp, handleSignOut, handleResetPassword, handleDeleteAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
