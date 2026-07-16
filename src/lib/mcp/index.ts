import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listSubjects from "./tools/list-subjects";
import listMarks from "./tools/list-marks";
import addMark from "./tools/add-mark";
import getProfile from "./tools/get-profile";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "guide-me-through-mcp",
  title: "Guide Me Through",
  version: "0.1.0",
  instructions:
    "Tools for Guide Me Through, a Sri Lankan G.C.E. Advanced Level study companion. Read the signed-in student's subjects, marks, and profile, and log new exam marks.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listSubjects, listMarks, addMark, getProfile],
});
