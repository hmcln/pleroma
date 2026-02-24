import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-6 rounded-lg border border-border bg-surface px-10 py-12">
        <h1 className="text-3xl font-bold text-heading">Pleroma</h1>
        <p className="text-muted">Sign in to continue</p>
        <form
          action={async () => {
            "use server";
            await signIn("github", { redirectTo: "/" });
          }}
        >
          <Button type="submit" size="lg">
            Sign in with GitHub
          </Button>
        </form>
      </div>
    </main>
  );
}
