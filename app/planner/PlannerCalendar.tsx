"use client";

import React, { useMemo, useState, CSSProperties } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Trash2,
  Edit3,
} from "lucide-react";
import {
  createPlanning,
  updatePlanningTime,
  deletePlanning,
  updatePlanningDetails,
  type PlanningDTO,
  type Importance,
  type Recurrence,
} from "../actions/planner/actions";

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";

type PlannerEvent = {
  id: string;
  title: string;
  description: string | null;
  startsAt: Date;
  endsAt: Date;
  importance: Importance;
  completed: boolean;
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type ViewMode = "WEEK" | "MONTH";

function getStartOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getStartOfMonth(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatHour(hour: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:00 ${suffix}`;
}

function formatTimeRange(start: Date, end: Date) {
  const opts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
  };
  return `${start.toLocaleTimeString(
    undefined,
    opts
  )} – ${end.toLocaleTimeString(undefined, opts)}`;
}

function addDays(date: Date, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function addMonths(date: Date, n: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

function dateFromWeekAndSlot(
  weekStart: Date,
  dayIndex: number,
  hour: number
): Date {
  const d = addDays(weekStart, dayIndex);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function isSameDay(d1: Date, d2: Date) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

const importanceStyles: Record<Importance, string> = {
  HIGH: "bg-error/15 border border-error/40",
  MEDIUM: "bg-primary/10 border border-primary/30",
  LOW: "bg-success/10 border border-success/30",
};

function getMonthMatrix(monthDate: Date): Date[][] {
  const startOfMonth = getStartOfMonth(monthDate);
  const startDayOfWeek = startOfMonth.getDay();
  const firstCell = addDays(startOfMonth, -startDayOfWeek);

  const weeks: Date[][] = [];
  let current = firstCell;

  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(current));
      current = addDays(current, 1);
    }
    weeks.push(week);
  }

  return weeks;
}

export function PlannerCalendar({
  initialPlans,
}: {
  initialPlans: PlanningDTO[];
}) {
  const today = new Date();

  // 🔁 Month is default view
  const [viewMode, setViewMode] = useState<ViewMode>("MONTH");
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    getStartOfWeek(today)
  );
  const [currentMonthDate, setCurrentMonthDate] = useState(() =>
    getStartOfMonth(today)
  );

  const [events, setEvents] = useState<PlannerEvent[]>(() =>
    initialPlans.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      startsAt: new Date(p.startsAt),
      // ⬅️ fix TS error: handle null endsAt by falling back
      endsAt: p.endsAt ? new Date(p.endsAt) : new Date(p.startsAt),
      importance: p.importance,
      completed: p.completed,
    }))
  );

  const [activeDayIndex, setActiveDayIndex] = useState(() => today.getDay());

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"CREATE" | "EDIT">("CREATE");
  const [selectedSlot, setSelectedSlot] = useState<{
    dayIndex: number;
    hour: number;
  } | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // Form fields
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImportance, setFormImportance] = useState<Importance>("MEDIUM");
  const [formRecurrence, setFormRecurrence] = useState<Recurrence>("NONE");
  const [formStartTime, setFormStartTime] = useState("09:00");
  const [formEndTime, setFormEndTime] = useState("10:00");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const weekDates = useMemo(
    () =>
      DAY_LABELS.map((_, idx) => {
        const d = addDays(currentWeekStart, idx);
        return {
          label: DAY_LABELS[idx],
          date: d,
          dateLabel: d.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          }),
          dayNumber: d.getDate(),
        };
      }),
    [currentWeekStart]
  );

  const monthMatrix = useMemo(
    () => getMonthMatrix(currentMonthDate),
    [currentMonthDate]
  );

  const activeDate = useMemo(
    () => addDays(currentWeekStart, activeDayIndex),
    [currentWeekStart, activeDayIndex]
  );

  // 👉 Only hours that actually have events for the active day
  const hoursWithEvents = useMemo(() => {
    const set = new Set<number>();
    events.forEach((ev) => {
      if (isSameDay(ev.startsAt, activeDate)) {
        set.add(ev.startsAt.getHours());
      }
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [events, activeDate]);

  function openCreateModal(dayIndex: number, hour: number) {
    setSelectedSlot({ dayIndex, hour });
    setModalMode("CREATE");
    setEditingEventId(null);
    setFormTitle("");
    setFormDescription("");
    setFormImportance("MEDIUM");
    setFormRecurrence("NONE");
    // default start/end around the clicked hour
    const start = String(hour).padStart(2, "0");
    const end = String(Math.min(hour + 1, 23)).padStart(2, "0");
    setFormStartTime(`${start}:00`);
    setFormEndTime(`${end}:00`);
    setIsModalOpen(true);
  }

  function openEditModal(ev: PlannerEvent) {
    setModalMode("EDIT");
    setEditingEventId(ev.id);
    setSelectedSlot(null);
    setFormTitle(ev.title);
    setFormDescription(ev.description ?? "");
    setFormImportance(ev.importance);
    setFormRecurrence("NONE");

    const sh = String(ev.startsAt.getHours()).padStart(2, "0");
    const sm = String(ev.startsAt.getMinutes()).padStart(2, "0");
    const eh = String(ev.endsAt.getHours()).padStart(2, "0");
    const em = String(ev.endsAt.getMinutes()).padStart(2, "0");
    setFormStartTime(`${sh}:${sm}`);
    setFormEndTime(`${eh}:${em}`);

    setIsModalOpen(true);
  }

  function parseTimeString(date: Date, timeStr: string) {
    const [hStr, mStr] = timeStr.split(":");
    const h = Number(hStr) || 0;
    const m = Number(mStr) || 0;
    const d = new Date(date);
    d.setHours(h, m, 0, 0);
    return d;
  }

  async function handleSubmitModal(e: React.FormEvent) {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (modalMode === "CREATE") {
      if (!selectedSlot) return;

      const baseDate = weekDates[selectedSlot.dayIndex].date;

      let startsAt = parseTimeString(baseDate, formStartTime);
      let endsAt = parseTimeString(baseDate, formEndTime);

      // Ensure end is after start; if not, force +1h
      if (endsAt <= startsAt) {
        endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);
      }

      const createdList = await createPlanning({
        title: formTitle.trim(),
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        description: formDescription.trim() || null,
        importance: formImportance,
        recurrence: formRecurrence,
      });

      setEvents((prev) => [
        ...prev,
        ...createdList.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          startsAt: new Date(p.startsAt),
          endsAt: p.endsAt ? new Date(p.endsAt) : new Date(p.startsAt),
          importance: p.importance,
          completed: p.completed,
        })),
      ]);
    } else if (modalMode === "EDIT" && editingEventId) {
      const existing = events.find((ev) => ev.id === editingEventId);
      if (!existing) return;

      const baseDate = existing.startsAt;
      let newStartsAt = parseTimeString(baseDate, formStartTime);
      let newEndsAt = parseTimeString(baseDate, formEndTime);
      if (newEndsAt <= newStartsAt) {
        newEndsAt = new Date(newStartsAt.getTime() + 60 * 60 * 1000);
      }

      // Title/description/importance
      const updated = await updatePlanningDetails({
        id: editingEventId,
        title: formTitle.trim(),
        description: formDescription.trim() || null,
        importance: formImportance,
      } as any);

      // Time (start/end)
      await updatePlanningTime({
        id: editingEventId,
        newStartsAt: newStartsAt.toISOString(),
        newEndsAt: newEndsAt.toISOString(),
      });

      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === updated.id
            ? {
                ...ev,
                title: updated.title,
                description: updated.description,
                importance: updated.importance,
                completed: updated.completed,
                startsAt: newStartsAt,
                endsAt: newEndsAt,
              }
            : ev
        )
      );
    }

    setIsModalOpen(false);
  }

  async function handleDelete(eventId: string) {
    const ok = window.confirm("Delete this plan?");
    if (!ok) return;

    setEvents((prev) => prev.filter((ev) => ev.id !== eventId));
    try {
      await deletePlanning(eventId);
    } catch (err) {
      console.error("Failed to delete plan", err);
    }
  }

  function eventsForSlot(dayIndex: number, hour: number) {
    const slotDate = addDays(currentWeekStart, dayIndex);
    return events.filter((ev) => {
      return (
        isSameDay(ev.startsAt, slotDate) && ev.startsAt.getHours() === hour // only show at START time
      );
    });
  }

  function eventsForDate(date: Date) {
    return events.filter((ev) => isSameDay(ev.startsAt, date));
  }

  function goToPrevious() {
    if (viewMode === "WEEK") {
      setCurrentWeekStart((prev) => addDays(prev, -7));
    } else {
      setCurrentMonthDate((prev) => addMonths(prev, -1));
    }
  }

  function goToNext() {
    if (viewMode === "WEEK") {
      setCurrentWeekStart((prev) => addDays(prev, 7));
    } else {
      setCurrentMonthDate((prev) => addMonths(prev, 1));
    }
  }

  function goToToday() {
    const t = new Date();
    if (viewMode === "WEEK") {
      setCurrentWeekStart(getStartOfWeek(t));
      setActiveDayIndex(t.getDay());
    } else {
      setCurrentMonthDate(getStartOfMonth(t));
      setCurrentWeekStart(getStartOfWeek(t));
      setActiveDayIndex(t.getDay());
    }
  }

  function clearAll() {
    if (confirm("Clear all plans from this view?")) {
      setEvents([]);
    }
  }

  function switchToMonth() {
    setViewMode("MONTH");
    setCurrentMonthDate(getStartOfMonth(currentWeekStart));
  }

  function switchToWeek() {
    setViewMode("WEEK");
    setCurrentWeekStart(getStartOfWeek(currentMonthDate));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const evId = active.id as string;
    const overId = String(over.id);
    const ev = events.find((e) => e.id === evId);
    if (!ev) return;

    const durationMs = ev.endsAt.getTime() - ev.startsAt.getTime();

    if (overId.startsWith("slot:")) {
      const [, dayStr, hourStr] = overId.split(":");
      const dayIdx = Number(dayStr);
      const hour = Number(hourStr);

      const newStartsAt = dateFromWeekAndSlot(currentWeekStart, dayIdx, hour);
      const newEndsAt = new Date(newStartsAt.getTime() + durationMs);

      setEvents((prev) =>
        prev.map((e) =>
          e.id === evId ? { ...e, startsAt: newStartsAt, endsAt: newEndsAt } : e
        )
      );

      updatePlanningTime({
        id: evId,
        newStartsAt: newStartsAt.toISOString(),
        newEndsAt: newEndsAt.toISOString(),
      }).catch((err) => console.error("Failed to update plan time", err));

      return;
    }

    if (overId.startsWith("day:")) {
      const [, dayStr] = overId.split(":");
      const dayIdx = Number(dayStr);

      const hour = ev.startsAt.getHours();
      const newStartsAt = dateFromWeekAndSlot(currentWeekStart, dayIdx, hour);
      const newEndsAt = new Date(newStartsAt.getTime() + durationMs);

      setEvents((prev) =>
        prev.map((e) =>
          e.id === evId ? { ...e, startsAt: newStartsAt, endsAt: newEndsAt } : e
        )
      );

      updatePlanningTime({
        id: evId,
        newStartsAt: newStartsAt.toISOString(),
        newEndsAt: newEndsAt.toISOString(),
      }).catch((err) =>
        console.error("Failed to move event between days", err)
      );

      return;
    }
  }

  const defaultCreateHour = 9;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-7 w-7 text-primary" />
            <h1 className="text-3xl font-bold">Planner</h1>
          </div>
          <p className="text-sm text-base-content/70">
            Month is the default view. Click a date to open the detailed week
            view. Plans have a start and end time and the block grows with the
            duration.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="join border border-base-300 bg-base-100 text-xs">
            <button
              type="button"
              onClick={switchToWeek}
              className={`join-item btn btn-xs ${
                viewMode === "WEEK"
                  ? "btn-primary text-primary-content"
                  : "btn-ghost"
              }`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={switchToMonth}
              className={`join-item btn btn-xs ${
                viewMode === "MONTH"
                  ? "btn-primary text-primary-content"
                  : "btn-ghost"
              }`}
            >
              Month
            </button>
          </div>

          <div className="join border border-base-300 bg-base-100 text-xs">
            <button
              type="button"
              onClick={goToPrevious}
              className="join-item btn btn-xs btn-ghost"
            >
              <ChevronLeft className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={goToToday}
              className="join-item btn btn-xs btn-ghost"
            >
              Today
            </button>
            <button
              type="button"
              onClick={goToNext}
              className="join-item btn btn-xs btn-ghost"
            >
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          <button
            type="button"
            className="btn btn-xs btn-ghost text-error"
            onClick={clearAll}
          >
            <Trash2 className="h-3 w-3" />
            Clear in UI
          </button>
        </div>
      </header>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-base-content/60">
        <div className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-primary/80" />
          <span>Planned activity</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>Drag to reschedule (time &amp; day)</span>
        </div>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        {/* ---- MONTH VIEW ---- */}
        {viewMode === "MONTH" && (
          <div className="space-y-4">
            {/* Month grid */}
            <div className="rounded-2xl border border-base-300 bg-base-100 shadow-sm">
              {/* ⬇️ removed min-w-[700px] so it fits on mobile without horizontal scroll */}
              <div className="w-full">
                {/* Weekday header */}
                <div className="grid grid-cols-7 border-b border-base-300 bg-base-200/70 text-center text-xs font-semibold uppercase tracking-wide text-base-content/70">
                  {DAY_LABELS.map((label) => (
                    <div key={label} className="px-1 py-2">
                      {label}
                    </div>
                  ))}
                </div>

                {/* Weeks */}
                <div className="grid grid-rows-6">
                  {monthMatrix.map((week, wIdx) => (
                    <div
                      key={wIdx}
                      className="grid grid-cols-7 border-b border-base-200 last:border-b-0"
                    >
                      {week.map((date, dIdx) => {
                        const inCurrentMonth =
                          date.getMonth() === currentMonthDate.getMonth();
                        const isTodayFlag = isSameDay(date, today);
                        const dateEvents = eventsForDate(date);
                        const isActive = isSameDay(
                          date,
                          addDays(currentWeekStart, activeDayIndex)
                        );

                        return (
                          <button
                            key={dIdx}
                            onClick={() => {
                              setCurrentWeekStart(getStartOfWeek(date));
                              setActiveDayIndex(date.getDay());
                              // ⬇️ automatically open week view when date is clicked
                              setViewMode("WEEK");
                            }}
                            className={`flex min-h-[72px] flex-col items-start border-r border-base-200 px-1 py-2 text-left text-[11px] last:border-r-0 transition ${
                              !inCurrentMonth
                                ? "bg-base-100/70 text-base-content/40"
                                : ""
                            } ${
                              isActive
                                ? "ring-2 ring-primary/60 ring-offset-2"
                                : ""
                            }`}
                          >
                            <div className="mb-1 flex w-full items-center justify-between">
                              <span
                                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                                  isTodayFlag
                                    ? "bg-primary text-primary-content"
                                    : "text-base-content"
                                }`}
                              >
                                {date.getDate()}
                              </span>
                              {dateEvents.length > 0 && (
                                <span className="text-[9px] text-base-content/60">
                                  {dateEvents.length} plan
                                  {dateEvents.length > 1 ? "s" : ""}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-col gap-0.5">
                              {dateEvents.slice(0, 3).map((ev) => (
                                <div
                                  key={ev.id}
                                  className={`line-clamp-1 rounded-md px-1 py-0.5 text-[9px] ${
                                    importanceStyles[ev.importance]
                                  } ${
                                    ev.completed
                                      ? "line-through opacity-60"
                                      : ""
                                  }`}
                                >
                                  {ev.title}
                                </div>
                              ))}
                              {dateEvents.length > 3 && (
                                <span className="text-[9px] text-base-content/50">
                                  +{dateEvents.length - 3} more
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Day details label (week agenda below is shared with week view) */}
            <div className="text-xs font-semibold text-base-content/70">
              Day details
            </div>
          </div>
        )}

        {/* ---- WEEK VIEW DAY STRIP (mobile) ---- */}
        <div className="flex gap-2 overflow-x-auto pb-1 md:hidden">
          {weekDates.map((day, idx) => (
            <DayPill
              key={idx}
              index={idx}
              day={day}
              today={today}
              activeDayIndex={activeDayIndex}
              setActiveDayIndex={setActiveDayIndex}
            />
          ))}
        </div>

        {/* Desktop week strip */}
        <div className="hidden grid-cols-7 gap-3 pb-2 md:grid">
          {weekDates.map((day, idx) => (
            <DayPill
              key={idx}
              index={idx}
              day={day}
              today={today}
              activeDayIndex={activeDayIndex}
              setActiveDayIndex={setActiveDayIndex}
              showDateLabel
            />
          ))}
        </div>

        {/* ---- AGENDA VIEW (only show hours that have events) ---- */}
        <div className="space-y-2 max-h-[70vh] overflow-y-auto">
          {hoursWithEvents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-base-300 bg-base-100 px-3 py-3 text-xs text-base-content/60 flex items-center justify-between">
              <span>No plans for this day yet.</span>
              <button
                type="button"
                className="btn btn-ghost btn-xs gap-1"
                onClick={() =>
                  openCreateModal(activeDayIndex, defaultCreateHour)
                }
              >
                <Plus className="h-3 w-3" />
                Add plan
              </button>
            </div>
          ) : (
            hoursWithEvents.map((hour) => {
              const slotEvents = eventsForSlot(activeDayIndex, hour);
              return (
                <TimeSlotRow
                  key={hour}
                  dayIndex={activeDayIndex}
                  hour={hour}
                  events={slotEvents}
                  openCreateModal={openCreateModal}
                  openEditModal={openEditModal}
                  handleDelete={handleDelete}
                />
              );
            })
          )}
        </div>
      </DndContext>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-base-100 p-6 shadow-lg">
            <h2 className="mb-2 flex items-center gap-2 text-xl font-semibold">
              {modalMode === "CREATE" ? (
                <>
                  <Plus className="h-5 w-5 text-primary" />
                  Add Plan
                </>
              ) : (
                <>
                  <Edit3 className="h-5 w-5 text-primary" />
                  Edit Plan
                </>
              )}
            </h2>
            {modalMode === "CREATE" && selectedSlot && (
              <p className="mb-2 text-xs text-base-content/70">
                {weekDates[selectedSlot.dayIndex].label},{" "}
                {weekDates[selectedSlot.dayIndex].dateLabel}
              </p>
            )}

            <form onSubmit={handleSubmitModal} className="space-y-4">
              {/* Title */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-sm">Title</span>
                </label>
                <input
                  autoFocus
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Deep work session"
                  className="input input-bordered w-full"
                />
              </div>

              {/* Description */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-sm">Description</span>
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Optional notes."
                  className="textarea textarea-bordered w-full"
                  rows={3}
                />
              </div>

              {/* Time range */}
              <div className="grid grid-cols-2 gap-3">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-sm">Start time</span>
                  </label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="input input-bordered input-sm w-full"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-sm">End time</span>
                  </label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="input input-bordered input-sm w-full"
                  />
                </div>
              </div>

              {/* Importance + Recurrence */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-sm">Importance</span>
                  </label>
                  <select
                    value={formImportance}
                    onChange={(e) =>
                      setFormImportance(e.target.value as Importance)
                    }
                    className="select select-bordered select-sm w-full"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-sm">Recurrence</span>
                  </label>
                  <select
                    value={formRecurrence}
                    onChange={(e) =>
                      setFormRecurrence(e.target.value as Recurrence)
                    }
                    className="select select-bordered select-sm w-full"
                  >
                    <option value="NONE">None</option>
                    <option value="DAILY">Daily (7 days)</option>
                    <option value="WEEKLY">Weekly (4 weeks)</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  {modalMode === "CREATE" ? "Save Plan(s)" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Day pill ---------- */

type DayPillProps = {
  index: number;
  day: {
    label: string;
    date: Date;
    dateLabel: string;
    dayNumber: number;
  };
  today: Date;
  activeDayIndex: number;
  setActiveDayIndex: (idx: number) => void;
  showDateLabel?: boolean;
};

function DayPill({
  index,
  day,
  today,
  activeDayIndex,
  setActiveDayIndex,
  showDateLabel,
}: DayPillProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `day:${index}` });

  const isSelected = index === activeDayIndex;
  const isTodayFlag = isSameDay(day.date, today);

  return (
    <button
      ref={setNodeRef}
      onClick={() => setActiveDayIndex(index)}
      className={`flex flex-col items-center rounded-2xl px-3 py-2 text-xs transition border ${
        isSelected
          ? "bg-primary text-primary-content shadow-sm border-primary"
          : "bg-base-100 text-base-content border-base-300"
      } ${isOver ? "ring-2 ring-primary/60" : ""}`}
    >
      <span className="font-semibold">{day.label}</span>
      <span
        className={`mt-1 flex h-7 w-7 items-center justify-center rounded-full text-sm ${
          isTodayFlag && !isSelected ? "border border-primary text-primary" : ""
        } ${isSelected ? "bg-primary-content text-primary" : ""}`}
      >
        {day.dayNumber}
      </span>
      {showDateLabel && (
        <span className="mt-1 text-[11px] text-base-content/60">
          {day.dateLabel}
        </span>
      )}
    </button>
  );
}

/* ---------- Time slot row & event card ---------- */

type TimeSlotRowProps = {
  dayIndex: number;
  hour: number;
  events: PlannerEvent[];
  openCreateModal: (dayIndex: number, hour: number) => void;
  openEditModal: (ev: PlannerEvent) => void;
  handleDelete: (id: string) => void;
};

function TimeSlotRow({
  dayIndex,
  hour,
  events,
  openCreateModal,
  openEditModal,
  handleDelete,
}: TimeSlotRowProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot:${dayIndex}:${hour}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border border-base-300 bg-base-100 px-3 py-2 shadow-sm transition-colors ${
        isOver ? "border-primary/70 bg-base-200" : ""
      }`}
    >
      <div className="mb-1 flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs font-semibold text-base-content/80">
          <Clock className="h-3 w-3" />
          {formatHour(hour)}
        </span>
        <button
          type="button"
          onClick={() => openCreateModal(dayIndex, hour)}
          className="btn btn-ghost btn-xs gap-1"
        >
          <Plus className="h-3 w-3" />
          Add
        </button>
      </div>
      {events.length === 0 ? (
        <p className="text-[11px] text-base-content/40">No plans yet</p>
      ) : (
        <div className="flex flex-col gap-1">
          {events.map((ev) => (
            <PlannerEventCard
              key={ev.id}
              ev={ev}
              onEdit={openEditModal}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type PlannerEventCardProps = {
  ev: PlannerEvent;
  onEdit: (ev: PlannerEvent) => void;
  onDelete: (id: string) => void;
};

function PlannerEventCard({ ev, onEdit, onDelete }: PlannerEventCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: ev.id });

  // Height proportional to duration, min 1 hour
  const durationMs = Math.max(
    60 * 60 * 1000,
    ev.endsAt.getTime() - ev.startsAt.getTime()
  );
  const durationHours = durationMs / (60 * 60 * 1000);

  const style: CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.8 : 1,
    boxShadow: isDragging
      ? "0 10px 25px rgba(0,0,0,0.25)"
      : "0 2px 4px rgba(0,0,0,0.15)",
    minHeight: `${durationHours * 2.5}rem`,
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className={`group rounded-lg border px-3 py-2 text-xs transition hover:border-primary/60 hover:bg-base-200 ${
        importanceStyles[ev.importance]
      } ${ev.completed ? "line-through opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold">{ev.title}</div>
          <div className="text-[10px] text-base-content/60">
            {formatTimeRange(ev.startsAt, ev.endsAt)}
          </div>
          {ev.description && (
            <div className="mt-0.5 text-[11px] text-base-content/70 line-clamp-2">
              {ev.description}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition">
          <button
            type="button"
            className="btn btn-ghost btn-xs p-1"
            onClick={() => onEdit(ev)}
          >
            <Edit3 className="h-3 w-3" />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-xs p-1 text-error"
            onClick={() => onDelete(ev.id)}
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
      <div className="mt-1 text-[10px] text-base-content/60">
        {ev.startsAt.toLocaleTimeString(undefined, {
          hour: "numeric",
          minute: "2-digit",
        })}{" "}
        –{" "}
        {ev.endsAt.toLocaleTimeString(undefined, {
          hour: "numeric",
          minute: "2-digit",
        })}
      </div>
    </div>
  );
}
