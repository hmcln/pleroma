import { NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { syllabus, lesson } from "@/db/schema";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const syllabusRows = await db
    .select()
    .from(syllabus)
    .where(eq(syllabus.slug, slug))
    .limit(1);

  if (!syllabusRows.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const syl = syllabusRows[0];

  const lessons = await db
    .select()
    .from(lesson)
    .where(eq(lesson.syllabusId, syl.id))
    .orderBy(asc(lesson.idx));

  return NextResponse.json({
    ...syl,
    lessons,
  });
}
