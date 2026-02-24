import {
  streamText,
  tool,
  stepCountIs,
  generateText,
  convertToModelMessages,
} from "ai";
import { z } from "zod";
import { eq, and, asc } from "drizzle-orm";
import { openai } from "@/lib/ai";
import { db } from "@/db";
import { syllabus, lesson } from "@/db/schema";
import type { Outline } from "@/lib/outline-schema";

export async function POST(req: Request) {
  const { messages: uiMessages, lessonContext } = await req.json();
  const messages = await convertToModelMessages(uiMessages);

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: `You are a helpful teaching assistant for an AI-generated lesson platform called Pleroma. The user is reading a lesson and may have questions, spot errors, or want to suggest improvements.

Here is the lesson they are currently viewing:

---
Syllabus: ${lessonContext.syllabusTitle}
Lesson ${lessonContext.lessonIdx + 1}: ${lessonContext.lessonTitle}

${lessonContext.contentMd}
---

Your role:
- Answer questions about the lesson content clearly and accurately.
- If the user spots an error (e.g. wrong API version, deprecated functions, incorrect commands), acknowledge it and provide the correct information.
- When providing corrections, be specific about what's wrong and what should replace it.
- Keep responses concise and practical.
- Use code blocks with correct language tags when showing code.
- When the user wants to apply corrections or regenerate the lesson, use the regenerate_lesson tool. Summarize the feedback from the conversation into a clear, actionable set of instructions for the tool.
- Do NOT call the tool unless the user explicitly asks to regenerate, apply changes, or fix the lesson. Discussing errors alone is not enough — wait for a clear request to make changes.`,
    messages,
    tools: {
      regenerate_lesson: tool({
        description:
          "Regenerate the current lesson incorporating the user's feedback. Call this when the user explicitly asks to apply corrections, regenerate, or fix the lesson content.",
        inputSchema: z.object({
          feedback: z
            .string()
            .describe(
              "A clear summary of all the corrections and improvements to apply when regenerating the lesson. Be specific about what is wrong and what should replace it."
            ),
        }),
        execute: async ({ feedback }) => {
          const syllabusRows = await db
            .select()
            .from(syllabus)
            .where(eq(syllabus.slug, lessonContext.syllabusSlug))
            .limit(1);

          if (!syllabusRows.length) {
            return { success: false, error: "Syllabus not found" };
          }

          const syl = syllabusRows[0];
          const outline = syl.outlineJson as Outline;

          const lessonRows = await db
            .select()
            .from(lesson)
            .where(
              and(
                eq(lesson.syllabusId, syl.id),
                eq(lesson.lessonId, lessonContext.lessonId)
              )
            )
            .limit(1);

          if (!lessonRows.length) {
            return { success: false, error: "Lesson not found" };
          }

          const les = lessonRows[0];
          const outlineLesson = outline.lessons[les.idx];
          const goals = outlineLesson?.goals ?? [];
          const deliverable = outlineLesson?.deliverable ?? "";

          const allLessons = await db
            .select({ idx: lesson.idx, title: lesson.title })
            .from(lesson)
            .where(eq(lesson.syllabusId, syl.id))
            .orderBy(asc(lesson.idx));

          const prevContext = allLessons
            .filter((l) => l.idx < les.idx)
            .map((l) => `- Lesson ${l.idx + 1}: ${l.title}`)
            .join("\n");

          const { text: contentMd } = await generateText({
            model: openai("gpt-4o-mini"),
            prompt: `You are an expert technical instructor rewriting a lesson for a syllabus.

Syllabus: ${outline.title}
Description: ${outline.description}
Audience: ${outline.audience} (${syl.level} level)
${syl.constraints ? `Constraints: ${syl.constraints}` : ""}

${prevContext ? `Previous lessons covered:\n${prevContext}\n` : ""}

Now rewrite Lesson ${les.idx + 1}: "${les.title}"

Learning goals:
${goals.map((g) => `- ${g}`).join("\n")}

Expected deliverable: ${deliverable}

Here is the PREVIOUS version of this lesson that needs corrections:

${les.contentMd}

USER FEEDBACK — apply these corrections:
${feedback}

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
- Make code idiomatic for the relevant language/tools.
- Pay special attention to the user feedback — fix every issue they raised.`,
          });

          await db
            .update(lesson)
            .set({ contentMd, status: "ready", error: null })
            .where(eq(lesson.id, les.id));

          return { success: true, lessonId: les.lessonId };
        },
      }),
    },
    stopWhen: stepCountIs(2),
  });

  return result.toUIMessageStreamResponse();
}
