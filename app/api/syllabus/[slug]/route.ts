import { NextResponse } from "next/server";
import { eq, asc, and } from "drizzle-orm";
import { db } from "@/db";
import { syllabus, lesson } from "@/db/schema";
import { auth } from "@/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  const syllabusRows = await db
    .select()
    .from(syllabus)
    .where(and(eq(syllabus.slug, slug), eq(syllabus.userId, session.user.id)))
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
