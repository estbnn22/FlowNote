"use server";

import { prisma } from "@/lib/prisma";
import { stackServerApp } from "@/stack/server";
import { revalidatePath } from "next/cache";

export type Importance = "LOW" | "MEDIUM" | "HIGH";
export type Recurrence = "NONE" | "DAILY" | "WEEKLY";

export type PlanningDTO = {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt?: string | null;
  importance: Importance;
  completed: boolean;
};

export async function createPlanning(input: {
  title: string;
  startsAt: string;
  endsAt: string; // ⬅️ important
  description?: string | null;
  importance?: Importance;
  recurrence?: Recurrence;
}): Promise<PlanningDTO[]> {
  const user = await stackServerApp.getUser();
  if (!user) {
    throw new Error("Not authenticated");
  }

  const baseStart = new Date(input.startsAt);
  const baseEnd = new Date(input.endsAt);

  // Make sure duration is at least 1 hour
  const rawDuration = baseEnd.getTime() - baseStart.getTime();
  const duration = Math.max(60 * 60 * 1000, rawDuration);

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
    const startsAtDate = new Date(baseStart);
    if (i > 0 && stepDays > 0) {
      startsAtDate.setDate(startsAtDate.getDate() + i * stepDays);
    }

    const endsAtDate = new Date(startsAtDate.getTime() + duration);

    const record = await prisma.planning.create({
      data: {
        userId: user.id,
        title: input.title,
        description: input.description ?? null,
        startsAt: startsAtDate,
        endsAt: endsAtDate,
        importance,
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
      completed: record.completed,
    });
  }

  return created;
}

/**
 * Move a plan in time (drag & drop).
 * We now trust the newStartsAt / newEndsAt coming from the client.
 */
export async function updatePlanningTime(params: {
  id: string;
  newStartsAt: string;
  newEndsAt: string;
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
  const newEndsAtDate = new Date(params.newEndsAt);

  const updated = await prisma.planning.update({
    where: { id: params.id },
    data: {
      startsAt: newStartsAtDate,
      endsAt: newEndsAtDate,
    },
  });

  return {
    id: updated.id,
    title: updated.title,
    description: updated.description,
    startsAt: updated.startsAt.toISOString(),
    endsAt: updated.endsAt ? updated.endsAt.toISOString() : null,
    importance: updated.importance as Importance,
    completed: updated.completed,
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

/**
 * Wrapper to use createPlanning with a <form action=...>
 */
export async function createPlanningFromForm(formData: FormData) {
  const title = (formData.get("title") as string)?.trim();
  const description =
    ((formData.get("description") as string) || "").trim() || null;

  const startsAt = formData.get("startsAt") as string;
  const endsAt = (formData.get("endsAt") as string) || startsAt;

  const importance =
    ((formData.get("importance") as string) as Importance) ?? "MEDIUM";
  const recurrence =
    ((formData.get("recurrence") as string) as Recurrence) ?? "NONE";

  if (!title || !startsAt) {
    return;
  }

  await createPlanning({
    title,
    startsAt,
    endsAt,
    description,
    importance,
    recurrence,
  });

  revalidatePath("/planner");
}