// app/actions/todos/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { stackServerApp } from "@/stack/server";
import { redirect } from "next/navigation";

export type ImportanceValue = "LOW" | "MEDIUM" | "HIGH";
export type StatusValue = "TODO" | "IN_PROGRESS" | "DONE";

//
// 🔧 Helper: keep Planning in sync with a single ToDo
//
async function upsertPlanningFromTodo(opts: {
  userId: string;
  todoId: string;
  title: string;
  importance: ImportanceValue;
  dueAt: Date | null;
  status: StatusValue;
}) {
  const { userId, todoId, title, importance, dueAt, status } = opts;

  // If no due date, delete any existing plan
  if (!dueAt) {
    await prisma.planning.deleteMany({
      where: { userId, sourceTodoId: todoId },
    });
    return;
  }

  const completed = status === "DONE";
  const endsAt = new Date(dueAt.getTime() + 60 * 60 * 1000); // +1 hour

  const existing = await prisma.planning.findUnique({
    where: { sourceTodoId: todoId },
  });

  if (existing) {
    await prisma.planning.update({
      where: { id: existing.id },
      data: {
        title,
        startsAt: dueAt,
        endsAt,
        importance,
        completed,
      },
    });
  } else {
    await prisma.planning.create({
      data: {
        userId,
        title,
        description: null,
        startsAt: dueAt,
        endsAt,
        importance,
        completed,
        sourceTodoId: todoId,
      },
    });
  }
}

export async function createTodo(formData: FormData) {
  const user = await stackServerApp.getUser();
  if (!user) redirect("/signIn");

  const titleRaw = formData.get("title");
  const importanceRaw = formData.get("importance");
  const dueAtRaw = formData.get("dueAt");

  if (!titleRaw || typeof titleRaw !== "string" || !titleRaw.trim()) {
    throw new Error("Title is required");
  }

  const importance: ImportanceValue =
    importanceRaw === "LOW" || importanceRaw === "HIGH"
      ? (importanceRaw as ImportanceValue)
      : "MEDIUM";

  const dueAt =
    typeof dueAtRaw === "string" && dueAtRaw.length > 0
      ? new Date(dueAtRaw)
      : null;

  const status: StatusValue = "TODO";

  const todo = await prisma.toDo.create({
    data: {
      userId: user.id,
      title: titleRaw.trim(),
      importance,
      status,
      dueAt,
    },
  });

  // 🔁 sync planning
  await upsertPlanningFromTodo({
    userId: user.id,
    todoId: todo.id,
    title: todo.title,
    importance: todo.importance as ImportanceValue,
    dueAt: todo.dueAt,
    status,
  });

  redirect(`/todos`);
}

export async function updateTodo(formData: FormData) {
  const user = await stackServerApp.getUser();
  if (!user) redirect("/signIn");

  const id = formData.get("id") as string;
  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const importance =
    (formData.get("importance") as ImportanceValue | null) ?? "MEDIUM";
  const currentStatus =
    (formData.get("currentStatus") as StatusValue | null) ?? "TODO";

  const dueAtRaw = formData.get("dueAt") as string | null;
  const dueAt = dueAtRaw ? new Date(dueAtRaw) : null;

  const completedCheckbox = formData.get("completed") === "on";
  const status: StatusValue = completedCheckbox ? "DONE" : currentStatus;

  const updated = await prisma.toDo.update({
    where: { id },
    data: { title, importance, status, dueAt },
  });

  await upsertPlanningFromTodo({
    userId: user.id,
    todoId: updated.id,
    title: updated.title,
    importance: updated.importance as ImportanceValue,
    dueAt: updated.dueAt,
    status: updated.status as StatusValue,
  });

  redirect(`/todos?saved=${id}`);
}

export async function toggleTodoStatus(formData: FormData) {
  const user = await stackServerApp.getUser();
  if (!user) redirect("/signIn");

  const id = formData.get("id") as string;

  const todo = await prisma.toDo.findFirst({
    where: { id, userId: user.id },
  });

  if (!todo) redirect("/todos");

  let nextStatus: StatusValue;
  switch (todo.status as StatusValue) {
    case "TODO":
      nextStatus = "IN_PROGRESS";
      break;
    case "IN_PROGRESS":
      nextStatus = "DONE";
      break;
    case "DONE":
    default:
      nextStatus = "TODO";
      break;
  }

  const updated = await prisma.toDo.update({
    where: { id },
    data: { status: nextStatus },
  });

  await prisma.planning.updateMany({
    where: {
      userId: user.id,
      sourceTodoId: updated.id,
    },
    data: {
      completed: nextStatus === "DONE",
    },
  });

  redirect(`/todos?saved=${id}`);
}

export async function moveTodo(id: string, importance: ImportanceValue) {
  const user = await stackServerApp.getUser();
  if (!user) redirect("/signIn");

  const todo = await prisma.toDo.update({
    where: { id },
    data: { importance },
  });

  await prisma.planning.updateMany({
    where: {
      userId: user.id,
      sourceTodoId: todo.id,
    },
    data: {
      importance,
    },
  });
}
export async function deleteTodo(formData: FormData) {
  const user = await stackServerApp.getUser();
  if (!user) redirect("/signIn");

  const id = formData.get("id") as string;

  await prisma.planning.deleteMany({
    where: {
      userId: user.id,
      sourceTodoId: id,
    },
  });

  await prisma.toDo.delete({
    where: { id },
  });

  redirect("/todos?deleted=1");
}

export async function quickToggleTodo(id: string) {
  const user = await stackServerApp.getUser();
  if (!user) return;

  const todo = await prisma.toDo.findFirst({
    where: { id, userId: user.id },
  });

  if (!todo) return;

  let nextStatus: StatusValue;
  switch (todo.status as StatusValue) {
    case "TODO":
      nextStatus = "IN_PROGRESS";
      break;
    case "IN_PROGRESS":
      nextStatus = "DONE";
      break;
    case "DONE":
    default:
      nextStatus = "TODO";
      break;
  }

  await prisma.toDo.update({
    where: { id: todo.id },
    data: { status: nextStatus },
  });
}
