// app/dashboard/page.tsx
import MobileNav from "@/components/mobileBar";
import SideBar from "@/components/sideBar";
import { stackServerApp } from "@/stack/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";
import type { Habit } from "@prisma/client";
import { revalidatePath } from "next/cache";

// --- helper to know if a habit is active on a given day ---
function isHabitActiveOnDate(habit: Habit, day: Date): boolean {

  if (habit.frequency === "DAILY") return true;

  if (habit.frequency === "WEEKLY") {
    const weekday = day.getDay(); // 0-6
    return (habit.daysOfWeek ?? []).includes(weekday);
  }

  if (habit.frequency === "MONTHLY") {
    // simple version: show monthly habits every month on the created day
    const created = habit.createdAt;
    return day.getDate() === created.getDate();
  }

  return false;
}

// --- server action: toggle todo status from dashboard ---
export async function toggleTodoAction(formData: FormData) {
  "use server";

  const user = await stackServerApp.getUser();
  if (!user) return;

  const id = formData.get("id") as string | null;
  const currentStatus = formData.get("currentStatus") as string | null;
  if (!id || !currentStatus) return;

  const todo = await prisma.toDo.findUnique({ where: { id } });
  if (!todo || todo.userId !== user.id) return;

  // simple toggle DONE ↔ TODO (you can adjust to include IN_PROGRESS if you want)
  const nextStatus =
    currentStatus === "DONE"
      ? "TODO"
      : "DONE";

  await prisma.toDo.update({
    where: { id },
    data: { status: nextStatus },
  });

  revalidatePath("/dashboard");
}

// --- server action: quick add todo from dashboard ---
export async function quickAddTodoAction(formData: FormData) {
  "use server";

  const user = await stackServerApp.getUser();
  if (!user) return;

  const title = (formData.get("title") as string | null)?.trim();
  if (!title) return;

  const importance =
    ((formData.get("importance") as string | null) ?? "MEDIUM") as
      | "LOW"
      | "MEDIUM"
      | "HIGH";

  await prisma.toDo.create({
    data: {
      userId: user.id,
      title,
      importance,
      status: "TODO",
      dueAt: null,
    },
  });

  revalidatePath("/dashboard");
}

// --- main dashboard page ---
export default async function Dashboard() {
  const user = await stackServerApp.getUser();
  if (!user) {
    redirect("/signIn");
  }

  const now = new Date();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const [
    rawTodos,
    recentNotesRaw,
    upcomingPlansRaw,
    totalTodos,
    todayOpenTodos,
    overdueTodos,
    todayPlansCount,
    habitsRaw,
  ] = await Promise.all([
    prisma.toDo.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.note.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.planning.findMany({
      where: {
        userId: user.id,
        startsAt: { gte: now },
        completed: false,
      },
      orderBy: { startsAt: "asc" },
      take: 5,
    }),
    prisma.toDo.count({
      where: { userId: user.id },
    }),
    prisma.toDo.count({
      where: {
        userId: user.id,
        status: { in: ["TODO", "IN_PROGRESS"] },
        dueAt: {
          gte: startOfToday,
          lt: endOfToday,
        },
      },
    }),
    prisma.toDo.count({
      where: {
        userId: user.id,
        status: { in: ["TODO", "IN_PROGRESS"] },
        dueAt: { lt: now },
      },
    }),
    prisma.planning.count({
      where: {
        userId: user.id,
        startsAt: {
          gte: startOfToday,
          lt: endOfToday,
        },
        completed: false,
      },
    }),
    prisma.habit.findMany({
      where: {
        userId: user.id,
        isArchived: false,
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // sort todos by importance then recency
  const importanceRank: Record<string, number> = {
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  const sortedTodos = rawTodos
    .slice()
    .sort((a, b) => {
      const impDiff =
        (importanceRank[b.importance] ?? 0) -
        (importanceRank[a.importance] ?? 0);
      if (impDiff !== 0) return impDiff;
      return b.createdAt.getTime() - a.createdAt.getTime();
    })
    .slice(0, 5);

  const completionRate =
    totalTodos === 0
      ? 0
      : Math.round(
          (rawTodos.filter((t) => t.status === "DONE").length / totalTodos) *
            100
        );

  // habits for today
  const todayHabitsRaw = habitsRaw.filter((h) =>
    isHabitActiveOnDate(h, startOfToday)
  );
  const totalHabits = habitsRaw.length;

  const clientHabitsToday = todayHabitsRaw.map((h) => ({
    id: h.id,
    title: h.title,
    description: h.description ?? null,
    frequency: h.frequency,
    color: h.color ?? null,
  }));

  // serialize for client
  const clientTodos = sortedTodos.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    importance: t.importance,
    dueAt: t.dueAt ? t.dueAt.toISOString() : null,
  }));

  const clientNotes = recentNotesRaw.map((n) => ({
    id: n.id,
    title: n.title,
    content: n.content,
    updatedAt: n.updatedAt.toISOString(),
  }));

  const clientPlans = upcomingPlansRaw.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    startsAt: p.startsAt.toISOString(),
    endsAt: p.endsAt ? p.endsAt.toISOString() : null,
    importance: p.importance,
  }));

  return (
    <div className="min-h-screen bg-base-100 text-white">
      <SideBar currentPage="/dashboard" />

      <main className="md:ml-64 px-4 pb-20 pt-6 md:px-10 md:pt-10 mb-10 md:mb-0">
        <DashboardClient
          userName={user.displayName ?? "User"}
          todos={clientTodos}
          recentNotes={clientNotes}
          upcomingPlans={clientPlans}
          completionRate={completionRate}
          totalTodos={totalTodos}
          todayOpenTodos={todayOpenTodos}
          overdueTodos={overdueTodos}
          todayPlansCount={todayPlansCount}
          habitsToday={clientHabitsToday}
          totalHabits={totalHabits}
          toggleTodoAction={toggleTodoAction}
          quickAddTodoAction={quickAddTodoAction}
        />
      </main>

      <MobileNav currentPage="/dashboard" />
    </div>
  );
}