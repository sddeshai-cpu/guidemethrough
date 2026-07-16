import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { getSupabase } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";

type AuthOAuth = {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: AuthorizationDecision | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: AuthorizationDecision | null; error: { message: string } | null }>;
};

type AuthorizationDetails = {
  client?: { name?: string; client_uri?: string; redirect_uri?: string } | null;
  scopes?: string[];
  redirect_url?: string;
  redirect_to?: string;
};

type AuthorizationDecision = {
  redirect_url?: string;
  redirect_to?: string;
};

async function getOAuth(): Promise<AuthOAuth> {
  const supabase = await getSupabase();
  return (supabase.auth as unknown as { oauth: AuthOAuth }).oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const supabase = await getSupabase();
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/auth", search: { next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const oauth = await getOAuth();
    const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) {
      window.location.href = immediate;
    }
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-md p-8">
      <h1 className="text-2xl">Authorization error</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Could not load this authorization request: {String((error as Error)?.message ?? error)}
      </p>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const oauth = await getOAuth();
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorization_id)
      : await oauth.denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? "an app";

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="serif text-2xl">Connect {clientName} to your account</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This lets {clientName} use Guide Me Through as you — reading your subjects, marks, and profile
        and logging new marks on your behalf. This does not bypass this app's permissions or backend
        policies.
      </p>
      {details?.client?.redirect_uri && (
        <p className="mt-3 text-xs text-muted-foreground break-all">
          Redirects to: {details.client.redirect_uri}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="mt-6 flex gap-3">
        <Button disabled={busy} onClick={() => decide(true)}>
          {busy ? "Working…" : "Approve"}
        </Button>
        <Button variant="outline" disabled={busy} onClick={() => decide(false)}>
          Cancel connection
        </Button>
      </div>
    </main>
  );
}
