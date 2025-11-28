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
  importance: Importance;
  completed: boolean;
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type ViewMode = "WEEK" | "MONTH";

function getStartOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay(); // 0–6
  const diff = d.getDate() - day; // back to Sunday
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
  const startDayOfWeek = startOfMonth.getDay(); // 0–6

  // First cell is the Sunday on/ before startOfMonth
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

  const [viewMode, setViewMode] = useState<ViewMode>("WEEK");
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

  // dnd-kit sensors for mouse + touch
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

  function openCreateModal(dayIndex: number, hour: number) {
    setSelectedSlot({ dayIndex, hour });
    setModalMode("CREATE");
    setEditingEventId(null);
    setFormTitle("");
    setFormDescription("");
    setFormImportance("MEDIUM");
    setFormRecurrence("NONE");
    setIsModalOpen(true);
  }

  function openEditModal(ev: PlannerEvent) {
    setModalMode("EDIT");
    setEditingEventId(ev.id);
    setSelectedSlot(null);
    setFormTitle(ev.title);
    setFormDescription(ev.description ?? "");
    setFormImportance(ev.importance);
    setFormRecurrence("NONE"); // not used for edit
    setIsModalOpen(true);
  }

  async function handleSubmitModal(e: React.FormEvent) {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (modalMode === "CREATE") {
      if (!selectedSlot) return;

      const startsAt = dateFromWeekAndSlot(
        currentWeekStart,
        selectedSlot.dayIndex,
        selectedSlot.hour
      );

      const createdList = await createPlanning({
        title: formTitle.trim(),
        startsAt: startsAt.toISOString(),
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
          importance: p.importance,
          completed: p.completed,
        })),
      ]);
    } else if (modalMode === "EDIT" && editingEventId) {
      const updated = await updatePlanningDetails({
        id: editingEventId,
        title: formTitle.trim(),
        description: formDescription.trim() || null,
        importance: formImportance,
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
      const d = ev.startsAt;
      return isSameDay(d, slotDate) && d.getHours() === hour;
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
      // DB still keeps existing; you can add a real "clear week/month" later if you want
    }
  }

  // When switching to month view, sync month date with current week
  function switchToMonth() {
    setViewMode("MONTH");
    setCurrentMonthDate(getStartOfMonth(currentWeekStart));
  }

  function switchToWeek() {
    setViewMode("WEEK");
    setCurrentWeekStart(getStartOfWeek(currentMonthDate));
  }

  // 🔁 dnd-kit: handle drop on time slots / day pills
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const evId = active.id as string;
    const overId = String(over.id);

    // Drop on a specific time slot: "slot:dayIndex:hour"
    if (overId.startsWith("slot:")) {
      const [, dayStr, hourStr] = overId.split(":");
      const dayIdx = Number(dayStr);
      const hour = Number(hourStr);

      const newStartsAt = dateFromWeekAndSlot(currentWeekStart, dayIdx, hour);

      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === evId ? { ...ev, startsAt: newStartsAt } : ev
        )
      );

      updatePlanningTime({
        id: evId,
        newStartsAt: newStartsAt.toISOString(),
      }).catch((err) => console.error("Failed to update plan time", err));

      return;
    }

    // Drop on a day pill: "day:dayIndex" (keep the same hour)
    if (overId.startsWith("day:")) {
      const [, dayStr] = overId.split(":");
      const dayIdx = Number(dayStr);
      const ev = events.find((e) => e.id === evId);
      if (!ev) return;

      const hour = ev.startsAt.getHours();
      const newStartsAt = dateFromWeekAndSlot(currentWeekStart, dayIdx, hour);

      setEvents((prev) =>
        prev.map((e) => (e.id === evId ? { ...e, startsAt: newStartsAt } : e))
      );

      updatePlanningTime({
        id: evId,
        newStartsAt: newStartsAt.toISOString(),
      }).catch((err) =>
        console.error("Failed to move event between days", err)
      );

      return;
    }
  }

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
            TickTick-style planner. Week view for detailed planning, Month view
            for a quick overview. Tap a time to add, drag to reschedule, or tap
            an event to edit.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Week / Month toggle */}
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

          {/* Date range / month nav */}
          <div className="flex items-center rounded-full border border-base-300 bg-base-100 px-2 py-1 shadow-sm">
            <button
              onClick={goToPrevious}
              className="btn btn-ghost btn-xs rounded-full px-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 text-sm font-semibold">
              {viewMode === "WEEK" ? (
                <>
                  {currentWeekStart.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  –{" "}
                  {addDays(currentWeekStart, 6).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </>
              ) : (
                currentMonthDate.toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                })
              )}
            </span>
            <button
              onClick={goToNext}
              className="btn btn-ghost btn-xs rounded-full px-2"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button onClick={goToToday} className="btn btn-outline btn-sm">
            Today
          </button>
          <button onClick={clearAll} className="btn btn-ghost btn-sm">
            Clear view
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
          <span>Drag to reschedule (time & day)</span>
        </div>
      </div>

      {/* dnd context wraps both month + week parts */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        {/* ---- MONTH VIEW ---- */}
        {viewMode === "MONTH" && (
          <div className="space-y-4">
            {/* Month grid */}
            <div className="overflow-x-auto rounded-2xl border border-base-300 bg-base-100 shadow-sm">
              <div className="min-w-[700px]">
                {/* Weekday header */}
                <div className="grid grid-cols-7 border-b border-base-300 bg-base-200/70 text-center text-xs font-semibold uppercase tracking-wide text-base-content/70">
                  {DAY_LABELS.map((label) => (
                    <div key={label} className="px-2 py-2">
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
                              // Sync active day & week to this date
                              setCurrentWeekStart(getStartOfWeek(date));
                              setActiveDayIndex(date.getDay());
                            }}
                            className={`flex min-h-[80px] flex-col items-start border-r border-base-200 px-2 py-2 text-left text-xs last:border-r-0 transition ${
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
                                className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                                  isTodayFlag
                                    ? "bg-primary text-primary-content"
                                    : "text-base-content"
                                }`}
                              >
                                {date.getDate()}
                              </span>
                              {dateEvents.length > 0 && (
                                <span className="text-[10px] text-base-content/60">
                                  {dateEvents.length} plan
                                  {dateEvents.length > 1 ? "s" : ""}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-col gap-1">
                              {dateEvents.slice(0, 3).map((ev) => (
                                <div
                                  key={ev.id}
                                  className={`line-clamp-1 rounded-md px-1 py-0.5 text-[10px] ${
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
                                <span className="text-[10px] text-base-content/50">
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

            {/* Agenda for selected day (under month) */}
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

        {/* Desktop evenly spaced day strip */}
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

        {/* ---- AGENDA VIEW (used for both week & month active day) ---- */}
        <div className="space-y-2 max-h-[70vh] overflow-y-auto">
          {HOURS.map((hour) => {
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
          })}
        </div>
      </DndContext>

      {/* Add / Edit Plan Modal */}
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
              <p className="mb-4 text-xs text-base-content/70">
                {weekDates[selectedSlot.dayIndex].label},{" "}
                {weekDates[selectedSlot.dayIndex].dateLabel} at{" "}
                {formatHour(selectedSlot.hour)}
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
                  placeholder="e.g. Go for a run"
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
                  placeholder="Optional notes..."
                  className="textarea textarea-bordered w-full"
                  rows={3}
                />
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

                {modalMode === "CREATE" && (
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-sm">Repeat</span>
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
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-ghost btn-sm"
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

/* ---------- Day pill (droppable for moving events between days) ---------- */

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

/* ---------- Time slot row (droppable per hour) ---------- */

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

/* ---------- Draggable event card ---------- */

type PlannerEventCardProps = {
  ev: PlannerEvent;
  onEdit: (ev: PlannerEvent) => void;
  onDelete: (id: string) => void;
};

function PlannerEventCard({ ev, onEdit, onDelete }: PlannerEventCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: ev.id });

  const style: CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.8 : 1,
    boxShadow: isDragging
      ? "0 12px 30px rgba(0,0,0,0.25)"
      : "0 2px 8px rgba(0,0,0,0.18)",
    cursor: "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="active:cursor-grabbing"
      onClick={() => onEdit(ev)}
    >
      <div
        className={`flex items-center gap-2 rounded-lg px-2 py-1 text-xs text-base-content ${
          importanceStyles[ev.importance]
        } hover:brightness-110 ${ev.completed ? "opacity-60" : ""}`}
      >
        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-base-100/70 text-[10px] font-bold">
          ●
        </span>
        <div className="flex-1 truncate">
          <div
            className={`font-semibold truncate ${
              ev.completed ? "line-through" : ""
            }`}
          >
            {ev.title}
          </div>
          {ev.description && (
            <div
              className={`text-[10px] text-base-content/70 truncate ${
                ev.completed ? "line-through" : ""
              }`}
            >
              {ev.description}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(ev);
          }}
          className="p-1 text-base-content/50 hover:text-primary"
        >
          <Edit3 className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(ev.id);
          }}
          className="p-1 text-base-content/50 hover:text-error"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
