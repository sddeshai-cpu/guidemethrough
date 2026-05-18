import * as XLSX from "xlsx";

export type ImportRow = {
  exam_name: string;
  marks: number;
  max_marks: number;
  exam_date: string; // YYYY-MM-DD
};

export type ParseResult = {
  rows: ImportRow[];
  errors: { row: number; message: string }[];
};

const HEADER_ALIASES: Record<keyof ImportRow, string[]> = {
  exam_name: ["exam_name", "exam", "paper", "paper name", "name", "title"],
  marks: ["marks", "score", "mark", "obtained"],
  max_marks: ["max_marks", "max", "out of", "out_of", "total", "max marks"],
  exam_date: ["exam_date", "date", "exam date"],
};

function normalize(s: string) {
  return String(s ?? "").trim().toLowerCase();
}

function findKey(headers: string[], aliases: string[]) {
  const norm = headers.map(normalize);
  for (const a of aliases) {
    const i = norm.indexOf(a);
    if (i !== -1) return i;
  }
  return -1;
}

function toIsoDate(v: unknown): string | null {
  if (v == null || v === "") return null;
  // Excel serial number
  if (typeof v === "number" && Number.isFinite(v)) {
    const d = XLSX.SSF.parse_date_code(v);
    if (d) {
      const mm = String(d.m).padStart(2, "0");
      const dd = String(d.d).padStart(2, "0");
      return `${d.y}-${mm}-${dd}`;
    }
  }
  const s = String(v).trim();
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // try Date.parse fallback
  const t = Date.parse(s);
  if (!Number.isNaN(t)) {
    const d = new Date(t);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
  }
  return null;
}

export async function parseFile(file: File): Promise<ParseResult> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false, defval: "" });
  if (aoa.length === 0) return { rows: [], errors: [{ row: 0, message: "File is empty." }] };

  const headers = (aoa[0] as unknown[]).map((h) => String(h ?? ""));
  const idx = {
    exam_name: findKey(headers, HEADER_ALIASES.exam_name),
    marks: findKey(headers, HEADER_ALIASES.marks),
    max_marks: findKey(headers, HEADER_ALIASES.max_marks),
    exam_date: findKey(headers, HEADER_ALIASES.exam_date),
  };

  const missing = Object.entries(idx).filter(([, v]) => v === -1).map(([k]) => k);
  if (missing.length) {
    return { rows: [], errors: [{ row: 1, message: `Missing columns: ${missing.join(", ")}. Expected headers like: exam_name, marks, max_marks, exam_date.` }] };
  }

  const rows: ImportRow[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = 1; i < aoa.length; i++) {
    const r = aoa[i] as unknown[];
    if (!r || r.every((c) => c === "" || c == null)) continue;
    const exam_name = String(r[idx.exam_name] ?? "").trim();
    const marks = Number(r[idx.marks]);
    const max_marks = Number(r[idx.max_marks]);
    const exam_date = toIsoDate(r[idx.exam_date]);

    if (!exam_name) { errors.push({ row: i + 1, message: "Missing paper name." }); continue; }
    if (!Number.isFinite(marks) || marks < 0) { errors.push({ row: i + 1, message: "Invalid marks." }); continue; }
    if (!Number.isFinite(max_marks) || max_marks <= 0) { errors.push({ row: i + 1, message: "Invalid max marks." }); continue; }
    if (marks > max_marks) { errors.push({ row: i + 1, message: "Marks greater than max." }); continue; }
    if (!exam_date) { errors.push({ row: i + 1, message: "Invalid date." }); continue; }

    rows.push({ exam_name, marks, max_marks, exam_date });
  }

  return { rows, errors };
}

export function downloadTemplate() {
  const csv = "exam_name,marks,max_marks,exam_date\n2024 Term 1 · Paper I,72,100,2024-03-15\n2024 Term 2 · Paper I,80,100,2024-07-20\n";
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "marks-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}
