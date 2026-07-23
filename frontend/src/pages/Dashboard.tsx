import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import type { Assignment } from "../api/types";
import { Section } from "../components/Section";

interface Buckets {
  today: Assignment[];
  week: Assignment[];
  recent: Assignment[];
  overdue: Assignment[];
}

const EMPTY: Buckets = { today: [], week: [], recent: [], overdue: [] };

export function Dashboard() {
  const [buckets, setBuckets] = useState<Buckets>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [today, week, recent, overdue] = await Promise.all([
        api.today(),
        api.week(),
        api.recent(),
        api.overdue(),
      ]);
      setBuckets({ today, week, recent, overdue });
    } catch {
      setError("Could not reach the backend. Is it running on port 8000?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      await api.sync();
      await load();
    } catch {
      setError("Sync failed.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Canvas Dashboard</h1>
          <p className="text-sm text-slate-500">Your assignments at a glance.</p>
        </div>
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {syncing ? "Syncing…" : "Sync now"}
        </button>
      </header>

      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : (
        <div className="grid gap-8 md:grid-cols-2">
          <Section title="Due Today" assignments={buckets.today} />
          <Section title="Due This Week" assignments={buckets.week} />
          <Section title="Recently Added" assignments={buckets.recent} />
          <Section title="Overdue" assignments={buckets.overdue} />
        </div>
      )}
    </div>
  );
}
