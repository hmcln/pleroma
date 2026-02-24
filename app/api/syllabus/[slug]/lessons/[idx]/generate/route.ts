import { NextResponse } from "next/server";
import { generateText } from "ai";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { syllabus, lesson } from "@/db/schema";
import { openai } from "@/lib/ai";
import type { Outline } from "@/lib/outline-schema";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string; idx: string }> }
) {
  const { slug, idx: idxStr } = await params;
  const idx = parseInt(idxStr, 10);

  try {
    const syllabusRows = await db
      .select()
      .from(syllabus)
      .where(eq(syllabus.slug, slug))
      .limit(1);

    if (!syllabusRows.length) {
      return NextResponse.json({ error: "Syllabus not found" }, { status: 404 });
    }

    const syl = syllabusRows[0];
    const outline = syl.outlineJson as Outline;

    const lessonRows = await db
      .select()
      .from(lesson)
      .where(and(eq(lesson.syllabusId, syl.id), eq(lesson.idx, idx)))
      .limit(1);

    if (!lessonRows.length) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const les = lessonRows[0];

    if (les.status === "ready") {
      return NextResponse.json({ status: "already_ready" });
    }

    await db
      .update(lesson)
      .set({ status: "generating" })
      .where(eq(lesson.id, les.id));

    const outlineLesson = outline.lessons[idx];
    const goals = outlineLesson?.goals ?? [];
    const deliverable = outlineLesson?.deliverable ?? "";

    // Get previous lessons for context
    const prevLessons = await db
      .select({ idx: lesson.idx, title: lesson.title })
      .from(lesson)
      .where(and(eq(lesson.syllabusId, syl.id)))
      .orderBy(lesson.idx);

    const prevContext = prevLessons
      .filter((l) => l.idx < idx)
      .map((l) => `- Lesson ${l.idx + 1}: ${l.title}`)
      .join("\n");

    const { text: contentMd } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: `You are an expert technical instructor writing a lesson for a syllabus.

Syllabus: ${outline.title}
Description: ${outline.description}
Audience: ${outline.audience} (${syl.level} level)
${syl.constraints ? `Constraints: ${syl.constraints}` : ""}

${prevContext ? `Previous lessons covered:\n${prevContext}\n` : ""}

Now write Lesson ${idx + 1}: "${les.title}"

Learning goals:
${goals.map((g) => `- ${g}`).join("\n")}

Expected deliverable: ${deliverable}

Format the lesson in Markdown with these sections in order:
# ${les.title}
## Objectives
- List the learning objectives
## Concepts
Explain concepts clearly, no big jumps.
## Steps
Numbered steps with commands and code blocks where relevant.
## Checkpoint
What should work now? How to verify?
## Exercises
3–6 exercises increasing difficulty.
## Common Pitfalls
Bullet list.

Rules:
- Keep it textbook-like but practical.
- 800–1800 words.
- Steps should be runnable; include terminal commands.
- Include code snippets fenced with correct language tags.
- Do NOT include raw HTML.
- Make code idiomatic for the relevant language/tools.`,
    });

    await db
      .update(lesson)
      .set({ contentMd, status: "ready", error: null })
      .where(eq(lesson.id, les.id));

    // Check if all lessons are ready
    const pendingCount = await db
      .select({ id: lesson.id })
      .from(lesson)
      .where(
        and(
          eq(lesson.syllabusId, syl.id),
          eq(lesson.status, "pending")
        )
      );

    if (pendingCount.length === 0) {
      await db
        .update(syllabus)
        .set({ status: "complete" })
        .where(eq(syllabus.id, syl.id));
    } else {
      await db
        .update(syllabus)
        .set({ status: "generating" })
        .where(eq(syllabus.id, syl.id));
    }

    return NextResponse.json({ status: "ready", lessonId: les.lessonId });
  } catch (error) {
    console.error("Error generating lesson:", error);

    // Try to mark lesson as error
    try {
      const syllabusRows = await db
        .select()
        .from(syllabus)
        .where(eq(syllabus.slug, slug))
        .limit(1);
      if (syllabusRows.length) {
        await db
          .update(lesson)
          .set({
            status: "error",
            error: error instanceof Error ? error.message : "Unknown error",
          })
          .where(
            and(
              eq(lesson.syllabusId, syllabusRows[0].id),
              eq(lesson.idx, idx)
            )
          );
      }
    } catch {
      // ignore cleanup errors
    }

    return NextResponse.json(
      { error: "Failed to generate lesson" },
      { status: 500 }
    );
  }
}
