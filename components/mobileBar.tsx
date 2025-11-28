"use client";

import Link from "next/link";
import {
  Blocks,
  NotebookPen,
  ListTodo,
  CalendarCheck,
  Settings,
} from "lucide-react";

type MobileNavProps = {
  currentPage?: string;
};

export default function MobileNav({
  currentPage = "/dashboard",
}: MobileNavProps) {
  const pages = [
    { name: "Notes", href: "/notes", icon: NotebookPen },
    { name: "To-Do", href: "/todos", icon: ListTodo },
    { name: "Dashboard", href: "/dashboard", icon: Blocks },
    { name: "Planner", href: "/planner", icon: CalendarCheck },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

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
      {pages.map((item) => {
        const isActive = currentPage === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className="group flex flex-1 flex-col items-center justify-center gap-1 py-1"
          >
            <div
              className={`
                flex h-9 w-9 items-center justify-center rounded-full
                transition-all duration-150
                ${
                  isActive
                    ? "bg-primary/20 text-primary"
                    : "bg-transparent text-neutral/70 group-hover:bg-base-300/80 group-hover:text-primary"
                }
              `}
            >
              <Icon className="h-4 w-4" strokeWidth={2.2} />
            </div>

            {/* tiny label under icon */}
            <span
              className={`
                text-[10px] font-medium tracking-wide
                ${
                  isActive
                    ? "text-primary"
                    : "text-neutral/60 group-hover:text-primary"
                }
              `}
            >
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
