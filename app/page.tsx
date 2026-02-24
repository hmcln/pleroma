import CreateSyllabusForm from "@/components/create-syllabus-form";

export default function Home() {
  return (
    <main className="min-h-screen px-6 py-12 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Pleroma</h1>
      <p className="text-zinc-500 dark:text-zinc-400 mb-8">
        Generate structured educational syllabuses and lessons with AI.
      </p>
      <CreateSyllabusForm />
    </main>
  );
}
