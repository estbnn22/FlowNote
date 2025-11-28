import Link from "next/link";
import { NotebookPen, ListTodo, CalendarCheck, ArrowRight } from "lucide-react";
import { stackServerApp } from "@/stack/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const User = await stackServerApp.getUser();
  if (User) {
    redirect("/dashboard");
  }
  return (
    <main className="relative min-h-screen overflow-hidden bg-base-100 text-white">
      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-32 top-40 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-base-100 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-6 pb-16 pt-24 md:px-10 md:pt-28">
        {/* Hero */}
        <section className="mt-6 grid gap-10 md:mt-10 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:items-center">
          {/* Left: Text */}
          <div className="space-y-6">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Stay organized.
              <span className="block text-primary">Stay in flow.</span>
            </h1>

            <p className="max-w-xl text-base text-neutral/80 sm:text-lg">
              FlowNote brings your{" "}
              <span className="text-neutral/50">to-dos</span>,{" "}
              <span className="text-neutral/50">notes</span>, and{" "}
              <span className="text-neutral/50">planner</span> into a single,
              sleek workspace — so you can think clearly and move faster.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-content shadow-lg shadow-primary/30 transition hover:bg-primary-focus"
              >
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Small hint */}
            <p className="text-xs text-neutral/60">
              No clutter. No distractions. Just your day — beautifully
              organized.
            </p>
          </div>

          {/* Right: Fake “app preview” card */}
          <div className="relative">
            <div className="pointer-events-none absolute -inset-4 rounded-[2rem] border border-primary/20 blur-sm" />
            <div className="relative rounded-[1.8rem] border border-base-300/60 bg-base-200/80 p-4 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-base-300/60 pb-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-neutral/60">
                    Today
                  </p>
                  <p className="text-sm font-medium text-neutral">
                    Focus Session
                  </p>
                </div>
                <span className="rounded-full bg-primary/15 px-3 py-1 text-[11px] font-medium text-primary">
                  In Progress
                </span>
              </div>

              <div className="mt-4 space-y-3 text-sm">
                <PreviewRow
                  icon={ListTodo}
                  label="Deep Work Block"
                  meta="3 tasks · 09:00 – 11:00"
                />
                <PreviewRow
                  icon={NotebookPen}
                  label="Project Notes – FlowNote v1"
                  meta="Updated 12 min ago"
                />
                <PreviewRow
                  icon={CalendarCheck}
                  label="Weekly Planning"
                  meta="Tomorrow · 18:30"
                />
              </div>

              <div className="mt-6 flex items-center justify-between rounded-xl border border-base-300/60 bg-base-300/40 px-3 py-2">
                <p className="text-xs text-neutral/70">
                  All your tasks, notes & schedule in one timeline.
                </p>
                <span className="rounded-lg bg-primary/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                  Flow View
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mt-14 grid gap-5 md:grid-cols-3">
          <FeatureCard
            icon={NotebookPen}
            title="Capture everything"
            desc="Quickly jot down notes, ideas and meeting points without losing context."
          />
          <FeatureCard
            icon={ListTodo}
            title="Turn ideas into action"
            desc="Convert notes into actionable to-dos and keep priorities crystal clear."
          />
          <FeatureCard
            icon={CalendarCheck}
            title="Plan with intention"
            desc="See tasks, notes and events in one cohesive planner view."
          />
        </section>
      </div>
    </main>
  );
}

type FeatureCardProps = {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  desc: string;
};

function FeatureCard({ icon: Icon, title, desc }: FeatureCardProps) {
  return (
    <div className="group rounded-2xl border border-base-300/60 bg-base-200/60 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
        <Icon className="h-4 w-4 text-primary" strokeWidth={2.2} />
      </div>
      <h3 className="text-sm font-semibold text-neutral">{title}</h3>
      <p className="mt-1 text-xs text-neutral/70">{desc}</p>
    </div>
  );
}

type PreviewRowProps = {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  meta: string;
};

function PreviewRow({ icon: Icon, label, meta }: PreviewRowProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-base-300/40 bg-base-300/30 px-3 py-2">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-base-100/70">
          <Icon className="h-4 w-4 text-neutral/80" strokeWidth={2.1} />
        </div>
        <div className="space-y-0.5">
          <p className="text-xs font-medium text-neutral">{label}</p>
          <p className="text-[11px] text-neutral/60">{meta}</p>
        </div>
      </div>
      <span className="h-2 w-2 rounded-full bg-primary/80" />
    </div>
  );
}
