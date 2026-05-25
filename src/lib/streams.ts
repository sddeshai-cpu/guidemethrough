export const STREAMS = [
  { id: "physical_science", label: "Physical Science", blurb: "Combined Maths · Physics · Chemistry" },
  { id: "biology", label: "Biological Science", blurb: "Biology · Physics · Chemistry" },
  { id: "technology", label: "Technology", blurb: "SFT / ET · ICT · Science for Tech" },
  { id: "commerce", label: "Commerce", blurb: "Accounting · Business Studies · Economics" },
  { id: "arts", label: "Arts", blurb: "Languages · Humanities · Social Sciences" },
] as const;

export type StreamId = (typeof STREAMS)[number]["id"];

export const streamLabel = (id?: string | null) =>
  STREAMS.find((s) => s.id === id)?.label ?? "—";
