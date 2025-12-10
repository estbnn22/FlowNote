"use client";

import { useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  ListChecks,
  NotebookTabs,
  Flame,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";

type DashboardTodo = {
  id: string;
  title: string;
  status: string;
  importance: string;
  dueAt: string | null;
};

type DashboardNote = {
  id: string;
  title: string | null;
  content: string | null;
  updatedAt: string;
};

type DashboardPlan = {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  importance: string;
};

type DashboardHabit = {
  id: string;
  title: string;
  description: string | null;
  frequency: string;
  color: string | null;
};

type DashboardClientProps = {
  userName: string;
  todos: DashboardTodo[];
  recentNotes: DashboardNote[];  
  upcomingPlans: DashboardPlan[];
  completionRate: number;
  totalTodos: number;
  todayOpenTodos: number;
  overdueTodos: number;
  todayPlansCount: number;
  habitsToday: DashboardHabit[];
  totalHabits: number;
  toggleTodoAction: (formData: FormData) => void;
  quickAddTodoAction: (formData: FormData) => void;
};

function formatTimeLabel(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDateLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

const importanceBadgeClasses: Record<string, string> = {
  HIGH: "badge-error/90 text-xs",
  MEDIUM: "badge-warning/90 text-xs",
  LOW: "badge-success/90 text-xs",
};

export default function DashboardClient({
  userName,
  todos,
  recentNotes,
  upcomingPlans,
  completionRate,
  totalTodos,
  todayOpenTodos,
  overdueTodos,
  todayPlansCount,
  habitsToday,
  totalHabits,
  toggleTodoAction,
  quickAddTodoAction,
}: DashboardClientProps) {
  const router = useRouter();

  const safeCompletion = Math.min(100, Math.max(0, completionRate ?? 0));

  // Local "done today" state for habits (visual only on dashboard)
  const [completedHabitIds, setCompletedHabitIds] = useState<Set<string>>(
    () => new Set()
  );

  function toggleHabitLocal(id: string) {
    setCompletedHabitIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <section className="rounded-3xl border border-base-300/70 bg-gradient-to-br from-base-200/90 via-base-200/80 to-primary/10 p-5 shadow-md">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-primary/80">
              Overview
            </p>
            <h1 className="text-xl font-semibold text-slate-50">
              Welcome back, <span className="text-primary">{userName}</span>
            </h1>
            <p className="mt-1 max-w-md text-[11px] text-neutral/60">
              Here&apos;s a snapshot of your tasks, plans, notes, and habits for
              today. Use this dashboard as your daily command center.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            {/* Completion donut */}
            <div className="relative h-16 w-16">
              <svg
                className="h-16 w-16 -rotate-90 text-base-300"
                viewBox="0 0 36 36"
              >
                <path
                  className="stroke-current"
                  strokeWidth="4"
                  fill="none"
                  d="M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32"
                />
              </svg>
              <svg
                className="absolute inset-0 h-16 w-16 -rotate-90 text-primary"
                viewBox="0 0 36 36"
              >
                <path
                  className="stroke-current"
                  strokeWidth="4"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={`${safeCompletion}, 100`}
                  d="M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-[10px]">
                <span className="font-semibold text-slate-50">
                  {safeCompletion}%
                </span>
                <span className="text-[9px] text-neutral/60">Done</span>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div
                className="rounded-xl bg-base-300/60 px-3 py-2 cursor-pointer border border-transparent transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/60 hover:bg-base-300/80"
                onClick={() => router.push("/todos")}
              >
                <div className="flex items-center gap-1 text-neutral/60">
                  <ListChecks className="h-3 w-3" />
                  <span>Open today</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-50">
                  {todayOpenTodos}
                </p>
              </div>
              <div
                className="rounded-xl bg-base-300/60 px-3 py-2 cursor-pointer border border-transparent transition-all duration-150 hover:-translate-y-0.5 hover:border-error/70 hover:bg-base-300/80"
                onClick={() => router.push("/todos")}
              >
                <div className="flex items-center gap-1 text-neutral/60">
                  <AlertTriangle className="h-3 w-3 text-error/90" />
                  <span>Overdue</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-error-300">
                  {overdueTodos}
                </p>
              </div>
              <div
                className="rounded-xl bg-base-300/60 px-3 py-2 cursor-pointer border border-transparent transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/60 hover:bg-base-300/80"
                onClick={() => router.push("/planner")}
              >
                <div className="flex items-center gap-1 text-neutral/60">
                  <CalendarDays className="h-3 w-3" />
                  <span>Today&apos;s plans</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-50">
                  {todayPlansCount}
                </p>
              </div>
              <div
                className="rounded-xl bg-base-300/60 px-3 py-2 cursor-pointer border border-transparent transition-all duration-150 hover:-translate-y-0.5 hover:border-amber-400/70 hover:bg-base-300/80"
                onClick={() => router.push("/habits")}
              >
                <div className="flex items-center gap-1 text-neutral/60">
                  <Flame className="h-3 w-3 text-amber-400" />
                  <span>Active habits</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-amber-300">
                  {habitsToday.length}/{totalHabits}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main grid */}
      <section className="grid gap-4 md:grid-cols-3">
        {/* Left column: Today focus */}
        <div className="space-y-4 md:col-span-2">
          {/* Today&apos;s focus / todos */}
          <div className="rounded-2xl border border-base-300/70 bg-base-200/80 p-4 shadow-sm">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-50">
                  Today&apos;s focus
                </h2>
                <p className="text-[11px] text-neutral/60">
                  Your top to-dos sorted by importance and recency.
                </p>
              </div>

              {/* Quick add todo */}
              <form
                action={quickAddTodoAction}
                className="flex w-full flex-col gap-2 text-[11px] sm:w-auto sm:flex-row"
              >
                <div className="flex-1">
                  <input
                    name="title"
                    type="text"
                    placeholder="Quick add a to-do..."
                    className="w-full rounded-lg border border-base-300 bg-base-300/60 px-3 py-1.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-primary/60"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select
                    name="importance"
                    defaultValue="MEDIUM"
                    className="select select-xs rounded-lg border-base-300 bg-base-300/70 text-[11px]"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                  <button
                    type="submit"
                    className="btn btn-xs rounded-full border-none bg-primary text-[11px] text-black"
                  >
                    <Plus className="h-3 w-3" />
                    Add
                  </button>
                </div>
              </form>
            </div>

            {todos.length === 0 ? (
              <p className="text-[11px] text-neutral/60">
                No to-dos yet. Create one from here or the To-Do page to see it.
              </p>
            ) : (
              <ul className="space-y-2">
                {todos.map((todo) => {
                  const dueLabel = todo.dueAt
                    ? formatTimeLabel(todo.dueAt)
                    : null;
                  const badgeClass =
                    importanceBadgeClasses[todo.importance] ??
                    "badge-neutral/80 text-xs";

                  const statusLabel =
                    todo.status === "DONE"
                      ? "Done"
                      : todo.status === "IN_PROGRESS"
                      ? "In progress"
                      : "To do";

                  const isDone = todo.status === "DONE";

                  return (
                    <li
                      key={todo.id}
                      className="flex items-start gap-3 rounded-xl border border-base-300/70 bg-base-300/40 px-3 py-2 text-[11px] cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/70 hover:bg-base-300/70"
                      onClick={() => router.push("/todos")}
                    >
                      {/* Toggle status */}
                      <form action={toggleTodoAction}>
                        <input type="hidden" name="id" value={todo.id} />
                        <input
                          type="hidden"
                          name="currentStatus"
                          value={todo.status}
                        />
                        <button
                          type="submit"
                          onClick={(e) => e.stopPropagation()}
                          className="mt-0.5 rounded-full p-0.5 hover:bg-base-200/80"
                          aria-label="Toggle to-do status"
                        >
                          <CheckCircle2
                            className={`h-4 w-4 ${
                              isDone ? "text-emerald-400" : "text-neutral-500"
                            }`}
                          />
                        </button>
                      </form>

                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={`text-[11px] ${
                              isDone
                                ? "text-neutral-500 line-through"
                                : "text-slate-50"
                            }`}
                          >
                            {todo.title}
                          </p>
                          <div className="flex items-center gap-1">
                            <span className={`badge ${badgeClass}`}>
                              {todo.importance}
                            </span>
                            <span className="rounded-full bg-base-100/70 px-2 py-0.5 text-[10px] text-neutral/60">
                              {statusLabel}
                            </span>
                          </div>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-neutral/60">
                          {dueLabel && (
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              <span>Due {dueLabel}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Upcoming plans */}
          <div className="rounded-2xl border border-base-300/70 bg-base-200/80 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-50">
                  Upcoming plans
                </h2>
                <p className="text-[11px] text-neutral/60">
                  Your next scheduled time blocks.
                </p>
              </div>
            </div>

            {upcomingPlans.length === 0 ? (
              <p className="text-[11px] text-neutral/60">
                No upcoming plans. Add one from the Planner page.
              </p>
            ) : (
              <ul className="space-y-2">
                {upcomingPlans.map((plan) => {
                  const startLabel = formatTimeLabel(plan.startsAt);
                  const dateLabel = formatDateLabel(plan.startsAt);

                  return (
                    <li
                      key={plan.id}
                      className="flex items-start gap-3 rounded-xl border border-base-300/70 bg-base-300/40 px-3 py-2 text-[11px] cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/70 hover:bg-base-300/70"
                      onClick={() => router.push("/planner")}
                    >
                      <div className="mt-0.5">
                        <CalendarDays className="h-4 w-4 text-primary/80" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-[11px] font-medium text-slate-50">
                              {plan.title}
                            </p>
                            {plan.description && (
                              <p className="mt-0.5 line-clamp-2 text-[10px] text-neutral/60">
                                {plan.description}
                              </p>
                            )}
                          </div>
                          <div className="text-right text-[10px] text-neutral/60">
                            <p>{dateLabel}</p>
                            {startLabel && <p>{startLabel}</p>}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Right column: habits + notes */}
        <div className="space-y-4">
          {/* Habits */}
          <div className="rounded-2xl border border-base-300/70 bg-base-200/80 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-50">
                  Today&apos;s habits
                </h2>
                <p className="text-[11px] text-neutral/60">
                  Quickly tick off habits as you complete them today.
                </p>
              </div>
            </div>

            {habitsToday.length === 0 ? (
              <p className="text-[11px] text-neutral/60">
                No active habits today. Create a habit from the Habits page to
                see it here.
              </p>
            ) : (
              <ul className="space-y-2">
                {habitsToday.map((habit) => {
                  const done = completedHabitIds.has(habit.id);

                  return (
                    <li
                      key={habit.id}
                      className={`flex items-start gap-3 rounded-xl border border-base-300/70 bg-base-300/40 px-3 py-2 text-[11px] cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:border-amber-400/70 hover:bg-base-300/70 ${
                        done ? "opacity-80" : ""
                      }`}
                      onClick={() => router.push("/habits")}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleHabitLocal(habit.id);
                        }}
                        className="mt-0.5 rounded-full p-0.5 hover:bg-base-200/80"
                        aria-label="Toggle habit done for today"
                      >
                        <Flame
                          className={`h-4 w-4 ${
                            done
                              ? "text-amber-300"
                              : habit.color?.includes("amber")
                              ? "text-amber-300"
                              : "text-emerald-300"
                          }`}
                        />
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={`text-[11px] font-medium ${
                              done
                                ? "text-neutral-400 line-through"
                                : "text-slate-50"
                            }`}
                          >
                            {habit.title}
                          </p>
                          <span className="rounded-full bg-base-100/70 px-2 py-0.5 text-[10px] text-neutral/60">
                            {habit.frequency}
                          </span>
                        </div>
                        {habit.description && (
                          <p className="mt-0.5 line-clamp-2 text-[10px] text-neutral/60">
                            {habit.description}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Recent notes */}
          <div className="rounded-2xl border border-base-300/70 bg-base-200/80 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-50">
                  Recent notes
                </h2>
                <p className="text-[11px] text-neutral/60">
                  A quick peek at what you&apos;ve been writing.
                </p>
              </div>
              <NotebookTabs className="h-4 w-4 text-neutral/60" />
            </div>

            {recentNotes.length === 0 ? (
              <p className="text-[11px] text-neutral/60">
                No notes yet. Add one from the Notes page.
              </p>
            ) : (
              <ul className="space-y-2">
                {recentNotes.map((note) => (
                  <li
                    key={note.id}
                    className="rounded-xl border border-base-300/70 bg-base-300/40 px-3 py-2 text-[11px] cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/70 hover:bg-base-300/70"
                    onClick={() => router.push("/notes")}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="line-clamp-1 text-[11px] font-medium text-slate-50">
                        {note.title || "Untitled note"}
                      </p>
                      <span className="text-[10px] text-neutral/60">
                        {formatDateLabel(note.updatedAt)}
                      </span>
                    </div>
                    {note.content && (
                      <p className="mt-0.5 line-clamp-2 text-[10px] text-neutral/60">
                        {note.content}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}