import Image from "next/image";
import {
  Blocks,
  NotebookPen,
  ListTodo,
  CalendarCheck,
  Settings,
} from "lucide-react";
import Link from "next/link";

type SideBarProps = {
  currentPage?: string;
};

export default function SideBar({ currentPage = "/" }: SideBarProps) {
  const pages = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Blocks,
    },
    {
      name: "Notes",
      href: "/notes",
      icon: NotebookPen,
    },
    {
      name: "To-Do",
      href: "/todos",
      icon: ListTodo,
    },
    {
      name: "Planner",
      href: "/planner",
      icon: CalendarCheck,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ];

  return (
    <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 flex-col bg-base-200/80 backdrop-blur-xl border-r border-base-300/60 px-5 py-6 z-20">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 mb-8">
        <div className="relative h-10 w-10">
          <Image
            src="/NoteBookLogo.png"
            alt="FlowNote logo"
            fill
            className="object-contain"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-semibold tracking-tight text-white">
            FlowNote
          </span>
          <span className="text-[11px] uppercase tracking-[0.16em] text-neutral">
            Tasks · Notes · Planner
          </span>
        </div>
      </Link>

      {/* Nav */}
      <nav className="space-y-1">
        <p className="px-2 pb-1 text-[11px] font-medium tracking-[0.18em] text-neutral uppercase">
          Main
        </p>

        {pages.map((item) => {
          const isActive = currentPage === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150
                ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-neutral hover:bg-base-300/70 hover:text-primary"
                }
              `}
            >
              {/* Active indicator bar */}
              <span
                className={`absolute left-0 top-1/2 -translate-y-1/2 h-7 w-[3px] rounded-full transition-all duration-150
                  ${
                    isActive
                      ? "bg-primary"
                      : "bg-transparent group-hover:bg-primary/60"
                  }
                `}
              />

              <Icon
                className={`h-4 w-4 shrink-0 transition-colors
                  ${
                    isActive
                      ? "text-primary"
                      : "text-neutral/60 group-hover:text-primary"
                  }
                `}
                strokeWidth={2.2}
              />

              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
