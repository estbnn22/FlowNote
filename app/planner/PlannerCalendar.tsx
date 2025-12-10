"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PlanEvent = {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  importance: string | any;
  completed: boolean;
};

type TodoEvent = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  importance: string | any;
  status: string;
};

type HabitEvent = {
  id: string;
  title: string;
  description: string | null;
  frequency: string; // "DAILY" | "WEEKLY" | "MONTHLY"
  daysOfWeek: number[];
  color: string | null;
  createdAt: string;
};

type PlannerCalendarProps = {
  plans: PlanEvent[];
  todos: TodoEvent[];
  habits: HabitEvent[];
};

type PlannerFilter = "ALL" | "PLANS" | "TODOS" | "HABITS";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfGrid(date: Date) {
  const first = startOfMonth(date);
  const day = first.getDay(); // 0 (Sun) - 6 (Sat)
  const diff = -day;
  return new Date(first.getFullYear(), first.getMonth(), first.getDate() + diff);
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isHabitActiveOnDate(habit: HabitEvent, day: Date): boolean {
  const created = new Date(habit.createdAt);
  if (day < created) return false;

  if (habit.frequency === "DAILY") return true;

  if (habit.frequency === "WEEKLY") {
    const weekday = day.getDay(); // 0-6
    return habit.daysOfWeek.includes(weekday);
  }

  // MONTHLY: show on the same day-of-month as creation
  if (habit.frequency === "MONTHLY") {
    return day.getDate() === created.getDate();
  }

  return false;
}

const HABIT_COLOR_CLASSES = [
  "bg-emerald-500/85",
  "bg-sky-500/85",
  "bg-violet-500/85",
  "bg-amber-400/90 text-black",
  "bg-rose-500/85",
  "bg-teal-500/85",
  "bg-lime-500/85 text-black",
];

function getHabitColorClass(habit: HabitEvent, index: number): string {
  if (habit.color) {
    if (habit.color.startsWith("bg-")) return habit.color;
  }

  return HABIT_COLOR_CLASSES[index % HABIT_COLOR_CLASSES.length];
}

function formatTime(date: Date | null) {
  if (!date) return "";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function PlannerCalendar({ plans, todos, habits }: PlannerCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [filter, setFilter] = useState<PlannerFilter>("ALL");
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const gridDays = useMemo(() => {
    const start = startOfGrid(currentMonth);
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      days.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
    }
    return days;
  }, [currentMonth]);

  const monthLabel = useMemo(
    () =>
      currentMonth.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      }),
    [currentMonth]
  );

  const today = new Date();

  function handlePrevMonth() {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  }

  function handleNextMonth() {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  }

  function getEventsForDay(day: Date) {
    const dayEvents: {
      type: "PLAN" | "TODO" | "HABIT";
      id: string;
      title: string;
      description: string | null;
      colorClass?: string;
      subtle?: boolean;
    }[] = [];

    // plans
    if (filter === "ALL" || filter === "PLANS") {
      for (const p of plans) {
        const start = new Date(p.startsAt);
        const end = p.endsAt ? new Date(p.endsAt) : start;
        if (day >= start && day <= end) {
          dayEvents.push({
            type: "PLAN",
            id: p.id,
            title: p.title,
            description: p.description,
            subtle: p.completed,
          });
        }
      }
    }

    // todos
    if (filter === "ALL" || filter === "TODOS") {
      for (const t of todos) {
        if (!t.dueDate) continue;
        const due = new Date(t.dueDate);
        if (isSameDay(day, due)) {
          dayEvents.push({
            type: "TODO",
            id: t.id,
            title: t.title,
            description: t.description,
            subtle: t.status === "COMPLETED",
          });
        }
      }
    }

    // habits
    if (filter === "ALL" || filter === "HABITS") {
      habits.forEach((h, index) => {
        if (isHabitActiveOnDate(h, day)) {
          dayEvents.push({
            type: "HABIT",
            id: h.id,
            title: h.title,
            description: h.description,
            colorClass: getHabitColorClass(h, index),
          });
        }
      });
    }

    return dayEvents;
  }

  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return [];

    const events: {
      type: "PLAN" | "TODO" | "HABIT";
      title: string;
      description: string | null;
      start: Date | null;
      end: Date | null;
      label: string;
    }[] = [];

    // Plans
    plans.forEach((p) => {
      const start = new Date(p.startsAt);
      const end = p.endsAt ? new Date(p.endsAt) : null;
      if (isSameDay(start, selectedDay)) {
        events.push({
          type: "PLAN",
          title: p.title,
          description: p.description,
          start,
          end,
          label: `${formatTime(start)}${end ? " – " + formatTime(end) : ""}`,
        });
      }
    });

    // To-Dos (due at time)
    todos.forEach((t) => {
      if (!t.dueDate) return;
      const due = new Date(t.dueDate);
      if (isSameDay(due, selectedDay)) {
        events.push({
          type: "TODO",
          title: t.title,
          description: t.description,
          start: due,
          end: null,
          label: `Due at ${formatTime(due)}`,
        });
      }
    });

    // Habits (all-day)
    habits.forEach((h) => {
      if (isHabitActiveOnDate(h, selectedDay)) {
        events.push({
          type: "HABIT",
          title: h.title,
          description: h.description,
          start: null,
          end: null,
          label: "All day habit",
        });
      }
    });

    // sort by time (habits last)
    events.sort((a, b) => {
      if (!a.start && !b.start) return 0;
      if (!a.start) return 1;
      if (!b.start) return -1;
      return a.start.getTime() - b.start.getTime();
    });

    return events;
  }, [selectedDay, plans, todos, habits]);

  return (
    <div className="space-y-4">
      {/* Header + filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="btn btn-ghost btn-xs rounded-full border border-base-300/70"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-50">
              {monthLabel}
            </span>
            <span className="text-[11px] text-neutral/60">
              Plan tasks, to-dos, and habits in one view.
            </span>
          </div>
          <button
            type="button"
            onClick={handleNextMonth}
            className="btn btn-ghost btn-xs rounded-full border border-base-300/70"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 text-[11px]">
          {[
            { key: "ALL", label: "All" },
            { key: "PLANS", label: "Plans" },
            { key: "TODOS", label: "To-Dos" },
            { key: "HABITS", label: "Habits" },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key as PlannerFilter)}
              className={`rounded-full px-3 py-1 border text-[11px] transition ${
                filter === f.key
                  ? "border-primary bg-primary/90 text-black"
                  : "border-base-300 bg-base-200/60 text-neutral/70 hover:bg-base-300/70 hover:text-slate-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-[10px] text-neutral/60">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-primary" />
          Plan
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-sky-400" />
          To-Do
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Habit
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm border border-dashed border-base-300" />
          Today
        </span>
      </div>

      {/* Calendar grid */}
      <div className="overflow-hidden rounded-2xl border border-base-300/70 bg-base-200/70">
        <div className="grid grid-cols-7 border-b border-base-300/70 bg-base-300/40 text-[11px] text-neutral/70">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="px-2 py-2 text-center">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 text-xs">
          {gridDays.map((day, idx) => {
            const inCurrentMonth = day.getMonth() === currentMonth.getMonth();
            const isToday = isSameDay(day, today);
            const events = getEventsForDay(day);

            return (
              <div
                key={day.toISOString() + idx}
                onClick={() => setSelectedDay(day)}
                className={`min-h-[80px] cursor-pointer border-t border-r border-base-300/40 p-1.5 align-top ${
                  idx % 7 === 0 ? "border-l" : ""
                } ${
                  inCurrentMonth
                    ? "bg-base-200/70"
                    : "bg-base-200/20 text-neutral/50"
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                      isToday
                        ? "border border-dashed border-base-100 bg-base-300/70 text-slate-50"
                        : "text-neutral/70"
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  {events.length > 0 && (
                    <span className="text-[9px] text-neutral/50">
                      {events.length} item{events.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                <div className="space-y-0.5">
                  {events.slice(0, 3).map((ev) => {
                    if (ev.type === "HABIT") {
                      return (
                        <div
                          key={ev.id}
                          className={`truncate rounded-md px-1 py-0.5 text-[10px] font-medium shadow-sm ${
                            ev.colorClass ?? "bg-emerald-500/80"
                          }`}
                        >
                          {ev.title}
                        </div>
                      );
                    }

                    if (ev.type === "TODO") {
                      return (
                        <div
                          key={ev.id}
                          className={`truncate rounded-md border border-sky-500/40 bg-sky-500/15 px-1 py-0.5 text-[10px] ${
                            ev.subtle ? "opacity-60 line-through" : ""
                          }`}
                        >
                          ✅ {ev.title}
                        </div>
                      );
                    }

                    // PLAN
                    return (
                      <div
                        key={ev.id}
                        className={`truncate rounded-md border border-primary/40 bg-primary/15 px-1 py-0.5 text-[10px] ${
                          ev.subtle ? "opacity-60 line-through" : ""
                        }`}
                      >
                        📅 {ev.title}
                      </div>
                    );
                  })}

                  {events.length > 3 && (
                    <div className="text-[10px] text-neutral/60">
                      +{events.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected day timeline */}
      {selectedDay && (
        <div className="mt-4 rounded-2xl border border-base-300/70 bg-base-200/80 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-50">
                {selectedDay.toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </h3>
              <p className="text-[11px] text-neutral/60">
                Timeline of plans, to-dos, and habits for this day.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDay(null)}
              className="btn btn-ghost btn-xs rounded-full border border-base-300/70 text-[10px]"
            >
              Close
            </button>
          </div>

          {selectedDayEvents.length === 0 ? (
            <p className="text-[11px] text-neutral/60">
              Nothing scheduled for this day yet.
            </p>
          ) : (
            <div className="space-y-2">
              {selectedDayEvents.map((ev, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-xl border border-base-300/70 bg-base-300/40 px-3 py-2 text-[11px]"
                >
                  <div className="mt-[2px] w-16 flex-shrink-0 text-right text-neutral/60">
                    {ev.start ? ev.label : "All day"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] ${
                          ev.type === "PLAN"
                            ? "bg-primary text-black"
                            : ev.type === "TODO"
                            ? "bg-sky-400 text-black"
                            : "bg-emerald-400 text-black"
                        }`}
                      >
                        {ev.type === "PLAN"
                          ? "P"
                          : ev.type === "TODO"
                          ? "T"
                          : "H"}
                      </span>
                      <span className="font-medium text-slate-50">
                        {ev.title}
                      </span>
                    </div>
                    {ev.description && (
                      <p className="mt-0.5 text-[10px] text-neutral/60">
                        {ev.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}