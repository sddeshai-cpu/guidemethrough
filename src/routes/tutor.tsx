import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Send, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getSupabase } from "@/lib/supabase-browser";
import { useAuth } from "@/lib/auth-context";
import { streamLabel } from "@/lib/streams";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/tutor")({ component: () => <AppShell><TutorInner /></AppShell> });

function TutorInner() {
  const { user } = useAuth();
  const [stream, setStream] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getSupabase().then((supabase) => {
      supabase.from("profiles").select("stream").eq("id", user.id).maybeSingle()
        .then(({ data }) => setStream(data?.stream ?? null));
    });
  }, [user]);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: () => ({ stream: stream ? streamLabel(stream) : undefined }),
    }),
  });

  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, status]);

  const busy = status === "submitted" || status === "streaming";

  const examples = [
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
        <div>
          <h1 className="text-2xl">AI Tutor</h1>
          <p className="text-xs text-muted-foreground">
            Stream context: {stream ? streamLabel(stream) : "not set"}
          </p>
        </div>
      </div>

      <div className="mt-6 flex-1 overflow-y-auto rounded-lg border bg-card/40 p-6">
        {messages.length === 0 ? (
          <div className="grid h-full place-items-center text-center">
            <div>
              <p className="serif text-3xl">Ask me anything about your A/L subjects.</p>
              <p className="mt-2 text-sm text-muted-foreground">Past papers, theory, problem solving — I've got you.</p>
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
            {messages.map((m) => {
              const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
              const isUser = m.role === "user";
              return (
                <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] whitespace-pre-wrap rounded-lg px-4 py-3 text-sm leading-relaxed ${
                    isUser ? "bg-primary text-primary-foreground" : "bg-background border"
                  }`}>
                    {text || <span className="text-muted-foreground">Thinking…</span>}
                  </div>
                </div>
              );
            })}
            {busy && messages.at(-1)?.role === "user" && (
              <div className="flex justify-start"><div className="rounded-lg border bg-background px-4 py-3 text-sm text-muted-foreground">Thinking…</div></div>
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
