import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Send, Sparkles, BookOpen, Loader2, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { AppShell } from "@/components/AppShell";
import { getSupabase } from "@/lib/supabase-browser";
import { useAuth } from "@/lib/auth-context";
import { streamLabel } from "@/lib/streams";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export const Route = createFileRoute("/tutor")({ component: () => <AppShell><TutorInner /></AppShell> });

type SubjectStat = { name: string; avg: number | null; latest: number | null; best: number | null; count: number };
type StudyResource = { title: string; url: string; note: string };
type FindResourcesOutput = { subject: string; topic: string | null; resources: StudyResource[] };

function TutorInner() {
  const { user } = useAuth();
  const [stream, setStream] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<SubjectStat[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const supabase = await getSupabase();
      const [{ data: profile }, { data: subs }, { data: marks }] = await Promise.all([
        supabase.from("profiles").select("stream").eq("id", user.id).maybeSingle(),
        supabase.from("subjects").select("id, name").eq("user_id", user.id),
        supabase.from("marks").select("subject_id, marks, max_marks, exam_date").eq("user_id", user.id).order("exam_date"),
      ]);
      setStream(profile?.stream ?? null);
      const byId = new Map<string, { marks: number; max_marks: number }[]>();
      (marks ?? []).forEach((m) => {
        const arr = byId.get(m.subject_id) ?? [];
        arr.push({ marks: Number(m.marks), max_marks: Number(m.max_marks) });
        byId.set(m.subject_id, arr);
      });
      const stats: SubjectStat[] = (subs ?? []).map((s) => {
        const ms = byId.get(s.id) ?? [];
        const pcts = ms.map((m) => Math.round((m.marks / m.max_marks) * 100));
        return {
          name: s.name,
          count: pcts.length,
          latest: pcts.length ? pcts[pcts.length - 1] : null,
          avg: pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : null,
          best: pcts.length ? Math.max(...pcts) : null,
        };
      });
      setSubjects(stats);
    })();
  }, [user]);

  const transport = useMemo(
    () => new DefaultChatTransport({
      api: "/api/chat",
      body: () => ({ stream: stream ? streamLabel(stream) : undefined, subjects }),
    }),
    [stream, subjects],
  );

  const { messages, sendMessage, status, error } = useChat({ transport });

  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, status]);

  const busy = status === "submitted" || status === "streaming";

  const examples = subjects.length
    ? [
        `Give me a 2-week study plan for ${subjects[0]?.name}.`,
        `What should I revise first across my subjects?`,
        `Suggest study resources for ${subjects[0]?.name}.`,
        `Common exam tricks for ${subjects[0]?.name} past papers?`,
      ]
    : [
        "Explain SHM with a worked example.",
        "How do I solve an integration by parts problem?",
        "Difference between meiosis and mitosis?",
        "What is opportunity cost? Give a real example.",
      ];

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl">AI Tutor</h1>
          <p className="text-xs text-muted-foreground">
            {stream ? streamLabel(stream) : "Stream not set"}
            {subjects.length > 0 && ` · ${subjects.length} subject${subjects.length === 1 ? "" : "s"} in context`}
          </p>
        </div>
      </div>

      {subjects.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {subjects.map((s) => (
            <span key={s.name} className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs">
              <BookOpen className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium">{s.name}</span>
              <span className="text-muted-foreground">
                {s.count > 0 ? `avg ${s.avg}%` : "no marks"}
              </span>
            </span>
          ))}
        </div>
      )}

      <div className="mt-6 flex-1 overflow-y-auto rounded-lg border bg-card/40 p-6">
        {messages.length === 0 ? (
          <div className="grid h-full place-items-center text-center">
            <div>
              <p className="serif text-3xl">Ask me anything about your A/L subjects.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                I'll use your subjects and marks as context, and cite sources when I suggest study tips.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {examples.map((q) => (
                  <button key={q}
                    onClick={() => sendMessage({ text: q })}
                    className="rounded-full border bg-background px-4 py-2 text-sm text-muted-foreground hover:bg-muted">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((m) => <MessageBubble key={m.id} message={m} />)}
            {busy && messages.at(-1)?.role === "user" && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-lg border bg-background px-4 py-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
                </div>
              </div>
            )}
            {error && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                Something went wrong. Try again.
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <form
        className="mt-4 flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const t = input.trim();
          if (!t || busy) return;
          sendMessage({ text: t });
          setInput("");
        }}
      >
        <Textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              const t = input.trim();
              if (!t || busy) return;
              sendMessage({ text: t });
              setInput("");
            }
          }}
          placeholder="Ask anything about your A/L subjects…"
          className="min-h-[52px] resize-none"
        />
        <Button type="submit" disabled={busy || !input.trim()} size="lg">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

type ChatMessage = ReturnType<typeof useChat>["messages"][number];

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  type Part = ChatMessage["parts"][number];
  const textParts: string[] = [];
  const toolParts: { id: string; state: string; output?: FindResourcesOutput }[] = [];

  for (const p of message.parts as Part[]) {
    if (p.type === "text") {
      textParts.push(p.text);
    } else if (p.type === "tool-findStudyResources") {
      const tp = p as { toolCallId: string; state: string; output?: FindResourcesOutput };
      toolParts.push({ id: tp.toolCallId, state: tp.state, output: tp.output });
    }
  }
  const text = textParts.join("");

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] space-y-3 rounded-lg px-4 py-3 text-sm leading-relaxed ${
        isUser ? "bg-primary text-primary-foreground" : "bg-background border"
      }`}>
        {toolParts.map((tp) => <SourcesCard key={tp.id} state={tp.state} output={tp.output} />)}
        {text ? (
          isUser ? (
            <div className="whitespace-pre-wrap">{text}</div>
          ) : (
            <div className="prose prose-sm max-w-none prose-p:my-2 prose-headings:mt-4 prose-headings:mb-2 prose-li:my-0.5 prose-code:before:hidden prose-code:after:hidden">
              <ReactMarkdown>{text}</ReactMarkdown>
            </div>
          )
        ) : (
          !toolParts.length && <span className="text-muted-foreground">Thinking…</span>
        )}
      </div>
    </div>
  );
}

function SourcesCard({ state, output }: { state: string; output?: FindResourcesOutput }) {
  if (state !== "output-available" || !output) {
    return (
      <div className="inline-flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> Looking up study resources…
      </div>
    );
  }
  return (
    <div className="rounded-md border bg-muted/30 p-3">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Sources for {output.subject}{output.topic ? ` · ${output.topic}` : ""}
      </p>
      <ul className="mt-2 space-y-2">
        {output.resources.map((r) => (
          <li key={r.url} className="text-xs">
            <a href={r.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-foreground hover:underline">
              {r.title} <ExternalLink className="h-3 w-3" />
            </a>
            <p className="mt-0.5 text-muted-foreground">{r.note}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
