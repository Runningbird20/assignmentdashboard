import type { Assignment, SyncResult } from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Request to ${path} failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

export const api = {
  today: () => getJson<Assignment[]>("/assignments/today"),
  week: () => getJson<Assignment[]>("/assignments/week"),
  recent: () => getJson<Assignment[]>("/assignments/recent"),
  overdue: () => getJson<Assignment[]>("/assignments/overdue"),
  sync: async (): Promise<SyncResult> => {
    const response = await fetch(`${API_URL}/sync`, { method: "POST" });
    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status}`);
    }
    return (await response.json()) as SyncResult;
  },
};
