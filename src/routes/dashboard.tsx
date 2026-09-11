import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { friendlyError } from "@/lib/error-messages";
import { Plus, TrendingUp, TrendingDown, Minus, FileDown, FileText } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getSupabase } from "@/lib/supabase-browser";
import { useAuth } from "@/lib/auth-context";
import { streamLabel } from "@/lib/streams";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { exportCSV, exportPDF, type ExportSubject } from "@/lib/export";

type Profile = { id: string; username: string; stream: string | null };
type Subject = { id: string; name: string };
type Mark = { id: string; subject_id: string; exam_name: string; marks: number; max_marks: number; exam_date: string };

export const Route = createFileRoute("/dashboard")({
  component: () => <AppShell><DashboardInner /></AppShell>,
  head: () => ({
    meta: [
      { title: "Study Dashboard — Track A/L Marks | Guide Me Through" },
      { name: "description", content: "See every A/L subject in your stream, log paper marks and follow your progress trends in one study dashboard." },
      { property: "og:title", content: "Study Dashboard — Track A/L Marks | Guide Me Through" },
      { property: "og:description", content: "Track marks and progress across all your A/L subjects." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.guidemethrough.org/dashboard" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://www.guidemethrough.org/dashboard" }],
  }),
});

function DashboardInner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSubject, setNewSubject] = useState("");

  async function load() {
    if (!user) return;
    const supabase = await getSupabase();
    const [p, s, m] = await Promise.all([
      supabase.from("profiles").select("id, username, stream").eq("id", user.id).maybeSingle(),
      supabase.from("subjects").select("id, name").eq("user_id", user.id).order("created_at"),
      supabase.from("marks").select("id, subject_id, exam_name, marks, max_marks, exam_date").eq("user_id", user.id).order("exam_date"),
    ]);
    if (p.data) setProfile(p.data as Profile);
    if (s.data) setSubjects(s.data as Subject[]);
    if (m.data) setMarks(m.data as Mark[]);
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user]);

  useEffect(() => {
    if (!loading && profile && !profile.stream) navigate({ to: "/onboarding" });
  }, [loading, profile, navigate]);

  if (loading) return <div className="text-muted-foreground">Loading…</div>;

  async function addSubject() {
    const name = newSubject.trim();
    if (!name || !user) return;
    if (name.length > 60) { toast.error("Keep it under 60 chars."); return; }
    const supabase = await getSupabase();
    const { data, error } = await supabase.from("subjects").insert({ user_id: user.id, name }).select().single();
    if (error) { toast.error(friendlyError(error)); return; }
    setSubjects((arr) => [...arr, data as Subject]);
    setNewSubject("");
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground sm:text-sm">{streamLabel(profile?.stream)} Stream</p>
          <h1 className="mt-1 text-3xl sm:text-4xl">Hi, {profile?.username}.</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">Here are your subjects and how each is trending.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            if (!subjects.length) { toast.error("Nothing to export yet."); return; }
            const data: ExportSubject[] = subjects.map((s) => ({
              name: s.name,
              marks: marks.filter((m) => m.subject_id === s.id).map((m) => ({
                exam_name: m.exam_name, marks: m.marks, max_marks: m.max_marks, exam_date: m.exam_date,
              })),
            }));
            exportPDF(data, { username: profile?.username });
          }}><FileText className="mr-1 h-4 w-4" /> Export PDF</Button>
          <Button variant="outline" size="sm" onClick={() => {
            if (!subjects.length) { toast.error("Nothing to export yet."); return; }
            const data: ExportSubject[] = subjects.map((s) => ({
              name: s.name,
              marks: marks.filter((m) => m.subject_id === s.id).map((m) => ({
                exam_name: m.exam_name, marks: m.marks, max_marks: m.max_marks, exam_date: m.exam_date,
              })),
            }));
            exportCSV(data);
          }}><FileDown className="mr-1 h-4 w-4" /> Export CSV</Button>
          <Button variant="outline" size="sm" onClick={() => navigate({ to: "/onboarding" })}>Change stream</Button>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <Input
          placeholder="Add a subject (e.g. Combined Mathematics)"
          value={newSubject}
          onChange={(e) => setNewSubject(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addSubject()}
          className="max-w-sm"
        />
        <Button onClick={addSubject}><Plus className="mr-1 h-4 w-4" /> Add</Button>
      </div>

      {subjects.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed bg-card/50 p-12 text-center">
          <p className="serif text-2xl">No subjects yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Add the subjects you sit for to start tracking marks.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s) => {
            const sm = marks.filter((m) => m.subject_id === s.id);
            const last = sm[sm.length - 1];
            const prev = sm[sm.length - 2];
            const pct = last ? Math.round((last.marks / last.max_marks) * 100) : null;
            const delta = last && prev ? pct! - Math.round((prev.marks / prev.max_marks) * 100) : 0;
            const Trend = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
            return (
              <Link key={s.id} to="/subject/$id" params={{ id: s.id }}
                className="group rounded-lg border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-sm">
                <p className="serif text-2xl">{s.name}</p>
                <div className="mt-6 flex items-end justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Latest</p>
                    <p className="serif text-4xl">{pct !== null ? `${pct}%` : "—"}</p>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Trend className="h-4 w-4" />
                    {sm.length === 0 ? "no marks" : delta === 0 ? "first or flat" : `${delta > 0 ? "+" : ""}${delta} pts`}
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{sm.length} {sm.length === 1 ? "entry" : "entries"}</p>
              </Link>
            );
          })}
          <QuickAddMarkCard subjects={subjects} onAdded={load} />
        </div>
      )}
    </div>
  );
}

function QuickAddMarkCard({ subjects, onAdded }: { subjects: Subject[]; onAdded: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [examName, setExamName] = useState("");
  const [marks, setMarks] = useState("");
  const [maxMarks, setMaxMarks] = useState("100");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex min-h-[180px] flex-col items-center justify-center rounded-lg border border-dashed bg-card/40 p-6 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
          <Plus className="h-6 w-6" />
          <span className="mt-2 text-sm">Log a paper</span>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Log a paper</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Subject</Label>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm">
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="space-y-2"><Label>Paper / exam name</Label><Input value={examName} onChange={(e) => setExamName(e.target.value)} placeholder="2024 1st term test · MCQ" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Marks</Label><Input type="number" value={marks} onChange={(e) => setMarks(e.target.value)} /></div>
            <div className="space-y-2"><Label>Out of</Label><Input type="number" value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} /></div>
          </div>
          <div className="space-y-2"><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <Button
            className="w-full"
            disabled={busy}
            onClick={async () => {
              if (!user || !subjectId || !examName.trim()) { toast.error("Fill all fields."); return; }
              const m = Number(marks), mm = Number(maxMarks);
              if (!Number.isFinite(m) || !Number.isFinite(mm) || mm <= 0 || m < 0 || m > mm) {
                toast.error("Check the mark values."); return;
              }
              setBusy(true);
              const supabase = await getSupabase();
              const { error } = await supabase.from("marks").insert({
                user_id: user.id, subject_id: subjectId, exam_name: examName.trim(),
                marks: m, max_marks: mm, exam_date: date,
              });
              setBusy(false);
              if (error) { toast.error(friendlyError(error)); return; }
              toast.success("Mark logged.");
              setExamName(""); setMarks("");
              setOpen(false);
              onAdded();
            }}
          >Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
