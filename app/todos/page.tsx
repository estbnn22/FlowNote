// app/todos/page.tsx
import SideBar from "@/components/sideBar";
import MobileNav from "@/components/mobileBar";
import { stackServerApp } from "@/stack/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TodoBoard from "@/components/ToDoBoard";
import { createTodo } from "../actions/todos/actions";

export default async function TodosPage() {
  const user = await stackServerApp.getUser();
  if (!user) redirect("/signIn");

  const todos = await prisma.toDo.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  // serialize dates for client
  const clientTodos = todos.map((t) => ({
    id: t.id,
    title: t.title,
    importance: t.importance,
    status: t.status,
    dueAt: t.dueAt ? t.dueAt.toISOString() : null,
  }));

  return (
    <div className="min-h-screen bg-base-100 text-white">
      <SideBar currentPage="/todos" />

      <main className="md:ml-64 px-4 pb-20 pt-6 md:px-10 md:pt-10 mb-10 md:mb-0">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold">To-Dos</h1>
          <p className="mt-2 text-sm text-neutral/70">
            Drag tasks between priorities, track progress, and never miss a due
            date.
          </p>
        </header>

        {/*  Add new task form */}
        <section className="mb-8 rounded-2xl border border-base-300/60 bg-base-200/70 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-neutral mb-2">
            Add a new task
          </h2>
          <p className="text-[11px] text-neutral/60 mb-3">
            Capture what you need to get done and choose its priority and due
            date.
          </p>

          <form action={createTodo} className="space-y-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral/70">Title</label>
              <input
                name="title"
                type="text"
                required
                className="rounded-lg border border-base-300 bg-base-300/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
                placeholder="Task title..."
              />
            </div>

            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div className="flex items-center gap-2 text-xs text-neutral/70">
                <span>Importance:</span>
                <select
                  name="importance"
                  defaultValue="MEDIUM"
                  className="rounded-lg border border-base-300 bg-base-300/60 px-2 py-1"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              <div className="flex items-center gap-2 text-xs text-neutral/70">
                <span>Due date (optional):</span>
                <input
                  type="datetime-local"
                  name="dueAt"
                  className="rounded-lg border border-base-300 bg-base-300/60 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary/60"
                />
              </div>

              <button
                type="submit"
                className="md:ml-auto rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-content shadow shadow-primary/30 transition hover:bg-primary-focus"
              >
                Add task
              </button>
            </div>
          </form>
        </section>

        {/* 🔹 Board with columns, DnD, icons, due dates */}
        <section className="rounded-2xl border border-base-300/60 bg-base-200/70 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-neutral mb-3">
            Your board
          </h2>
          <TodoBoard initialTodos={clientTodos} />
        </section>
      </main>

      <MobileNav currentPage="/todos" />
    </div>
  );
}
