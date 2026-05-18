export async function getSupabase() {
  if (typeof window === "undefined") {
    throw new Error("The browser database client is unavailable during server rendering.");
  }

  const { supabase } = await import("@/integrations/supabase/client");
  return supabase;
}