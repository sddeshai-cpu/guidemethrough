import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { STREAMS, type StreamId } from "@/lib/streams";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/onboarding")({ component: Onboarding });

function Onboarding() {
  return <AppShell><Inner /></AppShell>;
}

function Inner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [picked, setPicked] = useState<StreamId | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-4xl">Pick your A/L stream</h1>
      <p className="mt-2 text-muted-foreground">You can add the exact subjects you sit on the next screen.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {STREAMS.map((s) => (
          <button
            key={s.id}
            onClick={() => setPicked(s.id)}
            className={`rounded-lg border bg-card p-6 text-left transition-all ${
              picked === s.id ? "ring-2 ring-primary" : "hover:border-primary/40"
            }`}
          >
            <p className="serif text-2xl">{s.label}</p>
            <p className="mt-2 text-sm text-muted-foreground">{s.blurb}</p>
          </button>
        ))}
      </div>
      <div className="mt-8 flex justify-end">
        <Button
          disabled={!picked || busy}
          onClick={async () => {
            if (!picked || !user) return;
            setBusy(true);
            const { error } = await supabase.from("profiles").update({ stream: picked }).eq("id", user.id);
            setBusy(false);
            if (error) { toast.error(error.message); return; }
            toast.success("Stream saved.");
            navigate({ to: "/dashboard" });
          }}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
