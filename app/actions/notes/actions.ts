"use server";

import { prisma } from "@/lib/prisma";
import { stackServerApp } from "@/stack/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type Importance = "LOW" | "MEDIUM" | "HIGH";

export type NoteDTO = {
  id: string;
  title: string;
  content: string | null;
  importance: Importance;
  updatedAt: string;
  pinned: boolean;
  notebookId: string | null;
};

async function requireUser() {
  const user = await stackServerApp.getUser();
  if (!user) redirect("/signIn");
  return user;
}

/* ----------------- NOTEBOOK ACTIONS ----------------- */

export async function createNotebook(formData: FormData) {
  const user = await stackServerApp.getUser();
  if (!user) redirect("/signIn");

  const rawName = formData.get("name");
  const name =
    typeof rawName === "string" && rawName.trim().length > 0
      ? rawName.trim()
      : "Untitled notebook";

  await prisma.notebook.create({
    data: {
      name,
      userId: user.id,
    },
  });

  revalidatePath("/notes");
}

export async function renameNotebook(formData: FormData) {
  const user = await requireUser();
  const id = formData.get("id") as string | null;
  const name = (formData.get("name") as string | null)?.trim() ?? "";

  if (!id || !name) return;

  await prisma.notebook.update({
    where: {
      id,
      // optional safety, if you have a composite ID you can adjust this
    },
    data: {
      name,
    },
  });

  revalidatePath("/notes");
}

export async function deleteNotebook(formData: FormData) {
  const user = await requireUser();
  const id = formData.get("id") as string | null;
  if (!id) return;

  // Detach notes from this notebook (they become "Quick notes")
  await prisma.note.updateMany({
    where: {
      notebookId: id,
      userId: user.id,
    },
    data: {
      notebookId: null,
    },
  });

  await prisma.notebook.delete({
    where: { id },
  });

  revalidatePath("/notes");
}

/* ----------------- NOTE ACTIONS ----------------- */

export async function createNote(formData: FormData) {
  const user = await requireUser();

  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const content = (formData.get("content") as string | null)?.trim() || null;
  const importance = ((formData.get("importance") as Importance | null) ??
    "MEDIUM") as Importance;

  const notebookIdRaw = (formData.get("notebookId") as string | null) ?? "";
  const notebookId = notebookIdRaw.length > 0 ? notebookIdRaw : null;

  if (!title) return;

  await prisma.note.create({
    data: {
      userId: user.id,
      title,
      content,
      importance,
      notebookId,
    },
  });

  revalidatePath("/notes");
}

export async function deleteNote(formData: FormData) {
  const user = await requireUser();
  const id = formData.get("id") as string | null;
  if (!id) return;

  await prisma.note.delete({
    where: { id },
  });

  revalidatePath("/notes");
}

export async function togglePinnedNote(id: string) {
  const user = await requireUser();

  const existing = await prisma.note.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) return;

  await prisma.note.update({
    where: { id },
    data: { pinned: !existing.pinned },
  });

  revalidatePath("/notes");
}

export async function moveNoteToImportance(id: string, importance: Importance) {
  const user = await requireUser();

  await prisma.note.update({
    where: { id },
    data: { importance },
  });

  revalidatePath("/notes");
}
