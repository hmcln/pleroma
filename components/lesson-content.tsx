"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function LessonContent({ markdown }: { markdown: string }) {
  return (
    <article className="prose max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </article>
  );
}
