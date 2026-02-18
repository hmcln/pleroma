"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import type { Outline } from "@/lib/outline-schema";

type LessonRow = {
  id: string;
  idx: number;
  lessonId: string;
  title: string;
  status: string;
  error: string | null;
};

type SyllabusData = {
  slug: string;
  title: string;
  brief: string;
  level: string;
  constraints: string | null;
  outlineJson: Outline;
  status: string;
  lessons: LessonRow[];
};

export default function SyllabusView({ initial }: { initial: SyllabusData }) {
  const [data, setData] = useState<SyllabusData>(initial);
  const [generatingIdx, setGeneratingIdx] = useState<Set<number>>(new Set());
  const [generatingNext, setGeneratingNext] = useState(false);

  const outline = data.outlineJson;
  const readyCount = data.lessons.filter((l) => l.status === "ready").length;
  const totalCount = data.lessons.length;

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/syllabus/${data.slug}`);
    if (res.ok) {
      setData(await res.json());
    }
  }, [data.slug]);

  async function generateLesson(idx: number) {
    setGeneratingIdx((prev) => new Set(prev).add(idx));
    try {
      await fetch(`/api/syllabus/${data.slug}/lessons/${idx}/generate`, {
        method: "POST",
      });
      await refresh();
    } finally {
      setGeneratingIdx((prev) => {
        const next = new Set(prev);
        next.delete(idx);
        return next;
      });
    }
  }

  async function generateNext() {
    setGeneratingNext(true);
    try {
      await fetch(`/api/syllabus/${data.slug}/generate-next`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 1 }),
      });
      await refresh();
    } finally {
      setGeneratingNext(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">{outline.title}</h1>
      <p className="text-zinc-500 dark:text-zinc-400 mb-4">{outline.description}</p>

      <div className="flex flex-wrap gap-4 text-sm text-zinc-600 dark:text-zinc-400 mb-6">
        <span>
          <strong>Audience:</strong> {outline.audience}
        </span>
        <span>
          <strong>Level:</strong> {data.level}
        </span>
        <span>
          <strong>Progress:</strong> {readyCount}/{totalCount} lessons
        </span>
      </div>

      {outline.prerequisites.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold mb-1">Prerequisites</h3>
          <ul className="list-disc list-inside text-sm text-zinc-600 dark:text-zinc-400">
            {outline.prerequisites.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      {outline.assumptions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-1">Assumptions</h3>
          <ul className="list-disc list-inside text-sm text-zinc-600 dark:text-zinc-400">
            {outline.assumptions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold">Lessons</h2>
        {readyCount < totalCount && (
          <button
            onClick={generateNext}
            disabled={generatingNext}
            className="rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-3 py-1 text-xs font-medium hover:opacity-90 disabled:opacity-50"
          >
            {generatingNext ? "Generating…" : "Generate next lesson"}
          </button>
        )}
      </div>

      <ol className="space-y-2">
        {data.lessons.map((les) => (
          <li
            key={les.id}
            className="flex items-center justify-between rounded-md border border-zinc-200 dark:border-zinc-800 px-4 py-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xs font-mono text-zinc-400">{les.lessonId}</span>
              <span className="text-sm truncate">{les.title}</span>
              <StatusBadge status={les.status} />
            </div>
            <div className="flex-shrink-0 ml-3">
              {les.status === "ready" ? (
                <Link
                  href={`/s/${data.slug}/${les.lessonId}`}
                  className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Open
                </Link>
              ) : les.status === "pending" || les.status === "error" ? (
                <button
                  onClick={() => generateLesson(les.idx)}
                  disabled={generatingIdx.has(les.idx)}
                  className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-50"
                >
                  {generatingIdx.has(les.idx) ? "Generating…" : "Generate"}
                </button>
              ) : les.status === "generating" ? (
                <span className="text-xs text-yellow-600">Generating…</span>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    generating: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    ready: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    error: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  };

  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${colors[status] ?? colors.pending}`}>
      {status}
    </span>
  );
}
