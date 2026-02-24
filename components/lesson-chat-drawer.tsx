"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Send, X, RotateCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface LessonContext {
  syllabusSlug: string;
  syllabusTitle: string;
  lessonId: string;
  lessonTitle: string;
  lessonIdx: number;
  contentMd: string;
}

export default function LessonChatDrawer({
  lessonContext,
}: {
  lessonContext: LessonContext;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { lessonContext },
      }),
    [lessonContext]
  );

  const { messages, sendMessage, status } = useChat({
    transport,
    onFinish: ({ message }) => {
      const didRegenerate = message.parts.some(
        (p) =>
          p.type === "tool-regenerate_lesson" &&
          p.state === "output-available" &&
          (p.output as Record<string, unknown>)?.success
      );
      if (didRegenerate) {
        router.refresh();
      }
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    sendMessage({ text });
  }

  return (
    <Drawer direction="right" open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-6 right-6 z-40 size-12 rounded-full shadow-lg"
        >
          <MessageCircle className="size-5" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-full w-full sm:max-w-md">
        <DrawerHeader className="flex-row items-center justify-between border-b border-border">
          <DrawerTitle className="text-heading">Lesson Q&A</DrawerTitle>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setOpen(false)}
          >
            <X className="size-4" />
          </Button>
        </DrawerHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-muted-foreground text-sm text-center mt-8 space-y-2">
              <p>
                Ask questions about this lesson, report errors, or suggest
                improvements.
              </p>
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {[
                  "What's wrong with the code in this lesson?",
                  "Are the library versions correct?",
                  "Summarize needed corrections",
                ].map((q) => (
                  <button
                    key={q}
                    type="button"
                    className="text-xs border border-border rounded-md px-2.5 py-1.5 hover:bg-surface transition-colors text-left"
                    onClick={() => setInput(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface text-foreground"
                }`}
              >
                {m.role === "assistant" ? (
                  <div className="space-y-2">
                    {m.parts.map((part, i) => {
                      if (part.type === "text" && part.text.trim()) {
                        return (
                          <div
                            key={i}
                            className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                          >
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {part.text}
                            </ReactMarkdown>
                          </div>
                        );
                      }
                      if (part.type === "tool-regenerate_lesson") {
                        const isRunning =
                          part.state === "input-streaming" ||
                          part.state === "input-available";
                        const isDone =
                          part.state === "output-available";
                        const isError = part.state === "output-error";
                        const success =
                          isDone &&
                          (part.output as Record<string, unknown>)
                            ?.success;
                        return (
                          <div
                            key={i}
                            className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs"
                          >
                            <RotateCw
                              className={`size-3.5 ${isRunning ? "animate-spin text-link" : success ? "text-accent" : "text-destructive"}`}
                            />
                            <span>
                              {isRunning
                                ? "Regenerating lesson…"
                                : success
                                  ? "Lesson regenerated — page will refresh."
                                  : `Failed: ${isError ? part.errorText : "unknown error"}`}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">
                    {m.parts
                      .filter((p) => p.type === "text")
                      .map((p) => p.text)
                      .join("")}
                  </p>
                )}
              </div>
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="bg-surface rounded-lg px-3 py-2 text-sm text-muted-foreground">
                Thinking…
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="border-t border-border p-3 flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this lesson…"
            className="flex-1 bg-surface border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
          >
            <Send className="size-4" />
          </Button>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
