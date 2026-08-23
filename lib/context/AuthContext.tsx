"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  onAuthStateChange,
  getUserRecord,
} from "../services/authService";

import type { User } from "../../types/database";

interface AuthContextValue {
  firebaseUser: import("firebase/auth").User | null;
  user: User | null;
  loading: boolean;
  userError: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [firebaseUser, setFirebaseUser] =
    useState<import("firebase/auth").User | null>(null);

  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);

  const [userError, setUserError] = useState<string | null>(
    null
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (currentUser) => {
      setFirebaseUser(currentUser);
      setUserError(null);

      if (!currentUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const userRecord = await getUserRecord(currentUser.uid);

        console.log(
          "PlaceKaro user record returned from Firebase:",
          userRecord
        );

        setUser(userRecord);
      } catch (error) {
        console.error(
          "Failed to load current user record:",
          error
        );

        setUser(null);

        setUserError(
          error instanceof Error
            ? error.message
            : String(error)
        );
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user,
        loading,
        userError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider."
    );
  }

  return context;
}