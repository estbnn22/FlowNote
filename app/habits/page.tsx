// app/habits/page.tsx
import SideBar from "@/components/sideBar";
import MobileNav from "@/components/mobileBar";
import { stackServerApp } from "@/stack/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { createHabit, toggleHabitToday } from "../actions/habits/actions";
import HabitForm from "@/components/HabitsForm";

function getTodayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return { start, end };
}

export default async function HabitsPage() {
  const user = await stackServerApp.getUser();
  if (!user) redirect("/signIn");

  const { start, end } = getTodayRange();
  const weekday = start.getDay(); // 0–6

  const habits = await prisma.habit.findMany({
    where: {
      userId: user.id,
      isArchived: false,
    },
    include: {
      logs: {
        where: {
          date: {
            gte: start,
            lt: end,
          },
        },
        take: 1,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const todayHabits = habits
    .map((habit) => {
      const log = habit.logs[0] ?? null;
      const done = log?.done ?? false;
      const value = log?.value ?? 0;

      let isActiveToday = true;

      if (habit.frequency === "WEEKLY") {
        isActiveToday = (habit.daysOfWeek ?? []).includes(weekday);
      } else if (habit.frequency === "MONTHLY") {
        // simple version: always show monthly habits
        isActiveToday = true;
      } else {
        // DAILY
        isActiveToday = true;
      }

      return { habit, log, done, value, isActiveToday };
    })
    .filter((h) => h.isActiveToday);

  return (
    <div className="min-h-screen bg-base-100 text-white">
      <SideBar currentPage="/habits" />
      <MobileNav currentPage="/habits" />

      <main className="md:ml-64 px-4 pb-24 pt-6 md:px-10 md:pt-10">
        {/* Header */}
        <header className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-50">Habits</h1>
            <p className="mt-1 text-xs text-slate-400 md:text-sm">
              Build consistent routines with daily and weekly habits, track progress, and never lose a streak.
            </p>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
          {/* Today’s Habits */}
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-neutral">Today&apos;s habits</h2>
                <p className="text-[11px] text-neutral/60">
                  Tap to mark a habit done or adjust counters. Progress updates instantly.
                </p>
              </div>
            </div>

            {todayHabits.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-base-300/70 bg-base-200/50 p-4 text-center text-xs text-neutral/60">
                No habits yet for today. Create a habit on the right and it&apos;ll appear here.
              </div>
            ) : (
              <div className="space-y-3">
                {todayHabits.map(({ habit, done, value }) => {
                  const isCounter = habit.type === "COUNTER";
                  const target = habit.targetPerPeriod ?? 1;
                  const progress = isCounter ? Math.min(1, value / target) : done ? 1 : 0;

                  return (
                    <div
                      key={habit.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-base-300/70 bg-base-200/70 px-4 py-3 shadow-sm"
                    >
                      <div className="flex flex-1 flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-1.5 w-1.5 rounded-full ${
                              done ? "bg-primary" : "bg-neutral/50"
                            }`}
                          />
                          <span className="text-sm font-medium text-slate-50">
                            {habit.title}
                          </span>
                        </div>
                        {habit.description && (
                          <p className="text-[11px] text-neutral/60 line-clamp-2">
                            {habit.description}
                          </p>
                        )}

                        {/* Progress bar */}
                        <div className="mt-1 flex flex-col gap-1">
                          <div className="h-1.5 overflow-hidden rounded-full bg-base-300/80">
                            <div
                              className={`h-full rounded-full transition-all ${
                                done ? "bg-primary" : "bg-primary/70"
                              }`}
                              style={{ width: `${progress * 100}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-neutral/60">
                            <span>
                              {habit.frequency === "DAILY"
                                ? "Daily"
                                : habit.frequency === "WEEKLY"
                                  ? "Weekly"
                                  : "Monthly"}
                            </span>
                            {isCounter && (
                              <span>
                                {value}/{target} done
                              </span>
                            )}
                            {!isCounter && (
                              <span>{done ? "Completed today" : "Not done yet"}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col items-end gap-2">
                        {isCounter ? (
                          <form
                            action={toggleHabitToday}
                            className="flex items-center gap-1"
                          >
                            <input type="hidden" name="habitId" value={habit.id} />
                            <input type="hidden" name="type" value={habit.type} />

                            <button
                              type="submit"
                              name="action"
                              value="decrement"
                              className="btn btn-xs rounded-full border-base-300 bg-base-300/80 text-xs"
                            >
                              −
                            </button>
                            <span className="min-w-12 text-center text-xs text-slate-100">
                              {value}/{target}
                            </span>
                            <button
                              type="submit"
                              name="action"
                              value="increment"
                              className="btn btn-xs rounded-full bg-primary/90 text-xs text-black"
                            >
                              +
                            </button>
                          </form>
                        ) : (
                          <form action={toggleHabitToday}>
                            <input type="hidden" name="habitId" value={habit.id} />
                            <input type="hidden" name="type" value={habit.type} />
                            <button
                              type="submit"
                              className={`btn btn-sm rounded-full text-xs ${
                                done
                                  ? "border-base-300 bg-base-300/70 text-neutral"
                                  : "bg-primary text-black"
                              }`}
                            >
                              {done ? "Done" : "Mark done"}
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Create Habit */}
          <section className="rounded-2xl border border-base-300/60 bg-base-200/80 p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-neutral mb-1">Create a habit</h2>
            <p className="text-[11px] text-neutral/60 mb-3">
              Define what you want to do regularly and how often you&apos;ll track it.
            </p>
            <HabitForm />
          </section>
        </div>
      </main>
    </div>
  );
}