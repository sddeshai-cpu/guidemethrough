import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Trash2, Plus, FileText, FileDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { exportCSV, exportPDF } from "@/lib/export";

type Subject = { id: string; name: string };
type Mark = { id: string; exam_name: string; marks: number; max_marks: number; exam_date: string };

export const Route = createFileRoute("/subject/$id")({
  component: () => <AppShell><SubjectInner /></AppShell>,
});

function SubjectInner() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [loading, setLoading] = useState(true);

  const [examName, setExamName] = useState("");
  const [m, setM] = useState("");
  const [max, setMax] = useState("100");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!user) return;
    const [s, mk] = await Promise.all([
      supabase.from("subjects").select("id, name").eq("id", id).eq("user_id", user.id).maybeSingle(),
      supabase.from("marks").select("id, exam_name, marks, max_marks, exam_date").eq("user_id", user.id).eq("subject_id", id).order("exam_date"),
    ]);
    if (!s.data) { toast.error("Subject not found."); navigate({ to: "/dashboard" }); return; }
    setSubject(s.data as Subject);
    setMarks((mk.data ?? []) as Mark[]);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user, id]);

  if (loading) return <div className="text-muted-foreground">Loading…</div>;
  if (!subject) return null;

  const chartData = marks.map((m) => ({
    date: new Date(m.exam_date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    pct: Math.round((m.marks / m.max_marks) * 100),
    label: m.exam_name,
  }));

  const avg = marks.length ? Math.round(marks.reduce((a, m) => a + (m.marks / m.max_marks) * 100, 0) / marks.length) : 0;
  const best = marks.length ? Math.max(...marks.map((m) => Math.round((m.marks / m.max_marks) * 100))) : 0;
  const latest = chartData.at(-1)?.pct ?? 0;

  async function deleteSubject() {
    if (!confirm(`Delete ${subject!.name} and all its marks?`)) return;
    const { error } = await supabase.from("subjects").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    navigate({ to: "/dashboard" });
  }

  async function addMark() {
    if (!user || !examName.trim()) { toast.error("Enter the paper name."); return; }
    const mv = Number(m), mxv = Number(max);
    if (!Number.isFinite(mv) || !Number.isFinite(mxv) || mxv <= 0 || mv < 0 || mv > mxv) { toast.error("Check the values."); return; }
    setBusy(true);
    const { error } = await supabase.from("marks").insert({
      user_id: user.id, subject_id: id, exam_name: examName.trim(),
      marks: mv, max_marks: mxv, exam_date: date,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setExamName(""); setM("");
    load();
  }

  async function delMark(mid: string) {
    const { error } = await supabase.from("marks").delete().eq("id", mid);
    if (error) { toast.error(error.message); return; }
    setMarks((arr) => arr.filter((x) => x.id !== mid));
  }

  return (
    <div>
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Subject</p>
          <h1 className="mt-1 text-4xl">{subject.name}</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={deleteSubject}>
          <Trash2 className="mr-1 h-4 w-4" /> Delete subject
        </Button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Latest" value={`${latest}%`} />
        <Stat label="Average" value={`${avg}%`} />
        <Stat label="Best" value={`${best}%`} />
      </div>

      <div className="mt-8 rounded-lg border bg-card p-6">
        <h2 className="serif text-2xl">Progression</h2>
        {chartData.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">Log your first paper below to see the chart.</p>
        ) : (
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: -20 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }}
                  formatter={(v: number) => [`${v}%`, "Score"]}
                  labelFormatter={(_, p) => p?.[0]?.payload?.label ?? ""}
                />
                <ReferenceLine y={avg} stroke="var(--secondary)" strokeDasharray="4 4" label={{ value: `avg ${avg}%`, position: "right", fill: "var(--muted-foreground)", fontSize: 11 }} />
                <Line type="monotone" dataKey="pct" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--primary)" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="serif text-2xl">All papers</h2>
          {marks.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No marks yet.</p>
          ) : (
            <ul className="mt-4 divide-y">
              {[...marks].reverse().map((mk) => {
                const pct = Math.round((mk.marks / mk.max_marks) * 100);
                return (
                  <li key={mk.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium">{mk.exam_name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(mk.exam_date).toLocaleDateString()} · {mk.marks}/{mk.max_marks}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="serif text-xl">{pct}%</span>
                      <Button variant="ghost" size="sm" onClick={() => delMark(mk.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="serif text-2xl">Add a paper</h2>
          <div className="mt-4 space-y-3">
            <div className="space-y-1.5"><Label>Paper name</Label><Input value={examName} onChange={(e) => setExamName(e.target.value)} placeholder="2024 Term 2 · Paper I" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Marks</Label><Input type="number" value={m} onChange={(e) => setM(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Out of</Label><Input type="number" value={max} onChange={(e) => setMax(e.target.value)} /></div>
            </div>
            <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <Button className="w-full" onClick={addMark} disabled={busy}>
              <Plus className="mr-1 h-4 w-4" /> {busy ? "Saving…" : "Add mark"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 serif text-4xl">{value}</p>
    </div>
  );
}
