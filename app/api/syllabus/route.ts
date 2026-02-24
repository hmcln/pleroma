import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { db } from "@/db";
import { syllabus, lesson } from "@/db/schema";
import { openai } from "@/lib/ai";
import { outlineSchema } from "@/lib/outline-schema";
import { makeSlug } from "@/lib/slug";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { brief, level, constraints } = body as {
      brief: string;
      level: string;
      constraints?: string;
    };

    if (!brief || !level) {
      return NextResponse.json(
        { error: "brief and level are required" },
        { status: 400 }
      );
    }

    const { object: outline } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: outlineSchema,
      prompt: `You are an expert curriculum designer. Create a detailed syllabus outline for the following:

Brief: ${brief}
Learner level: ${level}
${constraints ? `Constraints: ${constraints}` : ""}

Rules:
- Generate 10–25 lessons (target around 14 if unsure).
- lessonId must be zero-padded ascending ("01", "02", ...).
- Titles should be short and practical.
- Goals should be concrete and testable.
- Deliverable should be a tangible output (a file, a runnable command, a passing test, etc).
- The title should describe the overall syllabus/project, not just repeat the brief.
- Description should be 1-2 sentences summarizing what the learner will build/learn.
- Prerequisites are things the learner should already know.
- Assumptions are things about the learner's environment (OS, tools installed, etc).`,
    });

    const slug = makeSlug(outline.title);

    await db.insert(syllabus).values({
      slug,
      title: outline.title,
      brief,
      level,
      constraints: constraints || null,
      outlineJson: outline,
      status: "outlined",
      userId: session.user.id,
    });

    const syllabusRows = await db
      .select()
      .from(syllabus)
      .where(
        (await import("drizzle-orm")).eq(syllabus.slug, slug)
      )
      .limit(1);

    const syllabusRow = syllabusRows[0];

    const lessonValues = outline.lessons.map((l, i) => ({
      syllabusId: syllabusRow.id,
      idx: i,
      lessonId: l.lessonId,
      title: l.title,
      goalsJson: l.goals,
      status: "pending" as const,
    }));

    if (lessonValues.length > 0) {
      await db.insert(lesson).values(lessonValues);
    }

    return NextResponse.json({ slug });
  } catch (error) {
    console.error("Error creating syllabus:", error);
    return NextResponse.json(
      { error: "Failed to create syllabus" },
      { status: 500 }
    );
  }
}
