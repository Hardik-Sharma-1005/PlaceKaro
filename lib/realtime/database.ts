import {
  get,
  push,
  ref,
  set,
  update,
  remove,
  type DatabaseReference,
} from "firebase/database";

import { database } from "../firebase/database";

export async function getData<T>(
  path: string
): Promise<T | null> {
  const snapshot = await get(ref(database, path));

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.val() as T;
}

export async function setData<T>(
  path: string,
  data: T
): Promise<void> {
  await set(ref(database, path), data);
}

export async function updateData<T extends Record<string, unknown>>(
  path: string,
  data: T
): Promise<void> {
  await update(ref(database, path), data);
}

export async function deleteData(
  path: string
): Promise<void> {
  await remove(ref(database, path));
}

export async function createData<T>(
  collectionPath: string,
  data: T
): Promise<string> {
  const collectionRef = ref(database, collectionPath);
  const newRef: DatabaseReference = push(collectionRef);

  if (!newRef.key) {
    throw new Error("Failed to generate database ID.");
  }

  await set(newRef, data);

  return newRef.key;
}