// app/actions/habits/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { stackServerApp } from "@/stack/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createHabit(formData: FormData) {
  const user = await stackServerApp.getUser();
  if (!user) redirect("/signIn");

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || undefined;

  const frequencyRaw = formData.get("frequency") as string | null;
  const typeRaw = formData.get("type") as string | null;

  const frequency = (frequencyRaw ?? "DAILY") as string; // DAILY | WEEKLY | MONTHLY
  const type = (typeRaw ?? "YES_NO") as string; // YES_NO | COUNTER

  const targetPerPeriodRaw = formData.get("targetPerPeriod") as string | null;
  const targetPerPeriod = targetPerPeriodRaw
    ? Math.max(1, Number(targetPerPeriodRaw))
    : null;

  // checkbox values "0"–"6"
  const rawDays = formData.getAll("daysOfWeek") as string[];
  const daysOfWeek =
    frequency === "WEEKLY"
      ? rawDays.map((v) => Number(v)).filter((n) => !Number.isNaN(n))
      : [];

  if (!title) {
    return;
  }

  await prisma.habit.create({
    data: {
      userId: user.id,
      title,
      description,
      frequency, // Prisma will validate against HabitFrequency enum
      type,      // Prisma will validate against HabitType enum
      targetPerPeriod: targetPerPeriod ?? undefined,
      daysOfWeek,
      color: null,
      icon: null,
    },
  });

  revalidatePath("/habits");
}

export async function toggleHabitToday(formData: FormData) {
  const user = await stackServerApp.getUser();
  if (!user) redirect("/signIn");

  const habitId = formData.get("habitId") as string;
  const type = ((formData.get("type") as string) ?? "YES_NO") as string;
  const action = (formData.get("action") as string) || "toggle";

  if (!habitId) return;

  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  // make sure habit belongs to user
  const habit = await prisma.habit.findFirst({
    where: {
      id: habitId,
      userId: user.id,
      isArchived: false,
    },
  });

  if (!habit) return;

  const existingLog = await prisma.habitLog.findFirst({
    where: {
      habitId,
      userId: user.id,
      date: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
  });

  let data: { done?: boolean; value?: number | null };

  if (type === "YES_NO") {
    const done = !existingLog?.done;
    data = {
      done,
      value: done ? 1 : 0,
    };
  } else {
    // COUNTER type
    const currentValue = existingLog?.value ?? 0;
    const delta = action === "decrement" ? -1 : 1;
    const nextValue = Math.max(0, currentValue + delta);
    const target = habit.targetPerPeriod ?? 1;

    data = {
      value: nextValue,
      done: nextValue >= target,
    };
  }

  if (existingLog) {
    await prisma.habitLog.update({
      where: { id: existingLog.id },
      data,
    });
  } else {
    await prisma.habitLog.create({
      data: {
        habitId,
        userId: user.id,
        date: startOfDay,
        done: data.done ?? false,
        value: data.value ?? null,
      },
    });
  }

  revalidatePath("/habits");
}