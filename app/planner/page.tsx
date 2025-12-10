// app/planner/page.tsx
import { redirect } from "next/navigation";
import SideBar from "@/components/sideBar";
import MobileNav from "@/components/mobileBar";
import { prisma } from "@/lib/prisma";
import { stackServerApp } from "@/stack/server";
import type { ToDo, Habit, Planning } from "@prisma/client";
import { PlannerCalendar } from "./PlannerCalendar";
import { createPlanningFromForm } from "../actions/planner/actions";

export default async function PlannerPage() {
  const user = await stackServerApp.getUser();
  if (!user) redirect("/signIn");

  // Plans
  const plannings: Planning[] = await prisma.planning.findMany({
    where: { userId: user.id },
    orderBy: { startsAt: "asc" },
  });

  // To-Dos (only those with a dueAt so they can appear on the calendar)
  const todos: ToDo[] = await prisma.toDo.findMany({
    where: {
      userId: user.id,
      dueAt: {
        not: null,
      },
    },
    orderBy: { dueAt: "asc" },
  });

  // Habits
  const habits: Habit[] = await prisma.habit.findMany({
    where: {
      userId: user.id,
      isArchived: false,
    },
    orderBy: { createdAt: "asc" },
  });

  const planEvents = plannings.map((p: Planning) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    startsAt: p.startsAt.toISOString(),
    endsAt: p.endsAt ? p.endsAt.toISOString() : null,
    importance: p.importance,
    completed: p.completed,
  }));

  const todoEvents = todos.map((t: ToDo) => ({
    id: t.id,
    title: t.title,
    description: null,
    dueDate: t.dueAt ? t.dueAt.toISOString() : null,
    importance: t.importance,
    status: t.status,
  }));

  const habitEvents = habits.map((h: Habit) => ({
    id: h.id,
    title: h.title,
    description: h.description ?? null,
    frequency: h.frequency, // "DAILY" | "WEEKLY" | "MONTHLY"
    daysOfWeek: h.daysOfWeek ?? [],
    color: h.color ?? null,
    createdAt: h.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-base-100 text-white">
      <SideBar currentPage="/planner" />

      <main className="md:ml-64 px-4 pb-20 pt-6 md:px-10 md:pt-10 mb-10 md:mb-0">
        {/* New Plan form */}
        <section className="mb-6 rounded-2xl border border-base-300/60 bg-base-200/80 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-neutral mb-1">
            Create a plan
          </h2>
          <p className="text-[11px] text-neutral/60 mb-3">
            Add focused time blocks or events so they appear on the calendar.
          </p>

          <form action={createPlanningFromForm} className="space-y-3">
            {/* Title */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral/70">Title</label>
              <input
                name="title"
                type="text"
                required
                className="rounded-lg border border-base-300 bg-base-300/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
                placeholder="Deep work, Client call..."
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral/70">Description</label>
              <textarea
                name="description"
                rows={2}
                className="rounded-lg border border-base-300 bg-base-300/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
                placeholder="Optional details..."
              />
            </div>

            {/* Time range */}
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-neutral/70">Starts at</label>
                <input
                  name="startsAt"
                  type="datetime-local"
                  required
                  className="rounded-lg border border-base-300 bg-base-300/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-neutral/70">
                  Ends at{" "}
                  <span className="text-[10px] text-neutral/50">(optional)</span>
                </label>
                <input
                  name="endsAt"
                  type="datetime-local"
                  className="rounded-lg border border-base-300 bg-base-300/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
                />
              </div>
            </div>

            {/* Importance + Recurrence */}
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-neutral/70">Importance</label>
                <select
                  name="importance"
                  className="select select-sm w-full rounded-lg border-base-300 bg-base-300/70 text-xs"
                  defaultValue="MEDIUM"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-neutral/70">Recurrence</label>
                <select
                  name="recurrence"
                  className="select select-sm w-full rounded-lg border-base-300 bg-base-300/70 text-xs"
                  defaultValue="NONE"
                >
                  <option value="NONE">None</option>
                  <option value="DAILY">Daily (next 7 days)</option>
                  <option value="WEEKLY">Weekly (next 4 weeks)</option>
                </select>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                className="btn btn-sm w-full rounded-xl bg-primary text-xs text-black"
              >
                Add plan
              </button>
            </div>
          </form>
        </section>

        {/* Calendar */}
        <PlannerCalendar
          plans={planEvents}
          todos={todoEvents}
          habits={habitEvents}
        />
      </main>

      <MobileNav currentPage="/planner" />
    </div>
  );
}