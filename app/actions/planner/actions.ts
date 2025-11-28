// app/planner/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { stackServerApp } from "@/stack/server";

export type Importance = "LOW" | "MEDIUM" | "HIGH";
export type Recurrence = "NONE" | "DAILY" | "WEEKLY";

export type PlanningDTO = {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  importance: Importance;
  completed: boolean; // ✅ used everywhere now
};

/**
 * Create one or multiple plans (for recurrence).
 * Recurrence behavior:
 *  - NONE: 1 plan
 *  - DAILY: 7 days in a row
 *  - WEEKLY: 4 weeks in a row (same weekday)
 */
export async function createPlanning(input: {
  title: string;
  startsAt: string; // base ISO
  description?: string | null;
  importance?: Importance;
  recurrence?: Recurrence;
}): Promise<PlanningDTO[]> {
  const user = await stackServerApp.getUser();
  if (!user) {
    throw new Error("Not authenticated");
  }

  const base = new Date(input.startsAt);
  const importance = input.importance ?? "MEDIUM";
  const recurrence = input.recurrence ?? "NONE";

  let occurrences = 1;
  let stepDays = 0;

  if (recurrence === "DAILY") {
    occurrences = 7;
    stepDays = 1;
  } else if (recurrence === "WEEKLY") {
    occurrences = 4;
    stepDays = 7;
  }

  const created: PlanningDTO[] = [];

  for (let i = 0; i < occurrences; i++) {
    const startsAtDate = new Date(base);
    if (i > 0 && stepDays > 0) {
      startsAtDate.setDate(startsAtDate.getDate() + i * stepDays);
    }

    const endsAtDate = new Date(startsAtDate.getTime() + 60 * 60 * 1000); // +1h

    const record = await prisma.planning.create({
      data: {
        userId: user.id,
        title: input.title,
        description: input.description ?? null,
        startsAt: startsAtDate,
        endsAt: endsAtDate,
        importance,
        // sourceTodoId stays null for planner-created items
        // completed will default to false from schema, but we can be explicit:
        completed: false,
      },
    });

    created.push({
      id: record.id,
      title: record.title,
      description: record.description,
      startsAt: record.startsAt.toISOString(),
      endsAt: record.endsAt ? record.endsAt.toISOString() : null,
      importance: record.importance as Importance,
      completed: record.completed, // ✅ include
    });
  }

  return created;
}

/**
 * Move a plan in time (drag & drop).
 */
export async function updatePlanningTime(params: {
  id: string;
  newStartsAt: string; // ISO string
}): Promise<PlanningDTO> {
  const user = await stackServerApp.getUser();
  if (!user) {
    throw new Error("Not authenticated");
  }

  const existing = await prisma.planning.findUnique({
    where: { id: params.id },
  });

  if (!existing || existing.userId !== user.id) {
    throw new Error("Plan not found");
  }

  const newStartsAtDate = new Date(params.newStartsAt);

  const duration =
    existing.endsAt?.getTime() && existing.startsAt
      ? existing.endsAt.getTime() - existing.startsAt.getTime()
      : 60 * 60 * 1000; // default 1h

  const newEndsAtDate = new Date(newStartsAtDate.getTime() + duration);

  const updated = await prisma.planning.update({
    where: { id: params.id },
    data: {
      startsAt: newStartsAtDate,
      endsAt: existing.endsAt ? newEndsAtDate : null,
    },
  });

  return {
    id: updated.id,
    title: updated.title,
    description: updated.description,
    startsAt: updated.startsAt.toISOString(),
    endsAt: updated.endsAt ? updated.endsAt.toISOString() : null,
    importance: updated.importance as Importance,
    completed: updated.completed, // ✅ keep completion state
  };
}

/**
 * Edit title, description, importance.
 */
export async function updatePlanningDetails(params: {
  id: string;
  title: string;
  description?: string | null;
  importance: Importance;
}): Promise<PlanningDTO> {
  const user = await stackServerApp.getUser();
  if (!user) {
    throw new Error("Not authenticated");
  }

  const existing = await prisma.planning.findUnique({
    where: { id: params.id },
  });

  if (!existing || existing.userId !== user.id) {
    throw new Error("Plan not found");
  }

  const updated = await prisma.planning.update({
    where: { id: params.id },
    data: {
      title: params.title,
      description: params.description ?? null,
      importance: params.importance,
    },
  });

  return {
    id: updated.id,
    title: updated.title,
    description: updated.description,
    startsAt: updated.startsAt.toISOString(),
    endsAt: updated.endsAt ? updated.endsAt.toISOString() : null,
    importance: updated.importance as Importance,
    completed: updated.completed, // ✅ keep completion state
  };
}

/**
 * Delete a single plan by id.
 */
export async function deletePlanning(id: string): Promise<void> {
  const user = await stackServerApp.getUser();
  if (!user) {
    throw new Error("Not authenticated");
  }

  const existing = await prisma.planning.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });

  if (!existing || existing.userId !== user.id) {
    throw new Error("Plan not found");
  }

  await prisma.planning.delete({
    where: { id },
  });
}
