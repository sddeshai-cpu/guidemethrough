import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type ExportMark = {
  exam_name: string;
  marks: number;
  max_marks: number;
  exam_date: string;
};
export type ExportSubject = { name: string; marks: ExportMark[] };

function pct(m: ExportMark) {
  return Math.round((m.marks / m.max_marks) * 100);
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function csvEscape(v: string | number) {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function exportCSV(subjects: ExportSubject[], filename = "paperpath-report.csv") {
  const rows = [["Subject", "Paper", "Date", "Marks", "Out of", "Percentage"]];
  for (const s of subjects) {
    for (const m of s.marks) {
      rows.push([s.name, m.exam_name, m.exam_date, String(m.marks), String(m.max_marks), `${pct(m)}%`]);
    }
  }
  download(filename, rows.map((r) => r.map(csvEscape).join(",")).join("\n"), "text/csv;charset=utf-8");
}

export function exportPDF(
  subjects: ExportSubject[],
  opts: { title?: string; username?: string; filename?: string } = {},
) {
  const doc = new jsPDF();
  const title = opts.title ?? "PaperPath · Progression Report";
  doc.setFontSize(18);
  doc.text(title, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(120);
  const meta = [opts.username ? `Student: ${opts.username}` : null, `Generated: ${new Date().toLocaleString()}`]
    .filter(Boolean)
    .join("  ·  ");
  doc.text(meta, 14, 25);
  doc.setTextColor(0);

  let y = 34;
  for (const s of subjects) {
    const pcts = s.marks.map(pct);
    const avg = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0;
    const best = pcts.length ? Math.max(...pcts) : 0;
    const latest = pcts.at(-1) ?? 0;

    doc.setFontSize(13);
    doc.text(s.name, 14, y);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(
      s.marks.length
        ? `Latest ${latest}%   ·   Average ${avg}%   ·   Best ${best}%   ·   ${s.marks.length} paper(s)`
        : "No marks logged.",
      14,
      y + 5,
    );
    doc.setTextColor(0);

    if (s.marks.length) {
      autoTable(doc, {
        startY: y + 8,
        head: [["Paper", "Date", "Marks", "Out of", "%"]],
        body: s.marks.map((m) => [m.exam_name, m.exam_date, m.marks, m.max_marks, `${pct(m)}%`]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [139, 115, 85] },
        margin: { left: 14, right: 14 },
      });
      // @ts-expect-error autotable adds lastAutoTable
      y = doc.lastAutoTable.finalY + 10;
    } else {
      y += 12;
    }

    if (y > 260) {
      doc.addPage();
      y = 20;
    }
  }

  doc.save(opts.filename ?? "paperpath-report.pdf");
}
