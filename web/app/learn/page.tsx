"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock,
  ExternalLink,
  GraduationCap,
  Layers,
  PlayCircle,
  ScrollText,
  Sparkles,
  Target,
  Timer,
  Trash2,
  Trophy,
  Youtube,
} from "lucide-react";
import Button from "@/components/ui/Button";
import {
  LEARNING_DOMAINS,
  pickQuizForTopic,
  QUIZ_LENGTH,
  QUIZ_TIME_SECONDS,
  gfgSearchUrl,
  youtubeSearchUrl,
  type GradedQuestion,
  type LearningDomain,
  type TopicMeta,
} from "@/lib/personalizedLearning";
import {
  appendLearnReport,
  deleteLearnReport,
  loadLearnReports,
  type SavedLearnReport,
} from "@/lib/personalizedLearning/reportStorage";

type Phase = "domains" | "topics" | "study" | "quiz" | "results";

function formatMmSs(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function PersonalizedLearningPage() {
  const [phase, setPhase] = useState<Phase>("domains");
  const [domain, setDomain] = useState<LearningDomain>(LEARNING_DOMAINS[0]);
  const [topic, setTopic] = useState<TopicMeta>(LEARNING_DOMAINS[0].topics[0]);
  const [quiz, setQuiz] = useState<GradedQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [secondsLeft, setSecondsLeft] = useState(QUIZ_TIME_SECONDS);
  const [quizActive, setQuizActive] = useState(false);
  const [finishedEarly, setFinishedEarly] = useState(false);
  const finishOnceRef = useRef(false);
  const finishNonceRef = useRef(0);
  const savedFinishNonceRef = useRef<number | null>(null);
  const [savedReports, setSavedReports] = useState<SavedLearnReport[]>([]);

  useEffect(() => {
    setSavedReports(loadLearnReports());
  }, []);

  const selectDomain = (d: LearningDomain) => {
    setDomain(d);
    setTopic(d.topics[0]);
    setPhase("topics");
    resetQuizState();
  };

  const selectTopic = (t: TopicMeta) => {
    setTopic(t);
    setPhase("study");
    resetQuizState();
  };

  function resetQuizState() {
    setQuiz([]);
    setQIndex(0);
    setAnswers({});
    setSecondsLeft(QUIZ_TIME_SECONDS);
    setQuizActive(false);
    setFinishedEarly(false);
    finishOnceRef.current = false;
  }

  const startQuiz = useCallback(() => {
    finishOnceRef.current = false;
    const picked = pickQuizForTopic(domain.id, topic, QUIZ_LENGTH);
    setQuiz(picked);
    setQIndex(0);
    setAnswers({});
    setSecondsLeft(QUIZ_TIME_SECONDS);
    setQuizActive(true);
    setFinishedEarly(false);
    setPhase("quiz");
  }, [domain.id, topic]);

  const finishQuiz = useCallback((early: boolean) => {
    if (finishOnceRef.current) return;
    finishOnceRef.current = true;
    finishNonceRef.current += 1;
    setQuizActive(false);
    setFinishedEarly(early);
    setPhase("results");
  }, []);

  useEffect(() => {
    if (!quizActive || phase !== "quiz") return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          queueMicrotask(() => finishQuiz(false));
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [quizActive, phase, finishQuiz]);

  const scoreData = useMemo(() => {
    const mistakes: Array<{
      question: string;
      concept: string;
      explanation: string;
      picked?: number;
    }> = [];
    const strengths: string[] = [];
    let score = 0;
    quiz.forEach((q, index) => {
      const marked = answers[index];
      if (marked === undefined) {
        mistakes.push({
          question: q.question,
          concept: q.concept,
          explanation: q.explanation,
        });
        return;
      }
      if (marked === q.answer) {
        score += 1;
        strengths.push(q.concept);
      } else {
        mistakes.push({
          question: q.question,
          concept: q.concept,
          explanation: q.explanation,
          picked: marked,
        });
      }
    });
    const weakConcepts = [...new Set(mistakes.map((m) => m.concept))];
    return {
      score,
      total: quiz.length,
      percentage: quiz.length ? Math.round((score / quiz.length) * 100) : 0,
      strengths: [...new Set(strengths)],
      mistakes,
      weakConcepts,
    };
  }, [quiz, answers]);

  useEffect(() => {
    if (phase !== "results" || quiz.length === 0) return;
    const n = finishNonceRef.current;
    if (savedFinishNonceRef.current === n) return;
    savedFinishNonceRef.current = n;
    appendLearnReport({
      domainId: domain.id,
      domainTitle: domain.title,
      topicId: topic.id,
      topicTitle: topic.title,
      score: scoreData.score,
      total: scoreData.total,
      percentage: scoreData.percentage,
      finishedEarly,
      strengths: scoreData.strengths,
      weakConcepts: scoreData.weakConcepts,
      mistakes: scoreData.mistakes.map((m) => ({
        question: m.question,
        concept: m.concept,
        explanation: m.explanation,
        picked: m.picked,
      })),
    });
    setSavedReports(loadLearnReports());
  }, [
    phase,
    quiz.length,
    domain.id,
    domain.title,
    topic.id,
    topic.title,
    finishedEarly,
    scoreData.score,
    scoreData.total,
    scoreData.percentage,
    scoreData.strengths,
    scoreData.weakConcepts,
    scoreData.mistakes,
  ]);

  const currentQuestion = quiz[qIndex];
  const attemptedCount = Object.keys(answers).length;

  return (
    <div className="min-h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-100 via-fuchsia-50 to-amber-50 pb-16 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Decorative blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-40 dark:opacity-20">
        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-fuchsia-400 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-cyan-400 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-amber-400 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        {/* Header */}
        <header className="overflow-hidden rounded-3xl border border-white/50 bg-white/70 shadow-xl backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-900/80">
          <div
            className={`bg-gradient-to-r px-6 py-8 text-white sm:px-10 ${domain.gradient}`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-white/90">
                  <Sparkles className="h-4 w-4" />
                  Personalized learning path
                </p>
                <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                  Learn by domain · Timed checks · Your report card
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-white/90 sm:text-base">
                  Five domains, ten structured topics each, ten MCQs per topic,{" "}
                  {QUIZ_TIME_SECONDS / 60}-minute timer, and fixes that point you to GeeksforGeeks
                  + YouTube when you miss a concept.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur">
                  {QUIZ_LENGTH} MCQs / topic
                </span>
                <span className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur">
                  <Timer className="mr-1 inline h-4 w-4" />
                  {QUIZ_TIME_SECONDS / 60} min quiz
                </span>
              </div>
            </div>
          </div>
          {/* Stepper */}
          <nav className="flex flex-wrap gap-2 border-t border-slate-200/80 bg-white/50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/50 sm:px-6">
            {(
              [
                ["domains", "1. Domain"],
                ["topics", "2. Topic"],
                ["study", "3. Study"],
                ["quiz", "4. Quiz"],
                ["results", "5. Report"],
              ] as const
            ).map(([key, label]) => {
              const order = [
                "domains",
                "topics",
                "study",
                "quiz",
                "results",
              ] as const;
              const activeIdx = order.indexOf(phase);
              const stepIdx = order.indexOf(key);
              const done = stepIdx < activeIdx;
              const active = phase === key;
              return (
                <span
                  key={key}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold sm:text-sm ${
                    active
                      ? "bg-slate-900 text-white shadow-md dark:bg-white dark:text-slate-900"
                      : done
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {label}
                </span>
              );
            })}
          </nav>
        </header>

        {savedReports.length > 0 && phase === "domains" && (
          <section className="rounded-3xl border border-violet-200/80 bg-white/90 p-5 shadow-lg backdrop-blur-md dark:border-violet-900/50 dark:bg-slate-900/90">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
              <ScrollText className="h-5 w-5 text-violet-600" />
              <h2 className="text-lg font-bold">Saved report cards</h2>
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-800 dark:bg-violet-950 dark:text-violet-200">
                {savedReports.length}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Stored on this device after each quiz. Remove any you don&apos;t need.
            </p>
            <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
              {savedReports.slice(0, 15).map((r) => (
                <li
                  key={r.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-2 dark:border-slate-600 dark:bg-slate-800/80"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900 dark:text-white">
                      {r.topicTitle}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {r.domainTitle} ·{" "}
                      {new Date(r.savedAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                    <p className="mt-1 text-sm font-bold text-fuchsia-700 dark:text-fuchsia-300">
                      {r.percentage}% ({r.score}/{r.total})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      deleteLearnReport(r.id);
                      setSavedReports(loadLearnReports());
                    }}
                    className="flex-shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-950/50 dark:hover:text-rose-300"
                    aria-label="Delete saved report"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Domain grid */}
        {phase === "domains" && (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {LEARNING_DOMAINS.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => selectDomain(d)}
                className="group relative overflow-hidden rounded-2xl border-2 border-white/80 bg-white/90 p-6 text-left shadow-lg transition hover:-translate-y-1 hover:shadow-2xl dark:border-slate-600 dark:bg-slate-900/90"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br opacity-0 transition group-hover:opacity-10 ${d.gradient}`}
                />
                <span className="text-4xl">{d.emoji}</span>
                <h2 className="mt-3 text-xl font-bold text-slate-900 dark:text-white">
                  {d.title}
                </h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {d.description}
                </p>
                <p className="mt-4 text-xs font-bold uppercase tracking-wide text-fuchsia-600 dark:text-fuchsia-400">
                  10 topics · Click to explore →
                </p>
              </button>
            ))}
          </section>
        )}

        {/* Topic grid */}
        {phase === "topics" && (
          <section className="space-y-4">
            <button
              type="button"
              onClick={() => {
                setPhase("domains");
                resetQuizState();
              }}
              className="text-sm font-semibold text-fuchsia-700 hover:underline dark:text-fuchsia-300"
            >
              ← All domains
            </button>
            <div
              className={`rounded-2xl border border-white/60 bg-gradient-to-r p-6 text-white shadow-lg ${domain.gradient}`}
            >
              <h2 className="text-2xl font-black">{domain.title}</h2>
              <p className="mt-1 text-sm text-white/90">
                Pick one of 10 topics — each has study notes, curated links, and a timed quiz.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {domain.topics.map((t, i) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => selectTopic(t)}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white/95 p-4 text-left shadow-md transition hover:border-fuchsia-400 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900/95 dark:hover:border-fuchsia-500"
                >
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-violet-600 text-sm font-black text-white">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      {t.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      {t.summary}
                    </p>
                    <span className="mt-2 inline-block rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
                      {t.level} · {t.duration}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Study */}
        {phase === "study" && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setPhase("topics")}
                className="text-sm font-semibold text-fuchsia-700 dark:text-fuchsia-300"
              >
                ← Topics
              </button>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold text-white ${domain.gradient} bg-gradient-to-r`}
              >
                {domain.title}
              </span>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                <div className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-lg dark:border-slate-700 dark:bg-slate-900/95">
                  <h3 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white">
                    <Layers className="h-7 w-7 text-violet-500" />
                    {topic.title}
                  </h3>
                  <p className="mt-2 text-slate-600 dark:text-slate-300">
                    {topic.summary}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {topic.studyPoints.map((pt) => (
                      <li
                        key={pt}
                        className="flex gap-2 rounded-lg border border-violet-100 bg-violet-50/80 px-3 py-2 text-sm dark:border-violet-900/50 dark:bg-violet-950/40"
                      >
                        <Target className="mt-0.5 h-4 w-4 flex-shrink-0 text-fuchsia-600" />
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <aside className="space-y-4">
                <div className="rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white p-5 shadow-md dark:border-emerald-800 dark:from-emerald-950/50 dark:to-slate-900">
                  <p className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-200">
                    <BookOpen className="h-5 w-5" />
                    GeeksforGeeks
                  </p>
                  <ul className="mt-3 space-y-2">
                    {topic.geeksForGeeks.map((l) => (
                      <li key={l.href}>
                        <a
                          href={l.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm font-medium text-emerald-700 underline decoration-emerald-300 hover:text-emerald-900 dark:text-emerald-300"
                        >
                          {l.label}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-red-200 bg-gradient-to-b from-red-50 to-white p-5 shadow-md dark:border-red-900 dark:from-red-950/40 dark:to-slate-900">
                  <p className="flex items-center gap-2 font-bold text-red-800 dark:text-red-200">
                    <Youtube className="h-5 w-5" />
                    YouTube picks
                  </p>
                  <ul className="mt-3 space-y-2">
                    {topic.youtube.map((l) => (
                      <li key={l.href}>
                        <a
                          href={l.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm font-medium text-red-700 hover:underline dark:text-red-300"
                        >
                          <PlayCircle className="h-4 w-4 flex-shrink-0" />
                          {l.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                <Button
                  className="w-full !bg-gradient-to-r !from-fuchsia-600 !to-violet-600 !text-white shadow-lg"
                  icon={<Brain className="h-4 w-4" />}
                  onClick={startQuiz}
                >
                  Start timed quiz ({QUIZ_LENGTH} Q, {QUIZ_TIME_SECONDS / 60} min)
                </Button>
              </aside>
            </div>
          </section>
        )}

        {/* Quiz */}
        {phase === "quiz" && quiz.length > 0 && currentQuestion && (
          <section className="mx-auto max-w-3xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-100 via-orange-100 to-rose-100 px-4 py-3 shadow-lg dark:border-amber-700 dark:from-amber-950/80 dark:via-orange-950/60 dark:to-rose-950/60">
              <div className="flex items-center gap-2 font-black text-slate-900 dark:text-white">
                <Clock
                  className={`h-6 w-6 ${secondsLeft <= 60 ? "animate-pulse text-red-600" : "text-amber-600"}`}
                />
                {formatMmSs(secondsLeft)}
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  left
                </span>
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Question {qIndex + 1} / {quiz.length} · Answered {attemptedCount}
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => finishQuiz(true)}
              >
                Submit now
              </Button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900/95">
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {currentQuestion.question}
              </p>
              <div className="mt-4 space-y-2">
                {currentQuestion.options.map((opt, i) => {
                  const selected = answers[qIndex] === i;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() =>
                        setAnswers((prev) => ({ ...prev, [qIndex]: i }))
                      }
                      className={`w-full rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition ${
                        selected
                          ? "border-fuchsia-500 bg-fuchsia-50 text-fuchsia-900 dark:bg-fuchsia-950/50 dark:text-fuchsia-100"
                          : "border-slate-200 hover:border-fuchsia-300 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span className="mr-2 font-mono text-fuchsia-600">
                        {String.fromCharCode(65 + i)}.
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-between gap-2">
                <Button
                  variant="secondary"
                  disabled={qIndex === 0}
                  icon={<ChevronLeft className="h-4 w-4" />}
                  onClick={() => setQIndex((i) => Math.max(0, i - 1))}
                >
                  Back
                </Button>
                {qIndex < quiz.length - 1 ? (
                  <Button
                    icon={<ChevronRight className="h-4 w-4" />}
                    onClick={() => setQIndex((i) => i + 1)}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    icon={<Trophy className="h-4 w-4" />}
                    onClick={() => finishQuiz(true)}
                  >
                    Finish & see report
                  </Button>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-1">
                {quiz.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setQIndex(i)}
                    className={`h-8 w-8 rounded-lg text-xs font-bold ${
                      i === qIndex
                        ? "bg-fuchsia-600 text-white"
                        : answers[i] !== undefined
                          ? "bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100"
                          : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Results */}
        {phase === "results" && quiz.length > 0 && (
          <section className="space-y-6">
            <button
              type="button"
              onClick={() => {
                setPhase("study");
                resetQuizState();
              }}
              className="text-sm font-semibold text-fuchsia-700 dark:text-fuchsia-300"
            >
              ← Back to study & retry
            </button>

            <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/90 shadow-2xl dark:border-slate-700 dark:bg-slate-900/90">
              <div
                className={`bg-gradient-to-r px-6 py-8 text-white sm:px-10 ${domain.gradient}`}
              >
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white/90">
                      Report card
                    </p>
                    <h2 className="text-3xl font-black">{topic.title}</h2>
                    <p className="text-white/90">{domain.title}</p>
                    <p className="mt-1 text-xs text-white/80">
                      {finishedEarly
                        ? "You submitted before the timer expired."
                        : "Timer ended — unanswered questions count as incomplete."}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-white/90">
                      Report card saved on this device — see &quot;Saved report
                      cards&quot; from domains.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/20 px-6 py-4 text-center backdrop-blur">
                    <p className="text-4xl font-black">{scoreData.percentage}%</p>
                    <p className="text-sm">
                      {scoreData.score}/{scoreData.total} correct
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-6 sm:grid-cols-2">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
                  <p className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-200">
                    <CheckCircle2 className="h-5 w-5" />
                    Strengths
                  </p>
                  <ul className="mt-2 list-inside list-disc text-sm text-emerald-900 dark:text-emerald-100">
                    {scoreData.strengths.length
                      ? scoreData.strengths.map((s) => <li key={s}>{s}</li>)
                      : "—"}
                  </ul>
                </div>
                <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 dark:border-rose-900 dark:bg-rose-950/30">
                  <p className="flex items-center gap-2 font-bold text-rose-800 dark:text-rose-200">
                    <CircleAlert className="h-5 w-5" />
                    Needs work
                  </p>
                  <ul className="mt-2 list-inside list-disc text-sm text-rose-900 dark:text-rose-100">
                    {scoreData.weakConcepts.length
                      ? scoreData.weakConcepts.map((s) => <li key={s}>{s}</li>)
                      : "Great — no missed concepts."}
                  </ul>
                </div>
              </div>

              <div className="border-t border-slate-200 px-6 py-6 dark:border-slate-700">
                <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                  <GraduationCap className="h-5 w-5 text-violet-500" />
                  Where you went wrong — personalized links
                </h3>
                {scoreData.mistakes.length === 0 ? (
                  <p className="mt-2 text-slate-600 dark:text-slate-400">
                    Perfect run on recorded answers.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-4">
                    {scoreData.mistakes.map((m, idx) => (
                      <li
                        key={idx}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-800/80"
                      >
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {m.question}
                        </p>
                        <p className="text-xs text-fuchsia-700 dark:text-fuchsia-300">
                          Concept: {m.concept}
                        </p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                          {m.explanation}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <a
                            href={gfgSearchUrl(`${m.concept} ${topic.title}`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                          >
                            GeeksforGeeks: {m.concept}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          <a
                            href={youtubeSearchUrl(
                              `${m.concept} ${topic.title} tutorial`,
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
                          >
                            YouTube: {m.concept}
                            <Youtube className="h-3 w-3" />
                          </a>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex flex-wrap gap-3 border-t border-slate-200 bg-slate-50/80 px-6 py-4 dark:border-slate-700 dark:bg-slate-800/50">
                <Button onClick={startQuiz}>Retake quiz</Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setPhase("topics");
                    resetQuizState();
                  }}
                >
                  Another topic
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setPhase("domains");
                    resetQuizState();
                  }}
                >
                  All domains
                </Button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
