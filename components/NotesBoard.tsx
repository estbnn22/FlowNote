// components/NotesBoard.tsx
"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pin, PinOff, Trash2 } from "lucide-react";
import {
  moveNoteToImportance,
  deleteNote,
  togglePinnedNote,
  type Importance,
} from "@/app/actions/notes/actions";

type NoteDTO = {
  id: string;
  title: string;
  content: string | null;
  importance: Importance;
  updatedAt: string; // ISO string from server
  pinned: boolean;
};

const COLUMNS: {
  key: Importance;
  label: string;
  subtitle: string;
  bgClass: string;
  borderClass: string;
  headerBadgeClass: string;
}[] = [
  {
    key: "HIGH",
    label: "High focus",
    subtitle: "Important and urgent",
    bgClass: "bg-error/10",
    borderClass: "border-error/40",
    headerBadgeClass: "bg-error/20 text-error",
  },
  {
    key: "MEDIUM",
    label: "Medium",
    subtitle: "Nice to remember",
    bgClass: "bg-warning/10",
    borderClass: "border-warning/40",
    headerBadgeClass: "bg-warning/20 text-warning",
  },
  {
    key: "LOW",
    label: "Low",
    subtitle: "Reference & someday",
    bgClass: "bg-success/10",
    borderClass: "border-success/40",
    headerBadgeClass: "bg-success/20 text-success",
  },
];

export default function NotesBoard({
  initialNotes,
}: {
  initialNotes: NoteDTO[];
}) {
  const router = useRouter();
  const [notes, setNotes] = useState<NoteDTO[]>(initialNotes);
  const [search, setSearch] = useState("");
  const [onlyPinned, setOnlyPinned] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // 🔍 Filter & sort notes (pinned first, then latest updated)
  const filteredNotes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return notes
      .filter((n) => {
        if (onlyPinned && !n.pinned) return false;
        if (!query) return true;
        return (
          n.title.toLowerCase().includes(query) ||
          (n.content ?? "").toLowerCase().includes(query)
        );
      })
      .slice()
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });
  }, [notes, search, onlyPinned]);

  function getColumnNotes(importance: Importance) {
    return filteredNotes.filter((n) => n.importance === importance);
  }

  function handleDragStart(id: string) {
    setDraggingId(id);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDropColumn(
    importance: Importance,
    e: React.DragEvent<HTMLDivElement>
  ) {
    e.preventDefault();
    if (!draggingId) return;

    const note = notes.find((n) => n.id === draggingId);
    if (!note || note.importance === importance) {
      setDraggingId(null);
      return;
    }

    // optimistic UI
    setNotes((prev) =>
      prev.map((n) => (n.id === draggingId ? { ...n, importance } : n))
    );

    startTransition(async () => {
      try {
        await moveNoteToImportance(draggingId, importance);
      } finally {
        router.refresh();
      }
    });

    setDraggingId(null);
  }

  async function handleDelete(id: string) {
    const ok = window.confirm("Delete this note?");
    if (!ok) return;

    // optimistic
    setNotes((prev) => prev.filter((n) => n.id !== id));

    startTransition(async () => {
      const fd = new FormData();
      fd.append("id", id);
      try {
        await deleteNote(fd);
      } finally {
        router.refresh();
      }
    });
  }

  async function handleTogglePin(id: string) {
    // optimistic toggle
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n))
    );

    startTransition(async () => {
      try {
        await togglePinnedNote(id);
      } finally {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Toolbar: search + pinned filter */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="w-full md:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes by title or content..."
            className="w-full rounded-xl border border-base-300 bg-base-200/80 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
          />
        </div>

        <div className="flex items-center gap-3 text-xs md:text-sm">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={onlyPinned}
              onChange={(e) => setOnlyPinned(e.target.checked)}
              className="checkbox checkbox-xs"
            />
            <span className="text-neutral/70">Show only pinned notes</span>
          </label>

          {isPending && (
            <span className="text-[11px] text-neutral/50">Syncing…</span>
          )}
        </div>
      </div>

      {/* Board */}
      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const colNotes = getColumnNotes(col.key);

          return (
            <div
              key={col.key}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDropColumn(col.key, e)}
              className={`flex min-h-[220px] flex-col rounded-2xl border ${col.borderClass} ${col.bgClass} p-3 shadow-sm`}
            >
              {/* Column header */}
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-base-100/70 text-neutral/70">
                      {col.label}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${col.headerBadgeClass}`}
                    >
                      {col.key}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-neutral/70">
                    {col.subtitle}
                  </p>
                </div>
                <span className="text-[11px] text-neutral/60">
                  {colNotes.length} note
                  {colNotes.length === 1 ? "" : "s"}
                </span>
              </div>

              {/* Column content */}
              <div className="flex-1 space-y-2">
                {colNotes.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-base-300/70 bg-base-100/40 px-3 py-4 text-center text-[11px] text-neutral/60">
                    Drag a note here or create one above.
                  </div>
                ) : (
                  colNotes.map((note) => (
                    <article
                      key={note.id}
                      draggable
                      onDragStart={() => handleDragStart(note.id)}
                      className={`group rounded-xl border border-base-300/80 bg-base-100/80 p-3 text-xs transition hover:border-primary/60 hover:bg-base-100 ${
                        note.pinned ? "ring-1 ring-primary/60" : ""
                      }`}
                    >
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <h3 className="line-clamp-1 font-semibold text-neutral">
                          {note.title}
                        </h3>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleTogglePin(note.id)}
                            className="rounded-full p-1 text-neutral/50 hover:bg-base-200 hover:text-primary"
                            title={note.pinned ? "Unpin" : "Pin"}
                          >
                            {note.pinned ? (
                              <Pin className="h-3 w-3 fill-primary text-primary" />
                            ) : (
                              <Pin className="h-3 w-3" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(note.id)}
                            className="rounded-full p-1 text-neutral/50 hover:bg-base-200 hover:text-error"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {note.content && (
                        <p className="mb-1 line-clamp-3 text-[11px] text-neutral/70">
                          {note.content}
                        </p>
                      )}

                      <p className="mt-1 text-[10px] text-neutral/50">
                        Updated{" "}
                        {new Date(note.updatedAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </article>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
