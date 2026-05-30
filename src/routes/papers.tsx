import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { FileDown, ExternalLink, BookOpen } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase-browser";
import { STREAMS, streamLabel, type StreamId } from "@/lib/streams";
import { STREAM_SUBJECTS, PAPER_YEARS, officialPaperUrl, officialMarkingSchemeUrl } from "@/lib/past-papers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/papers")({
  head: () => ({
    meta: [
      { title: "A/L Past Papers (2000–Present) · Guide Me Through" },
      { name: "description", content: "Browse and download official Sri Lankan G.C.E. Advanced Level past papers by stream, subject and year — from 2000 to today." },
    ],
  }),
  component: () => (
    <AppShell>
      <PapersInner />
    </AppShell>
  ),
});

function PapersInner() {
  const { user } = useAuth();
  const [stream, setStream] = useState<StreamId>("physical_science");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [yearFilter, setYearFilter] = useState<string>("all");

  // Default the stream selector to the user's saved stream.
  useEffect(() => {
    if (!user) return;
    (async () => {
      const supabase = await getSupabase();
      const { data } = await supabase.from("profiles").select("stream").eq("id", user.id).maybeSingle();
      const s = data?.stream as StreamId | undefined;
      if (s && STREAMS.some((x) => x.id === s)) setStream(s);
    })();
  }, [user]);

  const subjects = useMemo(() => {
    const all = STREAM_SUBJECTS[stream] ?? [];
    if (!subjectFilter.trim()) return all;
    const q = subjectFilter.toLowerCase();
    return all.filter((s) => s.toLowerCase().includes(q));
  }, [stream, subjectFilter]);

  const years = useMemo(() => (yearFilter === "all" ? PAPER_YEARS : [Number(yearFilter)]), [yearFilter]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground sm:text-sm">Official archive</p>
          <h1 className="mt-1 text-3xl sm:text-4xl">Past Papers</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Every G.C.E. (A/L) past paper from 2000 to today, organised by stream, subject and year. Each link opens
            the official Department of Examinations PDF — view it in your browser or save it to your device.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 rounded-lg border bg-card p-6 sm:grid-cols-3 sm:items-end">
        <div className="space-y-1">
          <Label className="text-xs">Stream</Label>
          <Select value={stream} onValueChange={(v) => setStream(v as StreamId)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STREAMS.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Year</Label>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-64">
              <SelectItem value="all">All years (2000–{PAPER_YEARS[0]})</SelectItem>
              {PAPER_YEARS.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Filter subject</Label>
          <Input value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} placeholder="e.g. Physics" />
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Showing papers for the <strong>{streamLabel(stream)}</strong> stream. Past papers are © Department of Examinations,
        Sri Lanka and are served from their official archive.
      </p>

      {subjects.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed bg-card/50 p-12 text-center">
          <p className="serif text-2xl">No subjects match that filter</p>
          <p className="mt-1 text-sm text-muted-foreground">Try clearing the subject filter.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {subjects.map((subject) => (
            <section key={subject} className="rounded-lg border bg-card">
              <header className="flex items-center gap-2 border-b px-5 py-3">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <h2 className="serif text-xl">{subject}</h2>
              </header>
              <ul className="divide-y">
                {years.map((year) => (
                  <li key={year} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                    <div>
                      <p className="font-mono text-sm">{year}</p>
                      <p className="text-xs text-muted-foreground">{subject} · G.C.E. A/L · {year}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild variant="outline" size="sm">
                        <a href={officialPaperUrl(subject, year)} target="_blank" rel="noopener noreferrer">
                          <FileDown className="mr-1 h-4 w-4" /> Paper PDF
                        </a>
                      </Button>
                      <Button asChild variant="ghost" size="sm">
                        <a href={officialMarkingSchemeUrl(subject, year)} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-1 h-4 w-4" /> Marking scheme
                        </a>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
