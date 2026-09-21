import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getSupabase } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  head: () => ({
    meta: [
      { title: "Reset Your Password | Guide Me Through" },
      { name: "description", content: "Choose a new password for your Guide Me Through account after using the password reset email." },
      { property: "og:title", content: "Reset Your Password | Guide Me Through" },
      { property: "og:description", content: "Choose a new password for your Guide Me Through account." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.guidemethrough.org/reset-password" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://www.guidemethrough.org/reset-password" }],
  }),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const supabase = await getSupabase();
      const hash = window.location.hash;
      if (!hash.includes("type=recovery")) {
        if (mounted) setInvalid(true);
        return;
      }
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY" && mounted) setReady(true);
      });
      // In case the session was already established before the listener attached
      const { data } = await supabase.auth.getSession();
      if (mounted && data.session) setReady(true);
      return () => subscription.unsubscribe();
    })();
    return () => { mounted = false; };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    if (password !== confirm) { toast.error("Passwords do not match."); return; }
    setBusy(true);
    const supabase = await getSupabase();
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
    } else {
      setDone(true);
      toast.success("Password updated!");
      setTimeout(() => navigate({ to: "/dashboard" }), 1500);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground font-serif text-lg">P</div>
          <span className="serif text-xl">PaperPath</span>
        </Link>

        {invalid ? (
          <div>
            <h1 className="text-2xl">Invalid or expired link</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This password reset link is missing, already used, or has expired. Request a fresh one from the sign-in page.
            </p>
            <Link to="/auth" search={{ next: undefined }}>
              <Button className="mt-6 w-full">Back to sign in</Button>
            </Link>
          </div>
        ) : done ? (
          <div>
            <h1 className="text-2xl">Password updated ✅</h1>
            <p className="mt-2 text-sm text-muted-foreground">Taking you to your dashboard…</p>
          </div>
        ) : ready ? (
          <div>
            <h1 className="text-2xl">Choose a new password</h1>
            <p className="mt-1 text-sm text-muted-foreground">Must be at least 8 characters.</p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label>New password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Confirm new password</Label>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <Button className="w-full" disabled={busy}>{busy ? "Updating…" : "Update password"}</Button>
            </form>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Checking your reset link…</p>
        )}
      </div>
    </div>
  );
}
