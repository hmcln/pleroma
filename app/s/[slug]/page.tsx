import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { syllabus, lesson } from "@/db/schema";
import { asc } from "drizzle-orm";
import SyllabusView from "@/components/syllabus-view";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SyllabusPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const syllabusRows = await db
    .select()
    .from(syllabus)
    .where(eq(syllabus.slug, slug))
    .limit(1);

  if (!syllabusRows.length) {
    notFound();
  }

  const syl = syllabusRows[0];

  const lessons = await db
    .select()
    .from(lesson)
    .where(eq(lesson.syllabusId, syl.id))
    .orderBy(asc(lesson.idx));

  const data = {
    ...syl,
    slug: syl.slug,
    title: syl.title,
    brief: syl.brief,
    level: syl.level,
    constraints: syl.constraints,
    outlineJson: syl.outlineJson as import("@/lib/outline-schema").Outline,
    status: syl.status,
    lessons: lessons.map((l) => ({
      id: l.id,
      idx: l.idx,
      lessonId: l.lessonId,
      title: l.title,
      status: l.status,
      error: l.error,
    })),
  };

  return (
    <main className="min-h-screen px-6 py-12 max-w-3xl mx-auto">
      <Link href="/" className="text-sm text-muted hover:text-foreground mb-6 inline-block">
        ← Dashboard
      </Link>
      <SyllabusView initial={data} />
    </main>
  );
}
