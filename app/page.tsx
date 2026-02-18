import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { db } from "@/db";
import { syllabus, lesson } from "@/db/schema";
import NewSyllabusDialog from "@/components/new-syllabus-dialog";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin");
  }

  const syllabuses = await db
    .select()
    .from(syllabus)
    .where(eq(syllabus.userId, session.user.id!))
    .orderBy(desc(syllabus.createdAt));

  const lessonCounts = await Promise.all(
    syllabuses.map(async (syl) => {
      const lessons = await db
        .select({ status: lesson.status })
        .from(lesson)
        .where(eq(lesson.syllabusId, syl.id));
      return {
        total: lessons.length,
        ready: lessons.filter((l) => l.status === "ready").length,
      };
    })
  );

  return (
    <main className="min-h-screen px-6 py-12 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-heading">Pleroma</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Welcome, {session.user.name ?? session.user.email}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NewSyllabusDialog />
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/signin" });
            }}
          >
            <button
              type="submit"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>

      {syllabuses.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface px-6 py-12 text-center">
          <p className="text-muted-foreground mb-4">
            You haven&apos;t created any syllabuses yet.
          </p>
          <NewSyllabusDialog />
        </div>
      ) : (
        <div className="space-y-3">
          {syllabuses.map((syl, i) => {
            const counts = lessonCounts[i];
            return (
              <Link
                key={syl.id}
                href={`/s/${syl.slug}`}
                className="flex items-center justify-between rounded-lg border border-border bg-surface px-5 py-4 hover:border-link transition-colors"
              >
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-strong truncate">
                    {syl.title}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {syl.brief}
                  </p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                  <span className="text-xs text-muted-foreground">
                    {counts.ready}/{counts.total} lessons
                  </span>
                  <StatusBadge status={syl.status} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: "bg-muted/30 text-muted-foreground",
    outlined: "bg-link/20 text-link",
    generating: "bg-heading/20 text-heading",
    complete: "bg-accent/20 text-accent",
  };

  return (
    <span
      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${colors[status] ?? colors.draft}`}
    >
      {status}
    </span>
  );
}
