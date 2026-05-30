import type { StreamId } from "./streams";

// Subjects offered per A/L stream. Names match how they appear on
// the Department of Examinations past-paper index.
export const STREAM_SUBJECTS: Record<StreamId, string[]> = {
  physical_science: ["Combined Mathematics", "Physics", "Chemistry", "English", "General English", "Common General Test"],
  biology: ["Biology", "Physics", "Chemistry", "Agricultural Science", "English", "General English", "Common General Test"],
  technology: [
    "Science for Technology",
    "Engineering Technology",
    "Bio Systems Technology",
    "Information & Communication Technology",
    "English",
    "General English",
    "Common General Test",
  ],
  commerce: ["Accounting", "Business Studies", "Economics", "Business Statistics", "English", "General English", "Common General Test"],
  arts: [
    "Sinhala",
    "Tamil",
    "English",
    "History",
    "Geography",
    "Political Science",
    "Logic & Scientific Method",
    "Economics",
    "Buddhism",
    "Christianity",
    "Islam",
    "Hinduism",
    "General English",
    "Common General Test",
  ],
};

// Years covered: 2000 → current year.
export const PAPER_YEARS: number[] = (() => {
  const now = new Date().getFullYear();
  const out: number[] = [];
  for (let y = now; y >= 2000; y--) out.push(y);
  return out;
})();

/**
 * Sri Lankan A/L past papers are copyrighted by the Department of
 * Examinations. We do not redistribute them — instead we link directly
 * to the official source so the user can view and download the PDF.
 *
 * The official archive is at https://doenets.lk/exam/pastPapers, and the
 * Ministry of Education's e-thaksalawa portal mirrors many papers.
 * We open a Google search constrained to those domains so the latest
 * official PDF for any subject/year is one click away.
 */
export function officialPaperUrl(subject: string, year: number): string {
  const q = `"${subject}" G.C.E. A/L ${year} past paper filetype:pdf (site:doenets.lk OR site:moe.gov.lk OR site:nie.lk)`;
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

export function officialMarkingSchemeUrl(subject: string, year: number): string {
  const q = `"${subject}" G.C.E. A/L ${year} marking scheme filetype:pdf (site:doenets.lk OR site:moe.gov.lk OR site:nie.lk)`;
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}
