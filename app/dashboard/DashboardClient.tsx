// app/dashboard/DashboardClient.tsx
"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  CalendarClock,
  StickyNote,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { quickToggleTodo } from "@/app/actions/todos/actions";

type Importance = "LOW" | "MEDIUM" | "HIGH";
type Status = "TODO" | "IN_PROGRESS" | "DONE";

type TodoDTO = {
  id: string;
  title: string;
  status: Status;
  importance: Importance;
  dueAt: string | null; // ISO
};

type NoteDTO = {
  id: string;
  title: string;
  content: string | null;
  updatedAt: string; // ISO
};

type PlanDTO = {
  id: string;
  title: string;
  description: string | null;
  startsAt: string; // ISO
  endsAt: string | null; // ISO
  importance: Importance;
};

type Props = {
  userName: string;
  todos: TodoDTO[];
  recentNotes: NoteDTO[];
  upcomingPlans: PlanDTO[];
  completionRate: number;
  totalTodos: number;
  todayOpenTodos: number;
  overdueTodos: number;
  todayPlansCount: number;
};

type FocusFilter = "TODAY" | "WEEK" | "ALL";

function isToday(date: Date) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const start = d.getTime();
  const end = start + 24 * 60 * 60 * 1000;
  const t = date.getTime();
  return t >= start && t < end;
}

function isWithinNextWeek(date: Date) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const start = d.getTime();
  const end = start + 7 * 24 * 60 * 60 * 1000;
  const t = date.getTime();
  return t >= start && t < end;
}

export default function DashboardClient({
  userName,
  todos: initialTodos,
  recentNotes,
  upcomingPlans: initialPlans,
  completionRate,
  totalTodos,
  todayOpenTodos,
  overdueTodos,
  todayPlansCount,
}: Props) {
  const router = useRouter();
  const [focusFilter, setFocusFilter] = useState<FocusFilter>("ALL");
  const [todos, setTodos] = useState<TodoDTO[]>(initialTodos);
  const [plans, setPlans] = useState<PlanDTO[]>(initialPlans);
  const [isPending, startTransition] = useTransition();

  const visibleTodos = useMemo(() => {
    return todos.filter((t) => {
      if (!t.dueAt) return true; // no due date -> always show
      const d = new Date(t.dueAt);
      if (focusFilter === "TODAY") return isToday(d);
      if (focusFilter === "WEEK") return isWithinNextWeek(d);
      return true; // ALL
    });
  }, [todos, focusFilter]);

  const visiblePlans = useMemo(() => {
    return plans.filter((p) => {
      const d = new Date(p.startsAt);
      if (focusFilter === "TODAY") return isToday(d);
      if (focusFilter === "WEEK") return isWithinNextWeek(d);
      return true;
    });
  }, [plans, focusFilter]);

  // ✅ Toggle todo status with optimistic UI
  function handleToggleTodo(id: string) {
    setTodos((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        let nextStatus: Status;
        switch (t.status) {
          case "TODO":
            nextStatus = "IN_PROGRESS";
            break;
          case "IN_PROGRESS":
            nextStatus = "DONE";
            break;
          case "DONE":
          default:
            nextStatus = "TODO";
            break;
        }
        return { ...t, status: nextStatus };
      })
    );

    startTransition(async () => {
      try {
        await quickToggleTodo(id);
      } finally {
        // keep the top stats (completion, tasks today, etc) in sync
        router.refresh();
      }
    });
  }

  return (
    <>
      {/* Greeting */}
      <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold">
            Welcome back, <span className="text-primary">{userName}</span>.
          </h1>
          <p className="mt-2 text-sm text-neutral/70">
            Here&apos;s a quick overview of your tasks, notes, and plans.
          </p>
        </div>

        {/* Focus filter chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-neutral/60">Focus:</span>
          <button
            type="button"
            onClick={() => setFocusFilter("TODAY")}
            className={`btn btn-xs rounded-full ${
              focusFilter === "TODAY"
                ? "btn-primary text-primary-content"
                : "btn-ghost border border-base-300"
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setFocusFilter("WEEK")}
            className={`btn btn-xs rounded-full ${
              focusFilter === "WEEK"
                ? "btn-primary text-primary-content"
                : "btn-ghost border border-base-300"
            }`}
          >
            This week
          </button>
          <button
            type="button"
            onClick={() => setFocusFilter("ALL")}
            className={`btn btn-xs rounded-full ${
              focusFilter === "ALL"
                ? "btn-primary text-primary-content"
                : "btn-ghost border border-base-300"
            }`}
          >
            All
          </button>

          {isPending && (
            <span className="text-[11px] text-neutral/50 ml-2">Syncing…</span>
          )}
        </div>
      </header>

      {/* Today at a glance */}
      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Tasks today */}
        <div className="rounded-2xl border border-base-300/60 bg-base-200/70 p-3 shadow-sm flex flex-col justify-between hover:border-primary/60 hover:bg-base-200 transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
                <BadgeCheck className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral">
                  Tasks today
                </p>
                <p className="text-[11px] text-neutral/60">
                  Due before midnight
                </p>
              </div>
            </div>
            {todayOpenTodos > 0 && (
              <AlertTriangle className="h-4 w-4 text-warning" />
            )}
          </div>
          <div className="mt-3 flex items-end justify-between">
            <p className="text-2xl font-bold">{todayOpenTodos}</p>
            <p className="text-[11px] text-neutral/60">
              {overdueTodos > 0
                ? `${overdueTodos} overdue`
                : "Nothing overdue 🎉"}
            </p>
          </div>
        </div>

        {/* Plans today */}
        <div className="rounded-2xl border border-base-300/60 bg-base-200/70 p-3 shadow-sm flex flex-col justify-between hover:border-primary/60 hover:bg-base-200 transition">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
              <CalendarClock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral">
                Today&apos;s plans
              </p>
              <p className="text-[11px] text-neutral/60">From your planner</p>
            </div>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <p className="text-2xl font-bold">{todayPlansCount}</p>
            <p className="text-[11px] text-neutral/60">
              {visiblePlans[0]
                ? `Next: ${formatShortDateTime(visiblePlans[0].startsAt)}`
                : "No upcoming plans"}
            </p>
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-2xl border border-base-300/60 bg-base-200/70 p-3 shadow-sm flex flex-col justify-between hover:border-primary/60 hover:bg-base-200 transition">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
              <StickyNote className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral">Notes</p>
              <p className="text-[11px] text-neutral/60">
                Last 5 recently updated
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <p className="text-2xl font-bold">{recentNotes.length}</p>
            <p className="text-[11px] text-neutral/60">
              Keep ideas out of your head
            </p>
          </div>
        </div>

        {/* Overall completion with progress bar */}
        <div className="rounded-2xl border border-base-300/60 bg-base-200/70 p-3 shadow-sm flex flex-col justify-between hover:border-primary/60 hover:bg-base-200 transition">
          <p className="text-xs font-semibold text-neutral flex items-center gap-1">
            Overall completion
            {completionRate >= 80 && (
              <CheckCircle2 className="h-3 w-3 text-success" />
            )}
          </p>
          <div className="mt-2">
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold">{completionRate}%</p>
              <p className="text-[11px] text-neutral/60">
                {totalTodos} total tasks
              </p>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-base-300 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick navigation */}
      <section className="mb-8 flex flex-wrap gap-2 text-xs items-center">
        <span className="text-neutral/60">Quick jump:</span>
        <Link href="/planner" className="badge badge-primary badge-outline">
          Planner
        </Link>
        <Link href="/todos" className="badge badge-primary badge-outline">
          To-Dos
        </Link>
        <Link href="/notes" className="badge badge-primary badge-outline">
          Notes
        </Link>
      </section>

      {/* Summary grid */}
      <section className="grid gap-5 md:grid-cols-3">
        {/* Important / recent todos with live checkboxes */}
        <div className="rounded-2xl border border-base-300/60 bg-base-200/70 p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
                <BadgeCheck className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-neutral">
                  Important To-Dos
                </h2>
                <p className="text-[11px] text-neutral/60">
                  Tap to mark in progress or done.
                </p>
              </div>
            </div>
            <span className="text-[11px] text-neutral/60">
              {visibleTodos.length} items
            </span>
          </div>

          <div className="space-y-2">
            {visibleTodos.length === 0 && (
              <p className="text-xs text-neutral/60">
                No tasks in this focus view.
              </p>
            )}

            {visibleTodos.map((todo) => (
              <button
                key={todo.id}
                type="button"
                onClick={() => handleToggleTodo(todo.id)}
                className="flex w-full items-center justify-between rounded-xl border border-base-300/50 bg-base-300/40 px-3 py-2 text-xs text-left hover:border-primary/60 hover:bg-base-300/80 transition"
              >
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    readOnly
                    checked={todo.status === "DONE"}
                    className="checkbox checkbox-xs checkbox-success mt-0.5"
                  />
                  <div className="flex flex-col">
                    <span
                      className={`font-medium text-neutral line-clamp-1 ${
                        todo.status === "DONE" ? "line-through opacity-60" : ""
                      }`}
                    >
                      {todo.title}
                    </span>
                    <span className="mt-0.5 text-[11px] text-neutral/60">
                      {formatStatus(todo.status)} ·{" "}
                      {formatImportance(todo.importance)}
                      {todo.dueAt && (
                        <> · Due {formatShortDateTime(todo.dueAt)}</>
                      )}
                    </span>
                  </div>
                </div>

                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    todo.importance === "HIGH"
                      ? "bg-error/20 text-error"
                      : todo.importance === "MEDIUM"
                      ? "bg-warning/15 text-warning"
                      : "bg-success/15 text-success"
                  }`}
                >
                  {todo.importance}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent notes (unchanged, just slightly more hover) */}
        <div className="rounded-2xl border border-base-300/60 bg-base-200/70 p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
                <StickyNote className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-neutral">
                  Recent Notes
                </h2>
                <p className="text-[11px] text-neutral/60">
                  Last 5 notes you&apos;ve updated.
                </p>
              </div>
            </div>
            <span className="text-[11px] text-neutral/60">
              {recentNotes.length} items
            </span>
          </div>

          <div className="space-y-2">
            {recentNotes.length === 0 && (
              <p className="text-xs text-neutral/60">
                No notes yet. Capture your thoughts before they disappear.
              </p>
            )}

            {recentNotes.map((note) => (
              <Link
                key={note.id}
                href="/notes"
                className="block rounded-xl border border-base-300/40 bg-base-300/40 px-3 py-2 text-xs hover:border-primary/60 hover:bg-base-300/80 transition"
              >
                <p className="font-medium text-neutral line-clamp-1">
                  {note.title}
                </p>
                <p className="mt-0.5 text-[11px] text-neutral/60 line-clamp-2">
                  {note.content}
                </p>
                <p className="mt-1 text-[10px] text-neutral/50">
                  Updated {formatShortDateTime(note.updatedAt)}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Upcoming plans (filtered by focus) */}
        <div className="rounded-2xl border border-base-300/60 bg-base-200/70 p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
                <CalendarClock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-neutral">
                  Upcoming Plans
                </h2>
                <p className="text-[11px] text-neutral/60">
                  Next few items in your planner.
                </p>
              </div>
            </div>
            <span className="text-[11px] text-neutral/60">
              {visiblePlans.length} items
            </span>
          </div>

          <div className="space-y-2">
            {visiblePlans.length === 0 && (
              <p className="text-xs text-neutral/60">
                No upcoming plans in this focus view.
              </p>
            )}

            {visiblePlans.map((plan) => (
              <Link
                key={plan.id}
                href="/planner"
                className="block rounded-xl border border-base-300/40 bg-base-300/40 px-3 py-2 text-xs hover:border-primary/60 hover:bg-base-300/80 transition"
              >
                <p className="font-medium text-neutral line-clamp-1">
                  {plan.title}
                </p>
                {plan.description && (
                  <p className="mt-0.5 text-[11px] text-neutral/60 line-clamp-2">
                    {plan.description}
                  </p>
                )}
                <p className="mt-0.5 text-[11px] text-neutral/60">
                  {formatShortDateTime(plan.startsAt)}
                  {plan.endsAt && <> – {formatTime(plan.endsAt)}</>}
                </p>
                <p className="mt-1 text-[10px] text-neutral/50">
                  Importance: {formatImportance(plan.importance)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

// ===== local helper fns (client-safe) =====

function formatStatus(status: string) {
  switch (status) {
    case "TODO":
      return "To do";
    case "IN_PROGRESS":
      return "In progress";
    case "DONE":
      return "Done";
    default:
      return status;
  }
}

function formatImportance(importance: string) {
  switch (importance) {
    case "HIGH":
      return "High";
    case "MEDIUM":
      return "Medium";
    case "LOW":
      return "Low";
    default:
      return importance;
  }
}

function formatShortDateTime(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}
