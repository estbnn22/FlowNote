// app/dashboard/page.tsx
import MobileNav from "@/components/mobileBar";
import SideBar from "@/components/sideBar";
import { stackServerApp } from "@/stack/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

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
  ]);

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

  // Serialize for client
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
        />
      </main>

      <MobileNav currentPage="/dashboard" />
    </div>
  );
}
