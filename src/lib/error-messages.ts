// User-facing error mapper. Keeps Postgres / Supabase internals out of the UI.
type MaybeErr = { code?: string; message?: string } | null | undefined;

export function friendlyError(error: MaybeErr, fallback = "Something went wrong. Please try again."): string {
  if (!error) return fallback;
  // Log full error server/console for debugging without exposing it to users.
  // eslint-disable-next-line no-console
  console.error("[app error]", error);
  switch (error.code) {
    case "23505":
      return "That value is already taken.";
    case "23503":
      return "Related record is missing.";
    case "23502":
      return "A required field is missing.";
    case "23514":
      return "One of the values is not allowed.";
    case "42501":
    case "PGRST301":
      return "You don't have permission to do that.";
    case "PGRST116":
      return "Item not found.";
    default:
      return fallback;
  }
}
