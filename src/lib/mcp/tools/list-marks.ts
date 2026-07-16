import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_marks",
  title: "List marks",
  description: "List exam marks for the signed-in student. Optionally filter by subject_id.",
  inputSchema: {
    subject_id: z.string().uuid().optional().describe("Optional subject id to filter marks."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ subject_id }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("marks")
      .select("id, subject_id, exam_name, exam_date, marks, max_marks")
      .eq("user_id", ctx.getUserId())
      .order("exam_date", { ascending: false });
    if (subject_id) q = q.eq("subject_id", subject_id);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { marks: data ?? [] },
    };
  },
});
