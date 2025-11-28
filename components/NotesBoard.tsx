// components/NotesBoard.tsx
"use client";

import {
  useMemo,
  useState,
  useTransition,
  useEffect,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Pin, Trash2 } from "lucide-react";
import {
  moveNoteToImportance,
  deleteNote,
  togglePinnedNote,
  type Importance,
} from "@/app/actions/notes/actions";

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";

type NoteDTO = {
  id: string;
  title: string;
  content: string | null;
  importance: Importance;
  updatedAt: string; // ISO
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

type NotesBoardProps = {
  initialNotes: NoteDTO[];
};

export default function NotesBoard({ initialNotes }: NotesBoardProps) {
  const router = useRouter();
  const [notes, setNotes] = useState<NoteDTO[]>(initialNotes);
  const [search, setSearch] = useState("");
  const [onlyPinned, setOnlyPinned] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // ✅ Prevent hydration mismatch: only render board after client mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // dnd-kit sensors (mouse + touch)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // 🔍 Filter + sort (pinned first, then newest)
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

  // dnd-kit handlers
  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const noteId = active.id as string;
    const targetImportance = over.id as Importance;

    const note = notes.find((n) => n.id === noteId);
    if (!note || note.importance === targetImportance) return;

    // optimistic move
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId ? { ...n, importance: targetImportance } : n
      )
    );

    // sync with server
    startTransition(async () => {
      try {
        await moveNoteToImportance(noteId, targetImportance);
      } finally {
        router.refresh();
      }
    });
  }

  async function handleDelete(id: string) {
    const ok = window.confirm("Delete this note?");
    if (!ok) return;

    // optimistic delete
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
    // optimistic pin toggle
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

  // ⛑️ On server / first hydration, don't render dnd at all
  if (!mounted) {
    return null; // or a skeleton if you want
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
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid gap-4 md:grid-cols-3">
          {COLUMNS.map((col) => {
            const colNotes = getColumnNotes(col.key);

            return (
              <DroppableColumn
                key={col.key}
                column={col}
                count={colNotes.length}
              >
                {colNotes.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-base-300/70 bg-base-100/40 px-3 py-4 text-center text-[11px] text-neutral/60">
                    Drag a note here or create one above.
                  </div>
                ) : (
                  colNotes.map((note) => (
                    <DraggableNoteCard
                      key={note.id}
                      note={note}
                      activeId={activeId}
                      onTogglePin={handleTogglePin}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </DroppableColumn>
            );
          })}
        </div>
      </DndContext>
    </div>
  );
}

/* ---------- Droppable column ---------- */

type ColumnConfig = (typeof COLUMNS)[number];

function DroppableColumn({
  column,
  count,
  children,
}: {
  column: ColumnConfig;
  count: number;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.key });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[220px] flex-col rounded-2xl border ${
        column.borderClass
      } ${column.bgClass} p-3 shadow-sm transition-colors duration-200 ${
        isOver ? "border-primary/60 bg-base-100/70" : ""
      }`}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-base-100/70 text-neutral/70">
              {column.label}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${column.headerBadgeClass}`}
            >
              {column.key}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-neutral/70">{column.subtitle}</p>
        </div>
        <span className="text-[11px] text-neutral/60">
          {count} note{count === 1 ? "" : "s"}
        </span>
      </div>

      <div className="flex-1 space-y-2">{children}</div>
    </div>
  );
}

/* ---------- Draggable note card ---------- */

function DraggableNoteCard({
  note,
  activeId,
  onTogglePin,
  onDelete,
}: {
  note: NoteDTO;
  activeId: string | null;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: note.id });

  const style: CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.8 : 1,
    boxShadow: isDragging
      ? "0 12px 30px rgba(0,0,0,0.25)"
      : "0 2px 8px rgba(0,0,0,0.15)",
    cursor: "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="active:cursor-grabbing"
    >
      <article
        className={`group rounded-xl border border-base-300/80 bg-base-100/80 p-3 text-xs transition hover:border-primary/60 hover:bg-base-100 ${
          note.pinned ? "ring-1 ring-primary/60" : ""
        } ${activeId === note.id ? "ring-2 ring-primary/70" : ""}`}
      >
        <div className="mb-1 flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-semibold text-neutral">
            {note.title}
          </h3>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onTogglePin(note.id)}
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
              onClick={() => onDelete(note.id)}
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
    </div>
  );
}
