import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Block = { id: string; start: string; end: string; activity: string; notes: string };

export const Route = createFileRoute("/timetable")({
  component: () => <AppShell><TimetableInner /></AppShell>,
  head: () => ({
    meta: [
      { title: "Daily Study Timetable Planner | Guide Me Through" },
      { name: "description", content: "Plan your A/L study day block by block, add notes for each session and download your timetable as a PDF." },
      { property: "og:title", content: "Daily Study Timetable Planner | Guide Me Through" },
      { property: "og:description", content: "Build a daily A/L study schedule and export it as a PDF." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.guidemethrough.org/timetable" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://www.guidemethrough.org/timetable" }],
  }),
});

function storageKey(uid: string, date: string) {
  return `paperpath:timetable:${uid}:${date}`;
}

function TimetableInner() {
  const { user } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("09:00");
  const [activity, setActivity] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!user) return;
    const raw = localStorage.getItem(storageKey(user.id, date));
    setBlocks(raw ? (JSON.parse(raw) as Block[]) : []);
  }, [user, date]);

  function persist(next: Block[]) {
    setBlocks(next);
    if (user) localStorage.setItem(storageKey(user.id, date), JSON.stringify(next));
  }

  function addBlock() {
    if (!activity.trim()) { toast.error("Add an activity."); return; }
    if (start >= end) { toast.error("End time must be after start."); return; }
    const next = [...blocks, { id: crypto.randomUUID(), start, end, activity: activity.trim(), notes: notes.trim() }]
      .sort((a, b) => a.start.localeCompare(b.start));
    persist(next);
    setActivity(""); setNotes("");
  }

  function remove(id: string) {
    persist(blocks.filter((b) => b.id !== id));
  }

  function exportPDF() {
    if (!blocks.length) { toast.error("Nothing to export yet."); return; }
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("PaperPath · Daily Timetable", 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(new Date(date).toDateString(), 14, 25);
    doc.setTextColor(0);
    autoTable(doc, {
      startY: 32,
      head: [["Start", "End", "Activity", "Notes"]],
      body: blocks.map((b) => [b.start, b.end, b.activity, b.notes]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [139, 115, 85] },
      margin: { left: 14, right: 14 },
    });
    doc.save(`timetable-${date}.pdf`);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground sm:text-sm">Plan your day</p>
          <h1 className="mt-1 text-3xl sm:text-4xl">Timetable</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">Block out your study day, then download it as a PDF.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <Button variant="outline" size="sm" onClick={exportPDF}>
            <FileText className="mr-1 h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 rounded-lg border bg-card p-6 sm:grid-cols-[auto_auto_1fr_1fr_auto] sm:items-end">
        <div className="space-y-1">
          <Label className="text-xs">Start</Label>
          <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">End</Label>
          <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Activity</Label>
          <Input value={activity} onChange={(e) => setActivity(e.target.value)} placeholder="Combined Maths · Past paper" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Notes</Label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
        </div>
        <Button onClick={addBlock}><Plus className="mr-1 h-4 w-4" /> Add</Button>
      </div>

      {blocks.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed bg-card/50 p-12 text-center">
          <p className="serif text-2xl">No blocks yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Add your first time block above.</p>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-lg border bg-card">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Activity</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {blocks.map((b) => (
                <tr key={b.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">{b.start} – {b.end}</td>
                  <td className="px-4 py-3">{b.activity}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.notes || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" aria-label={`Delete ${b.activity}`} onClick={() => remove(b.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
