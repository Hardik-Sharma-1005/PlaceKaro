import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
  type UserCredential,
} from "firebase/auth";

import { auth } from "../firebase/auth";
import { getData, setData, updateData } from "../realtime/database";
import type { User, UserRole } from "../../types/database";

/**
 * Create a new Firebase Authentication account
 * and create the corresponding user record
 * in Realtime Database.
 */
export async function signUp(
  email: string,
  password: string,
  role: UserRole,
  displayName: string
): Promise<UserCredential> {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  const firebaseUser = userCredential.user;
  const now = Date.now();

  const userRecord: User = {
    uid: firebaseUser.uid,
    email: firebaseUser.email ?? email,
    role,
    displayName,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  if (firebaseUser.photoURL) {
    userRecord.photoURL = firebaseUser.photoURL;
  }

  await setData(`users/${firebaseUser.uid}`, userRecord);

  return userCredential;
}

/**
 * Sign in an existing user.
 */
export async function signIn(
  email: string,
  password: string
): Promise<UserCredential> {
  return await signInWithEmailAndPassword(auth, email, password);
}

/**
 * Sign out the currently authenticated user.
 */
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Get the application's user record from Realtime Database.
 */
export async function getUserRecord(
  uid: string
): Promise<User | null> {
  return await getData<User>(`users/${uid}`);
}

/**
 * Get the currently authenticated Firebase user.
 */
export function getCurrentFirebaseUser(): FirebaseUser | null {
  return auth.currentUser;
}

/**
 * Listen for Firebase Authentication state changes.
 */
export function onAuthStateChange(
  callback: (user: FirebaseUser | null) => void
) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Update fields in the current user's database record.
 */
export async function updateUserRecord(
  uid: string,
  data: Partial<Omit<User, "uid" | "createdAt">>
): Promise<void> {
  await updateData(`users/${uid}`, {
    ...data,
    updatedAt: Date.now(),
  });
}