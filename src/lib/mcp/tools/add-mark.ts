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
  name: "add_mark",
  title: "Add mark",
  description: "Log a new exam mark for one of the signed-in student's subjects.",
  inputSchema: {
    subject_id: z.string().uuid().describe("Subject id the mark belongs to."),
    exam_name: z.string().trim().min(1).max(120).describe("Exam or paper name."),
    exam_date: z.string().describe("Exam date in YYYY-MM-DD format."),
    marks: z.number().min(0).describe("Marks scored."),
    max_marks: z.number().min(1).default(100).describe("Total possible marks (defaults to 100)."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ subject_id, exam_name, exam_date, marks, max_marks }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const { data, error } = await supabaseForUser(ctx)
      .from("marks")
      .insert({ user_id: ctx.getUserId(), subject_id, exam_name, exam_date, marks, max_marks })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Logged ${marks}/${max_marks} for ${exam_name}.` }],
      structuredContent: { mark: data },
    };
  },
});
