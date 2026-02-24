import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { syllabus, lesson } from "@/db/schema";
import LessonContent from "@/components/lesson-content";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
}) {
  const { slug, lessonId } = await params;

  const syllabusRows = await db
    .select()
    .from(syllabus)
    .where(eq(syllabus.slug, slug))
    .limit(1);

  if (!syllabusRows.length) {
    notFound();
  }

  const syl = syllabusRows[0];

  const lessonRows = await db
    .select()
    .from(lesson)
    .where(and(eq(lesson.syllabusId, syl.id), eq(lesson.lessonId, lessonId)))
    .limit(1);

  if (!lessonRows.length) {
    notFound();
  }

  const les = lessonRows[0];

  if (!les.contentMd) {
    return (
      <main className="min-h-screen px-6 py-12 max-w-3xl mx-auto">
        <Link
          href={`/s/${slug}`}
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 mb-6 inline-block"
        >
          ← Back to syllabus
        </Link>
        <h1 className="text-2xl font-bold mb-4">{les.title}</h1>
        <p className="text-zinc-500">
          This lesson hasn&apos;t been generated yet. Go back and click
          &quot;Generate&quot; to create it.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-12 max-w-3xl mx-auto">
      <Link
        href={`/s/${slug}`}
        className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 mb-6 inline-block"
      >
        ← Back to syllabus
      </Link>
      <LessonContent markdown={les.contentMd} />
    </main>
  );
}
