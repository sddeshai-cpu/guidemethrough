import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway";

type Body = { messages?: unknown; stream?: string };

const SYSTEM = (stream?: string) => `You are an expert tutor for Sri Lankan G.C.E. Advanced Level (A/L) students${
  stream ? ` in the ${stream} stream` : ""
}.

Guidelines:
- Follow the Sri Lankan A/L syllabus (Department of Examinations / NIE).
- Explain step-by-step, show working for problems, and use clear LaTeX-free math (e.g. v = u + at).
- When relevant, mention common A/L exam tricks, past-paper patterns, and time-saving methods.
- Encourage the student warmly. Keep answers concise but complete.
- If a question is outside academic scope, gently steer back to studies.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
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

        const result = streamText({
          model,
          system: SYSTEM(body.stream),
          messages: await convertToModelMessages(body.messages as UIMessage[]),
        });

        return result.toUIMessageStreamResponse();
      },
    },
  },
});
