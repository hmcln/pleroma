"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateSyllabusForm() {
  const router = useRouter();
  const [brief, setBrief] = useState("");
  const [level, setLevel] = useState("beginner");
  const [constraints, setConstraints] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/syllabus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief, level, constraints: constraints || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create syllabus");
      }

      const { slug } = await res.json();
      router.push(`/s/${slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
      <div>
        <label htmlFor="brief" className="block text-sm font-medium mb-1 text-strong">
          Project / Syllabus Brief
        </label>
        <textarea
          id="brief"
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          required
          rows={4}
          placeholder="e.g. Build a CLI todo app in Rust from scratch"
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-link"
        />
      </div>

      <div>
        <label htmlFor="level" className="block text-sm font-medium mb-1 text-strong">
          Learner Level
        </label>
        <select
          id="level"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-link"
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      <div>
        <label htmlFor="constraints" className="block text-sm font-medium mb-1 text-strong">
          Constraints (optional)
        </label>
        <textarea
          id="constraints"
          value={constraints}
          onChange={(e) => setConstraints(e.target.value)}
          rows={2}
          placeholder="e.g. Must use only the standard library, target macOS"
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-link"
        />
      </div>

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !brief.trim()}
        className="rounded-md bg-link text-background px-5 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Generating outline…" : "Generate Outline"}
      </button>
    </form>
  );
}
