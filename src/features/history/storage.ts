import AsyncStorage from "@react-native-async-storage/async-storage";
import type { HistoryEntry } from "./types";

const GUEST_HISTORY_KEY = "@zakat:guest-history:v1";

function sortNewestFirst(entries: HistoryEntry[]) {
  return [...entries].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

async function getRawStorageItem(key: string): Promise<string | null> {
  if (typeof localStorage !== "undefined") {
    return localStorage.getItem(key);
  }
  return AsyncStorage.getItem(key);
}

async function setRawStorageItem(key: string, value: string): Promise<void> {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(key, value);
    return;
  }
  await AsyncStorage.setItem(key, value);
}

export async function getGuestHistoryEntries(): Promise<HistoryEntry[]> {
  try {
    const raw = await getRawStorageItem(GUEST_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryEntry[];
    if (!Array.isArray(parsed)) return [];
    return sortNewestFirst(parsed);
  } catch (error) {
    console.error("Failed to load guest history entries", error);
    return [];
  }
}

export async function saveGuestHistoryEntries(entries: HistoryEntry[]): Promise<void> {
  try {
    await setRawStorageItem(GUEST_HISTORY_KEY, JSON.stringify(sortNewestFirst(entries)));
  } catch (error) {
    console.error("Failed to save guest history entries", error);
  }
}

export async function upsertGuestHistoryEntry(entry: HistoryEntry): Promise<void> {
  const all = await getGuestHistoryEntries();
  const existingIndex = all.findIndex((item) => item.id === entry.id);
  if (existingIndex >= 0) {
    all[existingIndex] = entry;
  } else {
    all.unshift(entry);
  }
  await saveGuestHistoryEntries(all);
}

export async function deleteGuestHistoryEntry(id: string): Promise<void> {
  const all = await getGuestHistoryEntries();
  const filtered = all.filter((entry) => entry.id !== id);
  await saveGuestHistoryEntries(filtered);
}

export async function duplicateGuestHistoryEntry(id: string): Promise<HistoryEntry | null> {
  const all = await getGuestHistoryEntries();
  const source = all.find((entry) => entry.id === id);
  if (!source) return null;

  const now = new Date().toISOString();
  const clone: HistoryEntry = {
    ...source,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    updatedAt: now,
  };
  await saveGuestHistoryEntries([clone, ...all]);
  return clone;
}

export async function getGuestHistoryEntryById(id: string): Promise<HistoryEntry | null> {
  const all = await getGuestHistoryEntries();
  return all.find((entry) => entry.id === id) ?? null;
}
