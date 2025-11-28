// app/notes/page.tsx
import MobileNav from "@/components/mobileBar";
import SideBar from "@/components/sideBar";
import { stackServerApp } from "@/stack/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createNote } from "../actions/notes/actions";
import { NotebookPen, Sparkles } from "lucide-react";
import NotesBoard from "@/components/NotesBoard";

type NotesPageProps = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default async function NotesPage({ searchParams }: NotesPageProps) {
  const user = await stackServerApp.getUser();
  if (!user) redirect("/signIn");

  const notes = await prisma.note.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  const totalNotes = notes.length;
  const pinnedCount = notes.filter((n) => n.pinned).length;
  const highCount = notes.filter((n) => n.importance === "HIGH").length;

  const lastUpdated = notes[0]?.updatedAt ?? null;

  // serialize dates for the client
  const safeNotes = notes.map((n) => ({
    ...n,
    updatedAt: n.updatedAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-base-100 text-white">
      <SideBar currentPage="/notes" />

      <main className="md:ml-64 px-4 pb-24 pt-6 md:px-10 md:pt-10 mb-10 md:mb-0">
        {/* Header */}
        <header className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-semibold md:text-4xl">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <NotebookPen className="h-5 w-5 text-primary" />
              </span>
              Notes
            </h1>
            <p className="mt-2 text-xs text-neutral/60 md:text-sm">
              Capture ideas and organize them by importance.
            </p>
          </div>

          {/* Quick stats */}
          <div className="grid w-full grid-cols-3 gap-2 text-xs md:w-auto md:text-sm">
            <div className="rounded-xl border border-base-300 bg-base-200/70 px-3 py-2 text-center">
              <p className="text-[11px] uppercase tracking-wide text-neutral/60">
                Total
              </p>
              <p className="text-lg font-semibold">{totalNotes}</p>
            </div>
            <div className="rounded-xl border border-error/40 bg-error/5 px-3 py-2 text-center">
              <p className="text-[11px] uppercase tracking-wide text-neutral/60">
                Pinned
              </p>
              <p className="text-lg font-semibold text-error">{pinnedCount}</p>
            </div>
            <div className="rounded-xl border border-base-300 bg-base-200/70 px-3 py-2 text-center">
              <p className="text-[11px] uppercase tracking-wide text-neutral/60">
                Updated
              </p>
              <p className="text-[11px] text-neutral/70">
                {lastUpdated
                  ? lastUpdated.toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                    })
                  : "—"}
              </p>
            </div>
          </div>
        </header>

        {/* New note card */}
        <section className="mb-8 rounded-2xl border border-base-300/60 bg-base-200/80 p-4 shadow-sm md:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral">
                <Sparkles className="h-4 w-4 text-primary" />
                Quick note
              </h2>
              <p className="text-[11px] text-neutral/60">
                Jot something down and sort it by importance.
              </p>
            </div>
          </div>

          <form action={createNote} className="space-y-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral/70">Title</label>
              <input
                type="text"
                name="title"
                required
                className="rounded-lg border border-base-300 bg-base-300/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
                placeholder="Note title..."
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral/70">Content</label>
              <textarea
                name="content"
                rows={3}
                className="rounded-lg border border-base-300 bg-base-300/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
                placeholder="Write your note..."
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-neutral/70">
                <span>Importance</span>
                <select
                  name="importance"
                  defaultValue="MEDIUM"
                  className="rounded-lg border border-base-300 bg-base-300/60 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/60"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-content shadow shadow-primary/30 transition hover:bg-primary/80 hover:cursor-pointer"
              >
                Save note
              </button>
            </div>
          </form>
        </section>

        {/* Drag & drop board */}
        <NotesBoard initialNotes={safeNotes} />
      </main>

      <MobileNav currentPage="/notes" />
    </div>
  );
}
