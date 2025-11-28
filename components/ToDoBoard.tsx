// components/TodoBoard.tsx
"use client";

import { useState, DragEvent, useTransition } from "react";
import {
  Clock3,
  Zap,
  CheckCircle2,
  CircleDot,
  CalendarClock,
} from "lucide-react";
import {
  updateTodo,
  deleteTodo,
  toggleTodoStatus,
  moveTodo,
  ImportanceValue,
  StatusValue,
} from "@/app/actions/todos/actions";

type Todo = {
  id: string;
  title: string;
  importance: ImportanceValue;
  status: StatusValue;
  dueAt: string | null;
};

type Props = {
  initialTodos: Todo[];
  savedId?: string;
};

const importanceOrder: ImportanceValue[] = ["HIGH", "MEDIUM", "LOW"];

export default function TodoBoard({ initialTodos, savedId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [todos, setTodos] = useState<Todo[]>(initialTodos);

  const grouped = {
    HIGH: todos.filter((t) => t.importance === "HIGH"),
    MEDIUM: todos.filter((t) => t.importance === "MEDIUM"),
    LOW: todos.filter((t) => t.importance === "LOW"),
  };

  function handleDragStart(e: DragEvent<HTMLDivElement>, id: string) {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(
    e: DragEvent<HTMLDivElement>,
    targetImportance: ImportanceValue
  ) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;

    setTodos((prev) => {
      const existing = prev.find((t) => t.id === id);
      if (!existing || existing.importance === targetImportance) return prev;
      const updated: Todo = { ...existing, importance: targetImportance };
      return prev.map((t) => (t.id === id ? updated : t));
    });

    startTransition(() => moveTodo(id, targetImportance));
  }

  function getStatusIcon(status: StatusValue) {
    switch (status) {
      case "IN_PROGRESS":
        return <Zap className="h-3 w-3" />;
      case "DONE":
        return <CheckCircle2 className="h-3 w-3" />;
      case "TODO":
      default:
        return <Clock3 className="h-3 w-3" />;
    }
  }

  function getStatusClasses(status: StatusValue) {
    switch (status) {
      case "IN_PROGRESS":
        return "bg-info/20 text-info";
      case "DONE":
        return "bg-success/20 text-success";
      case "TODO":
      default:
        return "bg-warning/15 text-warning";
    }
  }

  function getStatusLabel(status: StatusValue) {
    switch (status) {
      case "IN_PROGRESS":
        return "In Progress";
      case "DONE":
        return "Done";
      case "TODO":
      default:
        return "To-Do";
    }
  }

  function getNextStatusLabel(status: StatusValue) {
    switch (status) {
      case "TODO":
        return "Start";
      case "IN_PROGRESS":
        return "Complete";
      case "DONE":
      default:
        return "Reset";
    }
  }

  function getDueInfo(dueAt: string | null) {
    if (!dueAt) return null;
    const dueDate = new Date(dueAt);
    const now = new Date();
    const oneDayMs = 1000 * 60 * 60 * 24;

    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const startOfDue = new Date(
      dueDate.getFullYear(),
      dueDate.getMonth(),
      dueDate.getDate()
    );

    const diffDays = Math.round(
      (startOfDue.getTime() - startOfToday.getTime()) / oneDayMs
    );

    if (diffDays < 0) {
      return {
        label: `Overdue by ${Math.abs(diffDays)}d`,
        tone: "error" as const,
      };
    }
    if (diffDays === 0) {
      return { label: "Due today", tone: "warning" as const };
    }
    if (diffDays === 1) {
      return { label: "Due tomorrow", tone: "info" as const };
    }
    return { label: `Due in ${diffDays}d`, tone: "info" as const };
  }

  function getDueClasses(tone: "error" | "warning" | "info") {
    switch (tone) {
      case "error":
        return "bg-error/15 text-error";
      case "warning":
        return "bg-warning/15 text-warning";
      case "info":
      default:
        return "bg-info/15 text-info";
    }
  }

  return (
    <section className="grid gap-6 md:grid-cols-3">
      {importanceOrder.map((imp) => {
        const group =
          imp === "HIGH"
            ? grouped.HIGH
            : imp === "MEDIUM"
            ? grouped.MEDIUM
            : grouped.LOW;

        const title =
          imp === "HIGH"
            ? "High Priority"
            : imp === "MEDIUM"
            ? "Medium Priority"
            : "Low Priority";

        const titleColor =
          imp === "HIGH"
            ? "text-error"
            : imp === "MEDIUM"
            ? "text-warning"
            : "text-success";

        return (
          <div
            key={imp}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, imp)}
            className="space-y-3 rounded-2xl border border-base-300/40 bg-base-200/40 p-3 transition-colors duration-200"
          >
            <div className="flex items-center justify-between mb-1">
              <h2
                className={`text-sm font-semibold flex items-center gap-1 ${titleColor}`}
              >
                <CircleDot className="h-3 w-3" />
                {title}
              </h2>
              <span className="text-[11px] text-neutral/60">
                {group.length} tasks
              </span>
            </div>

            {group.length === 0 ? (
              <p className="text-xs text-neutral/60">
                Drop tasks here to prioritize.
              </p>
            ) : (
              <div className="space-y-3">
                {group.map((todo) => {
                  const isDone = todo.status === "DONE";
                  const dueInfo = getDueInfo(todo.dueAt);

                  return (
                    <article
                      key={todo.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, todo.id)}
                      className="rounded-2xl border border-base-300/60 bg-base-200/70 p-3 text-xs shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      {/* Edit form */}
                      <form action={updateTodo} className="space-y-2">
                        <input type="hidden" name="id" value={todo.id} />
                        <input
                          type="hidden"
                          name="currentStatus"
                          value={todo.status}
                        />

                        {/* Checkbox + title + status badge */}
                        <div className="flex items-start gap-2">
                          <label className="flex flex-1 items-center gap-2">
                            <input
                              type="checkbox"
                              name="completed"
                              defaultChecked={isDone}
                              className="checkbox checkbox-xs checkbox-success"
                              onChange={(e) => {
                                e.currentTarget.form?.requestSubmit();
                              }}
                            />
                            <input
                              name="title"
                              defaultValue={todo.title}
                              className={`w-full rounded-lg bg-base-300/60 px-2 py-1 text-xs focus:outline-none focus:border-primary/60 transition-all duration-200 ${
                                isDone ? "line-through text-neutral/50" : ""
                              }`}
                            />
                          </label>

                          <span
                            className={`ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusClasses(
                              todo.status
                            )} transition-colors duration-200`}
                          >
                            {getStatusIcon(todo.status)}
                            {getStatusLabel(todo.status)}
                          </span>
                        </div>

                        {/* Importance + due date */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-[11px] text-neutral/60">
                            <span>Importance:</span>
                            <select
                              name="importance"
                              defaultValue={todo.importance}
                              className="rounded-lg bg-base-300/60 px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary/60"
                            >
                              <option value="LOW">Low</option>
                              <option value="MEDIUM">Medium</option>
                              <option value="HIGH">High</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-neutral/60">
                            <CalendarClock className="h-3 w-3" />
                            <input
                              type="datetime-local"
                              name="dueAt"
                              defaultValue={
                                todo.dueAt
                                  ? new Date(todo.dueAt)
                                      .toISOString()
                                      .slice(0, 16)
                                  : ""
                              }
                              className="rounded-lg bg-base-300/60 px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary/60"
                            />
                          </div>
                        </div>

                        {/* Buttons row */}
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="submit"
                              className="rounded-lg bg-primary/90 px-3 py-1 text-[11px] font-semibold text-primary-content hover:bg-primary-focus transition"
                            >
                              Save
                            </button>

                            {savedId === todo.id && (
                              <span className="text-success text-[11px] font-semibold">
                                Saved!
                              </span>
                            )}

                            {dueInfo && (
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${getDueClasses(
                                  dueInfo.tone
                                )}`}
                              >
                                <CalendarClock className="h-3 w-3" />
                                {dueInfo.label}
                              </span>
                            )}
                          </div>

                          <button
                            type="submit"
                            formAction={deleteTodo}
                            className="rounded-lg border border-error/60 bg-error/10 px-3 py-1 text-[11px] font-semibold text-error hover:bg-error/20 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </form>

                      {/* Status toggle form (Start / Complete / Reset) */}
                      <form
                        action={toggleTodoStatus}
                        className="mt-2 flex justify-end"
                      >
                        <input type="hidden" name="id" value={todo.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 text-[10px] rounded-md bg-base-300 px-3 py-1 hover:bg-base-200 transition"
                        >
                          <Zap className="h-3 w-3" />
                          {getNextStatusLabel(todo.status)}
                        </button>
                      </form>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
