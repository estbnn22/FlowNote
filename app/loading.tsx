// app/loading.tsx
import SideBar from "@/components/sideBar";
import MobileNav from "@/components/mobileBar";

export default function Loading() {
  return (
    <div className="min-h-screen bg-base-100 text-white">
      {/* Desktop Sidebar Skeleton */}
      <div className="hidden md:block">
        <div className="animate-pulse">
          <SideBarSkeleton />
        </div>
      </div>

      {/* Mobile Navbar Skeleton */}
      <div className="md:hidden animate-pulse">
        <MobileNavSkeleton />
      </div>

      {/* Main Content Loading */}
      <main className="md:ml-64 px-4 py-10 md:px-10 space-y-6 animate-pulse">
        <div className="h-10 w-1/3 bg-base-300 rounded-lg" />

        <div className="grid gap-4 md:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <CardSkeleton tall />
          <CardSkeleton tall />
          <CardSkeleton tall />
        </div>
      </main>
    </div>
  );
}

// --------------------------------
// COMPONENT SKELETONS
// --------------------------------

function SideBarSkeleton() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-base-200/70 border-r border-base-300 p-4">
      <div className="h-12 bg-base-300 rounded-lg mb-6" />
      <div className="space-y-4">
        <div className="h-6 bg-base-300 rounded-lg" />
        <div className="h-6 bg-base-300 rounded-lg" />
        <div className="h-6 bg-base-300 rounded-lg" />
        <div className="h-6 bg-base-300 rounded-lg" />
      </div>
    </aside>
  );
}

function MobileNavSkeleton() {
  return (
    <div
      className="fixed bottom-4 left-1/2 z-40 flex
        w-[92%] max-w-md -translate-x-1/2 items-center justify-between
        rounded-2xl border border-base-300/60 bg-base-200/80
        px-3 py-2 shadow-[0_18px_60px_rgba(0,0,0,0.55)]
        backdrop-blur-xl"
    >
      <div className="h-8 w-8 bg-base-300 rounded-full" />
      <div className="h-8 w-8 bg-base-300 rounded-full" />
      <div className="h-8 w-8 bg-base-300 rounded-full" />
    </div>
  );
}

function CardSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div
      className={`rounded-xl bg-base-200/70 border border-base-300 p-4 shadow-sm ${
        tall ? "h-40" : "h-28"
      }`}
    >
      <div className="h-4 w-1/2 bg-base-300 rounded mb-3" />
      <div className="h-3 w-3/4 bg-base-300 rounded mb-2" />
      <div className="h-3 w-5/6 bg-base-300 rounded" />
    </div>
  );
}
