// find-armorcra-targets.js — Trouve 50 PME / DPO / cabinets FR pour ArmorCRA

const fs = require("fs");
const SERPAPI_KEY = process.env.SERPAPI_KEY || process.env.SERPAPI_KEY || "";

const QUERIES = [
  // DPO / RGPD
  'DPO externalisé "contact@" france',
  'délégué protection données "contact@" cabinet',
  'consultant RGPD indépendant "contact@" france',
  // DSI / RSSI PME
  'DSI PME france "contact@" site:*.fr',
  'responsable sécurité informatique "contact@" france',
  // Cabinets experts-comptables (recommandent des services à leurs clients)
  'cabinet expertise comptable "contact@" site:*.fr -inurl:forum',
  'expert comptable dirigeants PME "contact@"',
  // Avocats RGPD
  'avocat RGPD protection données "contact@" paris',
  'avocat droit numérique "contact@" france',
  // PME dirigeants secteurs à risque
  'directeur général PME "contact@" site:*.fr -inurl:job',
  'gérant société "contact@" paris lyon bordeaux',
  'cabinet conseil RH "contact@" france',
  // Courtiers assurance cyber
  'courtier assurance cyber "contact@" france',
  'assurance entreprise numérique "contact@"',
  // ESN / SSII qui conseillent des PME
  'ESN PME "contact@" site:*.fr',
];

function extractEmails(text) {
  const re = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  return [...new Set((text.match(re) || []).filter(e =>
    !["example","noreply","support","serpapi","google","twitter","facebook","sentry","schema","wordpress"].some(x => e.includes(x)) &&
    e.length < 60 && !e.includes("...")
  ))];
}

function extractDomain(email) {
  const d = email.split("@")[1] || "";
  return d.startsWith("gmail") || d.startsWith("yahoo") || d.startsWith("hotmail") || d.startsWith("orange") || d.startsWith("wanadoo") ? null : d;
}

function guessNiche(q) {
  if (q.includes("DPO") || q.includes("RGPD") || q.includes("protection données")) return "DPO / RGPD";
  if (q.includes("DSI") || q.includes("sécurité informatique") || q.includes("RSSI")) return "DSI / RSSI";
  if (q.includes("expert comptable") || q.includes("expertise comptable")) return "Expert-Comptable";
  if (q.includes("avocat")) return "Avocat Numérique";
  if (q.includes("assurance cyber") || q.includes("courtier")) return "Courtier Cyber";
  if (q.includes("ESN") || q.includes("SSII")) return "ESN / SSII";
  return "Dirigeant PME";
}

function guessName(title, snippet) {
  const text = title + " " + snippet;
  const m = text.match(/([A-ZÁÀÂÉÈÊËÎÏÔÙÛÜ][a-záàâéèêëîïôùûü]+)\s+([A-ZÁÀÂÉÈÊËÎÏÔÙÛÜ][A-Za-záàâéèêëîïôùûü]+)/);
  return m ? m[0] : "";
}

async function search(query) {
  const { default: fetch } = await import("node-fetch");
  try {
    const url = `https://serpapi.com/search?q=${encodeURIComponent(query)}&hl=fr&gl=fr&num=10&api_key=${SERPAPI_KEY}`;
    const res = await fetch(url);
    return (await res.json()).organic_results || [];
  } catch { return []; }
}

async function main() {
  console.log("🛡️ Scan ArmorCRA — cibles PME/DPO/cabinets FR...\n");
  const leads = [], seen = new Set();

  for (const q of QUERIES) {
    const niche = guessNiche(q);
    console.log(`→ [${niche}] ${q.slice(0, 55)}...`);
    const results = await search(q);

    for (const r of results) {
      const text = [r.title, r.snippet, r.displayed_link, r.link].join(" ");
      const emails = extractEmails(text);
      for (const email of emails) {
        if (seen.has(email)) continue;
        seen.add(email);
        const domain = extractDomain(email);
        const name = guessName(r.title || "", r.snippet || "");
        leads.push({
          email, name, niche,
          domain: domain || r.displayed_link?.replace("www.", "").split("/")[0] || "",
          source: r.link,
          snippet: (r.snippet || "").slice(0, 120),
        });
        console.log(`  ✅ ${email} — ${name || "(cabinet)"} [${niche}]`);
        if (leads.length >= 50) break;
      }
      if (leads.length >= 50) break;
    }
    if (leads.length >= 50) break;
    await new Promise(r => setTimeout(r, 700));
  }

  fs.writeFileSync("results/armorcra-targets.json", JSON.stringify(leads, null, 2));
  console.log(`\n💾 ${leads.length} cibles → results/armorcra-targets.json`);
}
main();
