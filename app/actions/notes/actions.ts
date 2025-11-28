// app/notes/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { stackServerApp } from "@/stack/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type Importance = "LOW" | "MEDIUM" | "HIGH";

export async function createNote(formData: FormData) {
  const user = await stackServerApp.getUser();
  if (!user) redirect("/signIn");

  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const content = (formData.get("content") as string | null)?.trim() ?? "";
  const importance =
    (formData.get("importance") as Importance | null) ?? "MEDIUM";

  // optional pinned support from form (checkbox or hidden input)
  const pinnedRaw = formData.get("pinned");
  const pinned =
    pinnedRaw === "on" || pinnedRaw === "true" || pinnedRaw === "1";

  if (!title) {
    throw new Error("Title is required");
  }

  await prisma.note.create({
    data: {
      userId: user.id,
      title,
      content,
      importance,
      pinned,
    },
  });

  redirect("/notes");
}

export async function updateNote(formData: FormData) {
  const user = await stackServerApp.getUser();
  if (!user) redirect("/signIn");

  const id = formData.get("id") as string | null;
  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const content = (formData.get("content") as string | null)?.trim() ?? "";
  const importance =
    (formData.get("importance") as Importance | null) ?? "MEDIUM";

  const pinnedRaw = formData.get("pinned");
  const pinned =
    pinnedRaw === "on" || pinnedRaw === "true" || pinnedRaw === "1";

  if (!id) throw new Error("Missing note id");
  if (!title) throw new Error("Title is required");

  await prisma.note.update({
    where: {
      id,
      userId: user.id,
    },
    data: {
      title,
      content,
      importance,
      pinned,
    },
  });

  redirect("/notes");
}

export async function deleteNote(formData: FormData) {
  const user = await stackServerApp.getUser();
  if (!user) redirect("/signIn");

  const id = formData.get("id") as string | null;
  if (!id) throw new Error("Missing note id");

  // ✅ safer: won't throw if the note is already gone / not this user's
  await prisma.note.deleteMany({
    where: {
      id,
      userId: user.id,
    },
  });

  redirect("/notes");
}

export async function moveNoteToImportance(id: string, importance: Importance) {
  const user = await stackServerApp.getUser();
  if (!user) return;

  await prisma.note.update({
    where: { id, userId: user.id },
    data: { importance },
  });

  redirect("/notes");
}

export async function togglePinnedNote(id: string) {
  const user = await stackServerApp.getUser();
  if (!user) redirect("/signIn");

  const existing = await prisma.note.findFirst({
    where: { id, userId: user.id },
    select: { pinned: true },
  });

  if (!existing) return;

  await prisma.note.update({
    where: { id },
    data: { pinned: !existing.pinned },
  });

  redirect("/notes");
}
