import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, MessageCircle, LogOut, CalendarClock, FileText } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>;
  }

  const nav = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/papers", label: "Past Papers", icon: FileText },
    { to: "/timetable", label: "Timetable", icon: CalendarClock },
    { to: "/tutor", label: "AI Tutor", icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground font-serif">P</div>
            <span className="serif text-lg">PaperPath</span>
          </Link>
          <nav className="flex items-center gap-0.5 sm:gap-1">
            {nav.map((n) => {
              const active = path.startsWith(n.to);
              return (
                <Link key={n.to} to={n.to}
                  aria-label={n.label}
                  className={`flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors sm:px-3 ${
                    active ? "bg-secondary text-secondary-foreground" : "hover:bg-muted"
                  }`}>
                  <n.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{n.label}</span>
                </Link>
              );
            })}
            <Button variant="ghost" size="sm" aria-label="Sign out" onClick={() => signOut().then(() => navigate({ to: "/" }))}>
              <LogOut className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      <footer className="mt-12 border-t">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} PaperPath. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
