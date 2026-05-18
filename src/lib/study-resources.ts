export type StudyResource = { title: string; url: string; note: string };

// Curated, stable references for Sri Lankan A/L study material.
const GENERAL: StudyResource[] = [
  { title: "NIE — A/L Syllabi & Teacher Guides", url: "https://nie.lk/syllabuses", note: "Official syllabus and teacher instruction manuals from the National Institute of Education." },
  { title: "Department of Examinations — Past Papers", url: "https://doenets.lk/exam/pastPapers", note: "Official past papers and marking schemes for the G.C.E. (A/L) examination." },
  { title: "e-thaksalawa — A/L resources", url: "https://www.e-thaksalawa.moe.gov.lk/", note: "Ministry of Education e-learning portal with notes, videos and worksheets." },
];

const BY_KEYWORD: { match: RegExp; resources: StudyResource[] }[] = [
  { match: /\b(physic|combined ?math|mechanic|electric|optic|wave)/i, resources: [
    { title: "Khan Academy — Physics", url: "https://www.khanacademy.org/science/physics", note: "Conceptual videos on mechanics, waves, electromagnetism — useful complement to NIE notes." },
    { title: "HyperPhysics", url: "http://hyperphysics.phy-astr.gsu.edu/hbase/hframe.html", note: "Concept maps and worked examples for every A/L physics topic." },
  ]},
  { match: /\b(chem|organic|inorganic|periodic)/i, resources: [
    { title: "Khan Academy — Chemistry", url: "https://www.khanacademy.org/science/chemistry", note: "Stepwise tutorials on bonding, equilibrium, organic mechanisms." },
    { title: "Chemguide (UK A-Level)", url: "https://www.chemguide.co.uk/", note: "Detailed explanations closely aligned with the A/L chemistry syllabus." },
  ]},
  { match: /\b(bio|botan|zoolog|cell|genetic)/i, resources: [
    { title: "Khan Academy — Biology", url: "https://www.khanacademy.org/science/biology", note: "Strong on cell biology, genetics and human physiology." },
    { title: "BiologyMad A-Level Notes", url: "https://www.biologymad.com/", note: "Concise A-Level biology notes mirroring A/L topics." },
  ]},
  { match: /\b(math|calculus|algebra|statistic|probabil)/i, resources: [
    { title: "Khan Academy — Math", url: "https://www.khanacademy.org/math", note: "Calculus, algebra and statistics walkthroughs with practice problems." },
    { title: "Paul's Online Math Notes", url: "https://tutorial.math.lamar.edu/", note: "Clear notes and worked examples for calculus and algebra." },
  ]},
  { match: /\b(econ|micro|macro)/i, resources: [
    { title: "Khan Academy — Economics", url: "https://www.khanacademy.org/economics-finance-domain", note: "Micro and macro foundations with clear diagrams." },
    { title: "Central Bank of Sri Lanka — Statistics", url: "https://www.cbsl.gov.lk/en/statistics", note: "Real Sri Lankan data for essay and case-study questions." },
  ]},
  { match: /\b(business|management|marketing)/i, resources: [
    { title: "tutor2u — Business", url: "https://www.tutor2u.net/business", note: "Short topic notes and case studies useful for Business Studies." },
  ]},
  { match: /\b(account)/i, resources: [
    { title: "CA Sri Lanka — Student Resources", url: "https://www.casrilanka.com/casl/", note: "Foundational accounting standards and worked examples." },
  ]},
  { match: /\b(ict|computer|programming|database)/i, resources: [
    { title: "GeeksforGeeks — DBMS & Networking", url: "https://www.geeksforgeeks.org/dbms/", note: "Concise notes on databases and networking concepts in the A/L ICT syllabus." },
    { title: "MDN Web Docs", url: "https://developer.mozilla.org/", note: "Authoritative reference for HTML, CSS and JavaScript fundamentals." },
  ]},
  { match: /\b(agri|food|nutrition)/i, resources: [
    { title: "FAO — Knowledge Repository", url: "https://www.fao.org/home/en", note: "Reliable agriculture and nutrition data for technology stream students." },
  ]},
];

export function findResources(subject: string, topic?: string): StudyResource[] {
  const haystack = `${subject} ${topic ?? ""}`;
  const matched = BY_KEYWORD.filter((b) => b.match.test(haystack)).flatMap((b) => b.resources);
  // De-dupe by URL, cap to 5, then always append the general references.
  const seen = new Set<string>();
  const top: StudyResource[] = [];
  for (const r of [...matched, ...GENERAL]) {
    if (seen.has(r.url)) continue;
    seen.add(r.url);
    top.push(r);
    if (top.length >= 5) break;
  }
  return top;
}
