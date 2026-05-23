import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { BookOpen, LineChart, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Guide Me Through — Sri Lankan A/L Study Companion & AI Tutor" },
      { name: "description", content: "Guide Me Through is the study companion for Sri Lankan A/L students: log every paper, watch your progress climb, and ask the built-in AI tutor anything." },
      { property: "og:title", content: "Guide Me Through — Sri Lankan A/L Study Companion" },
      { property: "og:description", content: "Track A/L progress paper-by-paper and learn with an AI tutor." },
      { property: "og:url", content: "https://www.guidemethrough.org/" },
    ],
    links: [{ rel: "canonical", href: "https://www.guidemethrough.org/" }],
  }),
});

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground font-serif text-lg">P</div>
          <span className="serif text-xl">PaperPath</span>
        </div>
        <div className="flex gap-2">
          <Link to="/auth"><Button variant="ghost">Sign in</Button></Link>
          <Link to="/auth"><Button>Get started</Button></Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pt-16 pb-24">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Sri Lanka · G.C.E. Advanced Level</p>
        <h1 className="mt-4 text-5xl leading-[1.05] md:text-7xl">
          Study the A/L the way<br />a thoughtful student would.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Pick your stream, log your subject marks paper-by-paper, watch your progress line climb,
          and ask the AI tutor whenever a concept doesn't sit right.
        </p>
        <div className="mt-8 flex gap-3">
          <Link to="/auth"><Button size="lg">Create your study journal</Button></Link>
        </div>

        <div className="mt-20 grid gap-6 md:grid-cols-3">
          {[
            { icon: BookOpen, t: "Your stream, your subjects", d: "Physical Science, Biology, Technology or Commerce — then add whichever subjects you actually sit." },
            { icon: LineChart, t: "Progress you can see", d: "Every paper, term test and model paper plotted so you know if you're trending up." },
            { icon: Sparkles, t: "AI tutor on call", d: "Stuck on Combined Maths or organic chem? Ask in plain English (or Sinhala/Tamil words) and get a worked answer." },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-lg border bg-card p-6">
              <Icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 text-xl">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </main>
      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-6 text-sm text-muted-foreground">
          © {new Date().getFullYear()} PaperPath. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
