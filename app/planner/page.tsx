// app/planner/page.tsx
import { redirect } from "next/navigation";
import SideBar from "@/components/sideBar";
import MobileNav from "@/components/mobileBar";
import { prisma } from "@/lib/prisma";
import { stackServerApp } from "@/stack/server";
import { PlannerCalendar } from "./PlannerCalendar";
import type { PlanningDTO } from "../actions/planner/actions";

export default async function PlannerPage() {
  const user = await stackServerApp.getUser();
  if (!user) redirect("/signIn");

  const plannings = await prisma.planning.findMany({
    where: { userId: user.id },
    orderBy: { startsAt: "asc" },
  });

  const initialPlans: PlanningDTO[] = plannings.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    startsAt: p.startsAt.toISOString(),
    endsAt: p.endsAt ? p.endsAt.toISOString() : null,
    importance: p.importance,
    completed: p.completed,
  }));
  return (
    <div className="min-h-screen bg-base-100 text-white">
      <SideBar currentPage="/planner" />

      <main className="md:ml-64 px-4 pb-20 pt-6 md:px-10 md:pt-10 mb-10 md:mb-0">
        <PlannerCalendar initialPlans={initialPlans} />
      </main>
      <MobileNav currentPage="/planner" />
    </div>
  );
}
