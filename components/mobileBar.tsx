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
  "group flex flex-1 flex-col items-center justify-center gap-0.5 py-1";

const baseIconWrapperClasses =
  "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-150";

const baseLabelClasses = "text-[10px] font-medium tracking-wide";

export default function MobileNav({
  currentPage = "/dashboard",
}: MobileNavProps) {
  const [isQuickOpen, setIsQuickOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: Blocks },
    { name: "Notes", href: "/notes", icon: NotebookPen },
    { name: "Todos", href: "/todos", icon: ListTodo },
    { name: "Planner", href: "/planner", icon: CalendarCheck },
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
              ? "bg-primary/15 text-primary shadow-sm"
              : "bg-transparent text-neutral/60 group-hover:bg-base-300/70 group-hover:text-primary")
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
              : "text-neutral/55 group-hover:text-primary")
          }
        >
          {item.name}
        </span>
      </Link>
    );
  };

  return (
    <>
      {/* Bottom nav bar */}
      <nav
        className="
          fixed bottom-3 left-1/2 z-40 flex
          w-[92%] max-w-md -translate-x-1/2 items-center justify-between
          rounded-2xl border border-base-300/60 bg-base-200/80
          px-3 py-2 shadow-[0_18px_60px_rgba(0,0,0,0.45)]
          backdrop-blur-md
          md:hidden
        "
      >
        <div className="flex w-full items-center justify-between gap-1">
          {navItems.map(renderNavLink)}
        </div>
      </nav>

      {/* Floating + button for quick add */}
      <button
        type="button"
        aria-label="Quick add"
        onClick={() => setIsQuickOpen(true)}
        className="
          fixed bottom-16 right-5 z-50 md:hidden
          btn btn-primary btn-circle shadow-[0_12px_30px_rgba(0,0,0,0.6)]
        "
      >
        <svg
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          className="size-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
      </button>

      {/* Quick actions bottom sheet */}
      {isQuickOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:hidden">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close quick actions"
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsQuickOpen(false)}
          />

          <div
            className="
              relative z-10 mb-2 w-full max-w-md
              rounded-t-2xl border border-base-300 bg-base-200/95
              px-4 pb-4 pt-3 shadow-[0_-18px_60px_rgba(0,0,0,0.7)]
            "
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral/60">
                Quick actions
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => setIsQuickOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => {
                const ActionIcon = action.icon;
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex items-center gap-2 rounded-xl border border-base-300/70 bg-base-100/80 px-3 py-2 text-left shadow-sm"
                    onClick={() => setIsQuickOpen(false)}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-base-200">
                      <ActionIcon className="h-4 w-4" strokeWidth={2.1} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold text-neutral/80">
                        {action.label}
                      </span>
                      <span className="text-[9px] text-neutral/60">
                        Tap to create
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}