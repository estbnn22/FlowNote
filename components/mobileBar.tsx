"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  Blocks,
  NotebookPen,
  ListTodo,
  CalendarCheck,
  Settings,
} from "lucide-react";

type MobileNavProps = {
  currentPage?: string;
};

const baseNavItemClasses =
  "group flex flex-1 flex-col items-center justify-center gap-1 py-1";

const baseIconWrapperClasses =
  "flex h-9 w-9 items-center justify-center rounded-full transition-all duration-150";

const baseLabelClasses = "text-[10px] font-medium tracking-wide";

export default function MobileNav({
  currentPage = "/dashboard",
}: MobileNavProps) {
  const [isFabOpen, setIsFabOpen] = useState(false);

  const leftPages = [
    { name: "Dashboard", href: "/dashboard", icon: Blocks },
  ];

  const rightPages = [
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const quickActions = [
    {
      label: "New Note",
      href: "/notes",
      icon: NotebookPen,
    },
    {
      label: "New To-Do",
      href: "/todos",
      icon: ListTodo,
    },
    {
      label: "New Plan",
      href: "/planner",
      icon: CalendarCheck,
    },
    {
      label: "New Habit",
      href: "/habits",
      icon: BriefcaseBusiness,
    },
  ];

  const renderNavLink = (item: { name: string; href: string; icon: any }) => {
    const isActive = currentPage === item.href;
    const Icon = item.icon;

    return (
      <Link key={item.href} href={item.href} className={baseNavItemClasses}>
        <div
          className={
            baseIconWrapperClasses +
            " " +
            (isActive
              ? "bg-primary/20 text-primary"
              : "bg-transparent text-neutral/70 group-hover:bg-base-300/80 group-hover:text-primary")
          }
        >
          <Icon className="h-4 w-4" strokeWidth={2.2} />
        </div>

        <span
          className={
            baseLabelClasses +
            " " +
            (isActive
              ? "text-primary"
              : "text-neutral/60 group-hover:text-primary")
          }
        >
          {item.name}
        </span>
      </Link>
    );
  };

  return (
    <nav
      className="
        fixed bottom-4 left-1/2 z-40 flex
        w-[92%] max-w-md -translate-x-1/2 items-center justify-between
        rounded-2xl border border-base-300/50 bg-base-200/25
        px-3 py-2 shadow-[0_18px_60px_rgba(0,0,0,0.55)]
        backdrop-blur-xs
        md:hidden
      "
    >
      {/* left links */}
      <div className="flex flex-1 items-center justify-start">
        {leftPages.map(renderNavLink)}
      </div>

      {/* centered FAB + quick actions */}
      <div className="relative flex flex-none items-center justify-center px-1">
        {/* quick actions menu */}
        {isFabOpen && (
          <div className="absolute -top-3 flex -translate-y-full flex-col items-center gap-2">
            {quickActions.map((action) => {
              const ActionIcon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-1 bg-base-200/50 rounded-xl py-1 px-3"
                  onClick={() => setIsFabOpen(false)}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-base-300 bg-base-200/90 shadow-md">
                    <ActionIcon className="h-4 w-4" strokeWidth={2.1} />
                  </div>
                  <span className="text-[9px] font-medium text-neutral/70">
                    {action.label}
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {/* FAB button */}
        <button
          type="button"
          aria-label="Quick add"
          onClick={() => setIsFabOpen((prev) => !prev)}
          className="btn btn-lg btn-circle btn-primary shadow-[0_12px_30px_rgba(0,0,0,0.6)]"
        >
          <svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            className={`size-6 transition-transform duration-150 ${
              isFabOpen ? "rotate-45" : "rotate-0"
            }`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
        </button>
      </div>

      {/* right links */}
      <div className="flex flex-1 items-center justify-end">
        {rightPages.map(renderNavLink)}
      </div>
    </nav>
  );
}
