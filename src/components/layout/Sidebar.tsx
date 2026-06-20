"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import PushNotificationToggle from "@/components/PushNotificationToggle";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: "⊞" },
  { name: "Units", href: "/dashboard/units", icon: "🏠" },
  { name: "Residents", href: "/dashboard/residents", icon: "👥" },
  { name: "Codes & Numbers", href: "/dashboard/codes", icon: "🔑" },
  { name: "Maintenance/Request", href: "/dashboard/maintenance", icon: "🔧" },
  { name: "Announcements", href: "/dashboard/announcements", icon: "📣" },
  { name: "Documents", href: "/dashboard/documents", icon: "📁" },
  { name: "Votes", href: "/dashboard/votes", icon: "🗳️" },
  { name: "Property Managers", href: "/dashboard/property-managers", icon: "🏢" },
  { name: "Settings", href: "/dashboard/settings", icon: "⚙️" },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  const navContent = (
    <>
      <div className="px-4 py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">H</span>
          </div>
          <span className="font-semibold text-foreground text-sm">HOA Manager</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navigation.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-primary"
                  : "text-muted-foreground hover:bg-background hover:text-foreground"
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-border space-y-1">
        <PushNotificationToggle />
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-background hover:text-foreground w-full transition-colors"
          >
            <span className="text-base">🚪</span>
            Sign out
          </button>
        </form>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar — always visible on lg+ */}
      <aside className="hidden lg:flex w-72 bg-card border-r border-border flex-col h-screen sticky top-0 shrink-0">
        {navContent}
      </aside>

      {/* Mobile drawer overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-card flex flex-col h-screen transition-transform duration-300 lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-muted-foreground hover:bg-secondary"
          aria-label="Close menu"
        >
          ✕
        </button>
        {navContent}
      </aside>
    </>
  );
}
