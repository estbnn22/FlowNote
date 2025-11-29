// app/notes/page.tsx
import Link from "next/link";
import MobileNav from "@/components/mobileBar";
import SideBar from "@/components/sideBar";
import { stackServerApp } from "@/stack/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  createNote,
  createNotebook,
  renameNotebook,
  deleteNotebook,
} from "../actions/notes/actions";
import {
  NotebookPen,
  Sparkles,
  BookOpenText,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import NotesBoard from "@/components/NotesBoard";

// 🔧 searchParams can be a Promise or a plain object, so handle both
type NotesPageProps = {
  searchParams:
    | { [key: string]: string | string[] | undefined }
    | Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function NotesPage(props: NotesPageProps) {
  const user = await stackServerApp.getUser();
  if (!user) redirect("/signIn");

  // ✅ Normalize searchParams
  const raw =
    "then" in (props.searchParams as any)
      ? await (props.searchParams as any)
      : (props.searchParams as any);

  const rawNotebookId = raw?.notebookId;
  const activeNotebookId =
    Array.isArray(rawNotebookId) && rawNotebookId.length > 0
      ? rawNotebookId[0]
      : typeof rawNotebookId === "string"
      ? rawNotebookId
      : undefined;

  // 1) Fetch all notes for this user once
  const allNotes = await prisma.note.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  // 2) Fetch all notebooks for this user
  const notebooks = await prisma.notebook.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  // 3) Count how many notes each notebook has
  const counts = new Map<string, number>();
  for (const n of allNotes as any[]) {
    const nbId = (n as any).notebookId as string | null | undefined;
    if (!nbId) continue;
    counts.set(nbId, (counts.get(nbId) ?? 0) + 1);
  }

  const safeNotebooks = notebooks.map((nb: any) => ({
    id: nb.id as string,
    name: nb.name as string,
    notesCount: counts.get(nb.id as string) ?? 0,
  }));

  // 4) Scope notes to the selected notebook (or all notes)
  const scopedNotes = activeNotebookId
    ? (allNotes as any[]).filter((n) => n.notebookId === activeNotebookId)
    : allNotes;

  const totalNotes = scopedNotes.length;
  const pinnedCount = scopedNotes.filter((n) => n.pinned).length;
  const highCount = scopedNotes.filter((n) => n.importance === "HIGH").length;
  const lastUpdated = scopedNotes[0]?.updatedAt ?? null;

  const activeNotebook = activeNotebookId
    ? safeNotebooks.find((nb) => nb.id === activeNotebookId)
    : undefined;

  const scopeLabel = activeNotebook
    ? `${activeNotebook.name} notebook`
    : "All notes";

  // 5) Serialize for the client board
  const safeNotes = scopedNotes.map((n: any) => ({
    id: n.id as string,
    title: n.title as string,
    content: n.content as string | null,
    importance: n.importance,
    updatedAt: n.updatedAt.toISOString(),
    pinned: n.pinned as boolean,
  }));

  return (
    <div className="min-h-screen bg-base-100 text-white">
      <SideBar currentPage="/notes" />

      <main className="md:ml-64 px-4 pb-24 pt-6 md:px-10 md:pt-10 mb-10 md:mb-0">
        {/* Header */}
        <header className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold">Notes</h1>
            <p className="mt-2 text-xs text-neutral/60 md:text-sm">
              Capture ideas and organize them by notebook and priority.
            </p>
            <p className="mt-1 text-[11px] text-neutral/50">
              Currently viewing:{" "}
              <span className="font-semibold text-primary">{scopeLabel}</span>
            </p>
          </div>

          {/* Stats for the CURRENT scope (all notes or a notebook) */}
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
            <div className="rounded-xl border border-warning/40 bg-warning/5 px-3 py-2 text-center">
              <p className="text-[11px] uppercase tracking-wide text-neutral/60">
                High priority
              </p>
              <p className="text-lg font-semibold text-warning">{highCount}</p>
            </div>
          </div>
        </header>

        {/* Notebook scope selector + create notebook */}
        <section className="mb-6 rounded-2xl border border-base-300/60 bg-base-200/80 p-0 shadow-sm">
          <details className="group" open>
            {/* Header row becomes the <summary> */}
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                  <BookOpenText className="h-4 w-4 text-primary" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-neutral">
                    Notebooks
                  </h2>
                  <p className="text-[11px] text-neutral/60">
                    Tap to show or hide your notebooks. On desktop this stays
                    open.
                  </p>
                </div>
              </div>

              {/* Right side: count + chevron */}
              <div className="flex items-center gap-2">
                <p className="hidden text-[11px] text-neutral/60 md:block">
                  {safeNotebooks.length === 0
                    ? "No notebooks yet."
                    : `${safeNotebooks.length} notebook${
                        safeNotebooks.length === 1 ? "" : "s"
                      }`}
                </p>
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-base-300/70 text-[10px] text-neutral/60">
                  {safeNotebooks.length}
                </span>
                {/* chevron that rotates when open */}
                <span className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-base-300/70 text-[10px] text-neutral/60 transition-transform group-open:rotate-180 md:hidden">
                  ▾
                </span>
              </div>
            </summary>

            {/* Content (pills + create form) */}
            <div className="border-t border-base-300/60 px-4 py-3">
              <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <p className="text-[11px] text-neutral/60 md:hidden">
                  {safeNotebooks.length === 0
                    ? "No notebooks yet. You can still take quick notes."
                    : `${safeNotebooks.length} notebook${
                        safeNotebooks.length === 1 ? "" : "s"
                      } available.`}
                </p>
                <p className="hidden text-[11px] text-neutral/60 md:block">
                  {safeNotebooks.length === 0
                    ? "No notebooks yet. You can still take quick notes."
                    : `${safeNotebooks.length} notebook${
                        safeNotebooks.length === 1 ? "" : "s"
                      } available.`}
                </p>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                {/* Left: scope pills */}
                <div className="flex flex-wrap gap-2">
                  {/* All notes pill */}
                  <Link
                    href="/notes"
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${
                      !activeNotebookId
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-base-300 bg-base-100/70 text-neutral/80 hover:border-primary/50 hover:text-primary"
                    }`}
                  >
                    <span className="font-semibold">All notes</span>
                    <span className="text-[10px] text-neutral/60">
                      {allNotes.length} total
                    </span>
                  </Link>

                  {/* Each notebook as a pill */}
                  {safeNotebooks.map((nb) => {
                    const isActive = nb.id === activeNotebookId;
                    return (
                      <Link
                        key={nb.id}
                        href={`/notes?notebookId=${nb.id}`}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${
                          isActive
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-base-300 bg-base-100/70 text-neutral/80 hover:border-primary/50 hover:text-primary"
                        }`}
                      >
                        <span className="font-semibold">{nb.name}</span>
                        <span className="text-[10px] text-neutral/60">
                          {nb.notesCount} note{nb.notesCount === 1 ? "" : "s"}
                        </span>
                      </Link>
                    );
                  })}
                </div>

                {/* Right: create notebook form */}
                <form
                  action={createNotebook}
                  className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center"
                >
                  <input
                    type="text"
                    name="name"
                    placeholder="New notebook name..."
                    className="w-full rounded-lg border border-base-300 bg-base-100/80 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/60 md:w-52"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-content shadow shadow-primary/30 hover:bg-primary/80"
                  >
                    <Plus className="h-3 w-3" />
                    Add notebook
                  </button>
                </form>
              </div>
            </div>
          </details>
        </section>

        {/* 🔧 Manage current notebook (rename / delete) */}
        {activeNotebook && (
          <section className="mb-6 rounded-2xl border border-base-300/60 bg-base-200/80 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral">
                  <Pencil className="h-4 w-4 text-primary" />
                  Manage notebook
                </h2>
                <p className="text-[11px] text-neutral/60">
                  You&apos;re editing{" "}
                  <span className="font-medium text-primary">
                    {activeNotebook.name}
                  </span>
                  .
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              {/* Rename form */}
              <form
                action={renameNotebook}
                className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center"
              >
                <input type="hidden" name="id" value={activeNotebook.id} />
                <input
                  type="text"
                  name="name"
                  defaultValue={activeNotebook.name}
                  className="w-full rounded-lg border border-base-300 bg-base-100/80 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/60 md:w-60"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-content shadow shadow-primary/30 hover:bg-primary/80"
                >
                  <Pencil className="h-3 w-3" />
                  Rename
                </button>
              </form>

              {/* Delete form */}
              <form
                action={deleteNotebook}
                className="flex items-center justify-end"
              >
                <input type="hidden" name="id" value={activeNotebook.id} />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-error/50 bg-error/10 px-3 py-1.5 text-xs font-semibold text-error hover:bg-error/20"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete notebook
                </button>
              </form>
            </div>
          </section>
        )}

        <section className="space-y-5">
          {/* Quick note card */}
          <section className="rounded-2xl border border-base-300/60 bg-base-200/80 p-4 shadow-sm md:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Quick note
                </h2>
                <p className="text-[11px] text-neutral/60">
                  Jot something down fast. You can drag it between priorities on
                  the board.
                </p>
              </div>
            </div>

            <form action={createNote} className="space-y-3">
              {/* If we are inside a notebook scope, save directly to it */}
              {activeNotebook ? (
                <>
                  <input
                    type="hidden"
                    name="notebookId"
                    value={activeNotebook.id}
                  />
                  <p className="text-[11px] text-neutral/60">
                    Saving to notebook:{" "}
                    <span className="font-medium text-primary">
                      {activeNotebook.name}
                    </span>
                  </p>
                </>
              ) : safeNotebooks.length > 0 ? (
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-neutral/70">
                    Notebook (optional)
                  </label>
                  <select
                    name="notebookId"
                    className="rounded-lg border border-base-300 bg-base-300/60 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/60"
                    defaultValue=""
                  >
                    <option value="">No notebook</option>
                    {safeNotebooks.map((nb) => (
                      <option key={nb.id} value={nb.id}>
                        {nb.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="flex flex-col gap-1">
                <label className="text-xs text-neutral/70">Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  maxLength={120}
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
                  placeholder="Optional details..."
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-neutral/70">
                  <span>Importance:</span>
                  <select
                    name="importance"
                    defaultValue="MEDIUM"
                    className="rounded-lg border border-base-300 bg-base-300/60 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/60"
                  >
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
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

          {/* Drag & drop board, scoped to either All Notes or the active notebook */}
          <NotesBoard initialNotes={safeNotes} />
        </section>
      </main>

      <MobileNav currentPage="/notes" />
    </div>
  );
}
