"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export interface QueueEntry {
  id: string;
  title: string;
  client: string;
  type: string;
  source: "suggest" | "extract";
  timestamp: string;
}

interface QueueContextValue {
  entries: QueueEntry[];
  suggestCount: number;
  extractCount: number;
  totalCount: number;
  addSuggestion: (entry: Omit<QueueEntry, "source" | "timestamp">) => void;
  addExtractions: (entries: Omit<QueueEntry, "source" | "timestamp">[]) => void;
}

const QueueContext = createContext<QueueContextValue>({
  entries: [],
  suggestCount: 0,
  extractCount: 0,
  totalCount: 0,
  addSuggestion: () => {},
  addExtractions: () => {},
});

export function QueueProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<QueueEntry[]>([]);

  const suggestCount = entries.filter((e) => e.source === "suggest").length;
  const extractCount = entries.filter((e) => e.source === "extract").length;

  return (
    <QueueContext.Provider
      value={{
        entries,
        suggestCount,
        extractCount,
        totalCount: entries.length,
        addSuggestion: (entry) =>
          setEntries((prev) => [
            { ...entry, source: "suggest", timestamp: new Date().toISOString() },
            ...prev,
          ]),
        addExtractions: (items) =>
          setEntries((prev) => [
            ...items.map((e) => ({
              ...e,
              source: "extract" as const,
              timestamp: new Date().toISOString(),
            })),
            ...prev,
          ]),
      }}
    >
      {children}
    </QueueContext.Provider>
  );
}

export function useQueue() {
  return useContext(QueueContext);
}
