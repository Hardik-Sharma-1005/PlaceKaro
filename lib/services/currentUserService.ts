import { getCurrentFirebaseUser, getUserRecord } from "./authService";
import type { User } from "../../types/database";

export async function getCurrentUserRecord(): Promise<User | null> {
  const firebaseUser = getCurrentFirebaseUser();

  if (!firebaseUser) {
    return null;
  }

  return await getUserRecord(firebaseUser.uid);
}

export async function getCurrentUserRole(): Promise<User["role"] | null> {
  const userRecord = await getCurrentUserRecord();

  return userRecord?.role ?? null;
}