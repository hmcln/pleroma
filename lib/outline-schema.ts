import { z } from "zod";

export const outlineSchema = z.object({
  title: z.string(),
  description: z.string(),
  audience: z.string(),
  prerequisites: z.array(z.string()),
  assumptions: z.array(z.string()),
  lessons: z.array(
    z.object({
      lessonId: z.string(),
      title: z.string(),
      goals: z.array(z.string()),
      deliverable: z.string(),
      estMinutes: z.number().nullable(),
    })
  ),
});

export type Outline = z.infer<typeof outlineSchema>;
