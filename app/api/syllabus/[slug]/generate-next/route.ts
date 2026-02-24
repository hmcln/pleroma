import { NextResponse } from "next/server";
import { generateText } from "ai";
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/db";
import { syllabus, lesson } from "@/db/schema";
import { openai } from "@/lib/ai";
import type { Outline } from "@/lib/outline-schema";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const body = await req.json().catch(() => ({}));
    const count = Math.min(body.count ?? 1, 5);

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

    const pendingLessons = await db
      .select()
      .from(lesson)
      .where(and(eq(lesson.syllabusId, syl.id), eq(lesson.status, "pending")))
      .orderBy(asc(lesson.idx))
      .limit(count);

    if (!pendingLessons.length) {
      return NextResponse.json({ generated: [], message: "No pending lessons" });
    }

    const allLessons = await db
      .select({ idx: lesson.idx, title: lesson.title })
      .from(lesson)
      .where(eq(lesson.syllabusId, syl.id))
      .orderBy(asc(lesson.idx));

    await db
      .update(syllabus)
      .set({ status: "generating" })
      .where(eq(syllabus.id, syl.id));

    const generated: string[] = [];

    for (const les of pendingLessons) {
      try {
        await db
          .update(lesson)
          .set({ status: "generating" })
          .where(eq(lesson.id, les.id));

        const outlineLesson = outline.lessons[les.idx];
        const goals = outlineLesson?.goals ?? [];
        const deliverable = outlineLesson?.deliverable ?? "";

        const prevContext = allLessons
          .filter((l) => l.idx < les.idx)
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

Now write Lesson ${les.idx + 1}: "${les.title}"

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

        generated.push(les.lessonId);
      } catch (error) {
        await db
          .update(lesson)
          .set({
            status: "error",
            error: error instanceof Error ? error.message : "Unknown error",
          })
          .where(eq(lesson.id, les.id));
      }
    }

    // Check if all done
    const remaining = await db
      .select({ id: lesson.id })
      .from(lesson)
      .where(
        and(eq(lesson.syllabusId, syl.id), eq(lesson.status, "pending"))
      );

    await db
      .update(syllabus)
      .set({ status: remaining.length === 0 ? "complete" : "outlined" })
      .where(eq(syllabus.id, syl.id));

    return NextResponse.json({ generated });
  } catch (error) {
    console.error("Error generating next lessons:", error);
    return NextResponse.json(
      { error: "Failed to generate lessons" },
      { status: 500 }
    );
  }
}
