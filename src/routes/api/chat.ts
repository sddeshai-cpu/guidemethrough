import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway";
import { findResources } from "@/lib/study-resources";

type SubjectCtx = { name: string; avg: number | null; latest: number | null; best: number | null; count: number };

const SAFE_TEXT = /^[\p{L}\p{N}\s.,'&()/+\-]+$/u;
const subjectCtxSchema = z.object({
  name: z.string().trim().min(1).max(100).regex(SAFE_TEXT, "Invalid characters"),
  avg: z.number().min(0).max(100).nullable(),
  latest: z.number().min(0).max(100).nullable(),
  best: z.number().min(0).max(100).nullable(),
  count: z.number().int().min(0).max(1000),
});
const bodySchema = z.object({
  messages: z.array(z.unknown()).min(1).max(200),
  stream: z.string().trim().min(1).max(60).regex(SAFE_TEXT).optional(),
  subjects: z.array(subjectCtxSchema).max(20).optional(),
});

function buildSystem(stream?: string, subjects?: SubjectCtx[]) {
  const lines: string[] = [];
  lines.push(`You are an expert tutor for Sri Lankan G.C.E. Advanced Level (A/L) students${stream ? ` in the ${stream} stream` : ""}.`);
  lines.push("");
  lines.push("Guidelines:");
  lines.push("- Follow the Sri Lankan A/L syllabus (NIE / Department of Examinations).");
  lines.push("- Explain step-by-step, show working for problems, use plain math notation (e.g. v = u + at).");
  lines.push("- Mention common A/L exam tricks, past-paper patterns and time-saving methods.");
  lines.push("- Encourage the student warmly. Be concise but complete.");
  lines.push("- Use the student's subject context below to tailor difficulty, examples and revision priorities.");
  lines.push("- When the student asks for study tips, a study plan, where to revise, or which resources to use, CALL the `findStudyResources` tool for the relevant subject and weave the cited resources into your answer. Always cite resources by their title.");

  if (subjects && subjects.length) {
    lines.push("");
    lines.push("Student subject context:");
    for (const s of subjects) {
      const parts: string[] = [];
      if (s.count > 0) {
        if (s.latest != null) parts.push(`latest ${s.latest}%`);
        if (s.avg != null) parts.push(`avg ${s.avg}%`);
        if (s.best != null) parts.push(`best ${s.best}%`);
        parts.push(`${s.count} paper${s.count === 1 ? "" : "s"} logged`);
      } else {
        parts.push("no marks logged yet");
      }
      lines.push(`- ${s.name}: ${parts.join(", ")}`);
    }
    lines.push("");
    lines.push("Prioritise the weakest subjects when giving general advice. If a subject has no marks, suggest a baseline diagnostic.");
  } else {
    lines.push("");
    lines.push("The student has not logged any subjects yet — suggest they add subjects and marks for personalised guidance.");
  }
  return lines.join("\n");
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        // Require authenticated Supabase user — prevents anonymous credit drain
        const authHeader = request.headers.get("authorization") ?? "";
        const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
        if (!token) return new Response("Unauthorized", { status: 401 });
        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
          return new Response("Server misconfigured", { status: 500 });
        }
        const authClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
        if (claimsError || !claimsData?.claims?.sub) {
          return new Response("Unauthorized", { status: 401 });
        }

        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        if (!Array.isArray(body.messages)) {
          return new Response("messages required", { status: 400 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        const tools = {
          findStudyResources: tool({
            description: "Look up vetted study resources (with URLs) for a Sri Lankan A/L subject. Call this whenever the student asks for study tips, a revision plan, or where to learn a topic.",
            inputSchema: z.object({
              subject: z.string().describe("Subject name, e.g. 'Physics', 'Combined Maths', 'Economics'."),
              topic: z.string().optional().describe("Optional topic within the subject, e.g. 'electromagnetism'."),
            }),
            execute: async ({ subject, topic }) => {
              const resources = findResources(subject, topic);
              return { subject, topic: topic ?? null, resources };
            },
          }),
        };

        const result = streamText({
          model,
          system: buildSystem(body.stream, body.subjects),
          tools,
          stopWhen: stepCountIs(50),
          messages: await convertToModelMessages(body.messages as UIMessage[]),
        });

        return result.toUIMessageStreamResponse();
      },
    },
  },
});
