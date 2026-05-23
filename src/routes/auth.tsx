import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { getSupabase } from "@/lib/supabase-browser";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/auth")({ component: AuthPage });

const signUpSchema = z.object({
  username: z.string().trim().min(2).max(40),
  email: z.string().trim().email(),
  password: z.string().min(1).max(72),
});
const signInSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!loading && user) navigate({ to: "/dashboard" }); }, [loading, user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 lg:grid-cols-2">
        <div className="hidden flex-col justify-between p-12 lg:flex">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground font-serif text-lg">P</div>
            <span className="serif text-xl">PaperPath</span>
          </Link>
          <div>
            <p className="serif text-4xl leading-tight">"Small daily papers, big August results."</p>
            <p className="mt-4 text-sm text-muted-foreground">— every A/L teacher, ever.</p>
          </div>
          <p className="text-xs text-muted-foreground">For students sitting the Sri Lankan G.C.E. Advanced Level.</p>
        </div>
        <div className="flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-sm">
            <h1 className="text-3xl">Welcome</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sign in or create your account.</p>
            <Tabs defaultValue="signin" className="mt-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Sign up</TabsTrigger>
              </TabsList>
              <TabsContent value="signin"><SignInForm /></TabsContent>
              <TabsContent value="signup"><SignUpForm /></TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  return (
    <form
      className="mt-4 space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const parsed = signInSchema.safeParse({ email, password });
        if (!parsed.success) { toast.error("Check your email and password."); return; }
        setBusy(true);
        const supabase = await getSupabase();
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        setBusy(false);
        if (error) toast.error(error.message);
        else toast.success("Welcome back!");
      }}
    >
      <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
      <div className="space-y-2"><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
      <Button className="w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
    </form>
  );
}

function SignUpForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  return (
    <form
      className="mt-4 space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const parsed = signUpSchema.safeParse({ username, email, password });
        if (!parsed.success) {
          toast.error(parsed.error.issues[0]?.message ?? "Invalid input.");
          return;
        }
        setBusy(true);
        const supabase = await getSupabase();
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            data: { username: parsed.data.username },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        setBusy(false);
        if (error) toast.error(error.message);
        else toast.success("Check your inbox to confirm your email, then sign in.");
      }}
    >
      <div className="space-y-2"><Label>Username</Label><Input value={username} onChange={(e) => setUsername(e.target.value)} required minLength={2} maxLength={40} /></div>
      <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
      <div className="space-y-2">
        <Label>Password</Label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={1}
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
      <Button className="w-full" disabled={busy}>{busy ? "Creating account…" : "Create account"}</Button>
    </form>
  );
}
