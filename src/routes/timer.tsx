import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Coffee, BookOpen } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/timer")({
  component: () => <AppShell><TimerInner /></AppShell>,
  head: () => ({
    meta: [
      { title: "Study Timer — Focus & Break Sessions | Guide Me Through" },
      { name: "description", content: "Stay focused with a Pomodoro-style study timer. Set focus and break lengths, track completed sessions, and build consistent A/L study habits." },
      { property: "og:title", content: "Study Timer — Focus & Break Sessions | Guide Me Through" },
      { property: "og:description", content: "Pomodoro-style focus and break timer for A/L study sessions." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.guidemethrough.org/timer" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://www.guidemethrough.org/timer" }],
  }),
});

const FOCUS_PRESETS = [15, 25, 45, 60];
const BREAK_PRESETS = [5, 10, 15];

type Mode = "focus" | "break";

function fmt(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function TimerInner() {
  const [focusMin, setFocusMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [mode, setMode] = useState<Mode>("focus");
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s > 1) return s - 1;
        // session finished
        if (intervalRef.current) clearInterval(intervalRef.current);
        setRunning(false);
        setMode((m) => {
          if (m === "focus") {
            setSessions((n) => n + 1);
            setSecondsLeft(breakMin * 60);
            return "break";
          }
          setSecondsLeft(focusMin * 60);
          return "focus";
        });
        return 0;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, focusMin, breakMin]);

  function applyDurations(focus: number, brk: number) {
    setRunning(false);
    setMode("focus");
    setFocusMin(focus);
    setBreakMin(brk);
    setSecondsLeft(focus * 60);
  }

  function reset() {
    setRunning(false);
    setSecondsLeft((mode === "focus" ? focusMin : breakMin) * 60);
  }

  function switchMode(next: Mode) {
    setRunning(false);
    setMode(next);
    setSecondsLeft((next === "focus" ? focusMin : breakMin) * 60);
  }

  const total = (mode === "focus" ? focusMin : breakMin) * 60;
  const progress = total > 0 ? 1 - secondsLeft / total : 0;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground sm:text-sm">Deep work</p>
        <h1 className="mt-1 text-3xl sm:text-4xl">Study Timer</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">Focus in bursts, rest in between — sessions keep you honest.</p>
      </div>

      <div className="mt-6 flex justify-center gap-2">
        <Button variant={mode === "focus" ? "default" : "outline"} size="sm" onClick={() => switchMode("focus")}>
          <BookOpen className="mr-1 h-4 w-4" /> Focus
        </Button>
        <Button variant={mode === "break" ? "default" : "outline"} size="sm" onClick={() => switchMode("break")}>
          <Coffee className="mr-1 h-4 w-4" /> Break
        </Button>
      </div>

      <div className="relative mx-auto mt-8 grid h-64 w-64 place-items-center rounded-full border-8 border-muted sm:h-72 sm:w-72">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(hsl(var(--primary)) ${progress * 360}deg, transparent 0deg)`,
            mask: "radial-gradient(farthest-side, transparent calc(100% - 8px), black calc(100% - 8px))",
            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 8px), black calc(100% - 8px))",
          }}
        />
        <div className="text-center">
          <p className="font-mono text-5xl tabular-nums sm:text-6xl">{fmt(secondsLeft)}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {mode === "focus" ? "Focus time" : "Break time"}
          </p>
        </div>
      </div>

      <div className="mt-8 flex justify-center gap-2">
        <Button size="lg" onClick={() => setRunning((r) => !r)}>
          {running ? <><Pause className="mr-2 h-4 w-4" /> Pause</> : <><Play className="mr-2 h-4 w-4" /> Start</>}
        </Button>
        <Button size="lg" variant="outline" onClick={reset}>
          <RotateCcw className="mr-2 h-4 w-4" /> Reset
        </Button>
      </div>

      <div className="mt-10 grid gap-4 rounded-lg border bg-card p-6 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Focus length</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {FOCUS_PRESETS.map((m) => (
              <Button key={m} size="sm" variant={focusMin === m ? "default" : "outline"} onClick={() => applyDurations(m, breakMin)}>
                {m}m
              </Button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Break length</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {BREAK_PRESETS.map((m) => (
              <Button key={m} size="sm" variant={breakMin === m ? "default" : "outline"} onClick={() => applyDurations(focusMin, m)}>
                {m}m
              </Button>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Completed focus sessions this visit: <span className="font-semibold text-foreground">{sessions}</span>
      </p>
    </div>
  );
}
