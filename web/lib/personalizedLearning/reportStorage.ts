export type SavedLearnReportMistake = {
  question: string;
  concept: string;
  explanation: string;
  picked?: number;
};

export type SavedLearnReport = {
  id: string;
  savedAt: string;
  domainId: string;
  domainTitle: string;
  topicId: string;
  topicTitle: string;
  score: number;
  total: number;
  percentage: number;
  finishedEarly: boolean;
  strengths: string[];
  weakConcepts: string[];
  mistakes: SavedLearnReportMistake[];
};

const STORAGE_KEY = "deeptutor-personalized-learning-reports";
const MAX_REPORTS = 40;

function safeParse(raw: string | null): SavedLearnReport[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? (v as SavedLearnReport[]) : [];
  } catch {
    return [];
  }
}

export function loadLearnReports(): SavedLearnReport[] {
  if (typeof window === "undefined") return [];
  return safeParse(localStorage.getItem(STORAGE_KEY));
}

export function appendLearnReport(
  partial: Omit<SavedLearnReport, "id" | "savedAt">,
): SavedLearnReport {
  const entry: SavedLearnReport = {
    ...partial,
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `r-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    savedAt: new Date().toISOString(),
  };
  if (typeof window === "undefined") return entry;
  const prev = loadLearnReports();
  const next = [entry, ...prev].slice(0, MAX_REPORTS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return entry;
}

export function deleteLearnReport(id: string): void {
  if (typeof window === "undefined") return;
  const next = loadLearnReports().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
