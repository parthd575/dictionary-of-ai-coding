import { useSyncExternalStore } from "react";

const KEY = "dac:learned";
const listeners = new Set<() => void>();
let cache: ReadonlySet<string> | null = null;

function read(): ReadonlySet<string> {
  if (cache) return cache;
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    cache = new Set(Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : []);
  } catch {
    cache = new Set();
  }
  return cache;
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function toggleLearned(slug: string) {
  const next = new Set(read());
  if (!next.delete(slug)) next.add(slug);
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify([...next]));
  } catch {
    // storage unavailable: the mark lasts for this visit only
  }
  listeners.forEach((fn) => fn());
}

export function useLearned(): ReadonlySet<string> {
  return useSyncExternalStore(subscribe, read, read);
}
