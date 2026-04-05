import type { TopicMeta, QuizQuestion } from "./types";
import { QUESTION_POOL } from "./questionPool";

export type GradedQuestion = Omit<QuizQuestion, "tags" | "domain">;

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic 10-question set per domain + topic (tag-matched first, then domain pool). */
export function pickQuizForTopic(
  domainId: string,
  topic: TopicMeta,
  n: number,
): GradedQuestion[] {
  const pool = QUESTION_POOL.filter((q) => q.domain === domainId);
  const tagged = pool.filter((q) =>
    topic.tags.some((t) => q.tags.includes(t)),
  );
  const source = tagged.length >= n ? tagged : pool;
  const seed = hash(`${domainId}/${topic.id}`);
  const scored = source.map((q, i) => ({
    q,
    s: hash(q.question + String(seed) + String(i)),
  }));
  scored.sort((a, b) => a.s - b.s);

  const out: GradedQuestion[] = [];
  const seen = new Set<string>();
  for (const { q } of scored) {
    if (seen.has(q.question)) continue;
    seen.add(q.question);
    out.push({
      question: q.question,
      options: q.options,
      answer: q.answer,
      concept: q.concept,
      explanation: q.explanation,
    });
    if (out.length >= n) break;
  }

  let i = 0;
  while (out.length < n && i < pool.length) {
    const q = pool[i++];
    if (seen.has(q.question)) continue;
    seen.add(q.question);
    out.push({
      question: q.question,
      options: q.options,
      answer: q.answer,
      concept: q.concept,
      explanation: q.explanation,
    });
  }

  return out.slice(0, n);
}

export const QUIZ_LENGTH = 10;
export const QUIZ_TIME_SECONDS = 600; // 10 minutes for 10 MCQs

export function gfgSearchUrl(query: string): string {
  return `https://www.geeksforgeeks.org/search/?q=${encodeURIComponent(query)}`;
}

export function youtubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}
