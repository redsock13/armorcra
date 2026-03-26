const fs = require("fs");
const SERPAPI_KEY = process.env.SERPAPI_KEY || process.env.SERPAPI_KEY || "";

// Queries ultra ciblées — annuaires, associations pro, sites de cabinets
const QUERIES = [
  '"@" consultant RGPD france annuaire',
  'DPO externalisé tarif "contact" email france 2024',
  'expert comptable paris "contact@" -inurl:emploi -inurl:job',
  'avocat informatique RGPD "contact@" paris',
  'cabinet RH conseil "contact@" -site:linkedin.com',
  '"DSI" OR "RSSI" freelance "contact@" france prestation',
  'consultant cybersécurité "contact@" site:*.fr',
  'formation RGPD DPO "contact@" organisme',
  'protection données personnelles cabinet "email" "@"',
  'responsable informatique PME recrutement "email"',
  '"directeur des systèmes" "contact" email france prestataire',
  'audit sécurité informatique PME "contact@"',
  'conformité RGPD PME prestataire "email" "@"',
  'conseil numérique PME "contact@" paris bordeaux lyon',
  '"délégué à la protection" externalisé tarif email',
  'courtier en assurance professionnelle "contact@" france',
  'assurance responsabilité civile pro informatique "contact@"',
  'cabinet comptable gestion PME "contact@" site:*.fr -inurl:blog',
  'commissaire aux comptes "contact@" site:*.fr',
  'avocat numérique startup "contact@" paris',
];

function extractEmails(text) {
  const re = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  return [...new Set((text.match(re) || []).filter(e =>
    !["example","noreply","no-reply","support","info@serpapi","google","twitter","facebook","sentry","schema","wordpress","png","jpg","svg","woff"].some(x => e.toLowerCase().includes(x)) &&
    e.length < 70 && !e.includes("...")
  ))];
}

function guessNiche(q) {
  if (q.includes("RGPD") || q.includes("DPO") || q.includes("protection données")) return "DPO / RGPD";
  if (q.includes("DSI") || q.includes("RSSI") || q.includes("sécurité") || q.includes("cybersécurité")) return "DSI / Cybersécurité";
  if (q.includes("comptable") || q.includes("commissaire")) return "Expert-Comptable";
  if (q.includes("avocat")) return "Avocat Numérique";
  if (q.includes("assurance") || q.includes("courtier")) return "Courtier / Assurance";
  if (q.includes("RH")) return "Cabinet RH";
  return "Dirigeant PME";
}

function guessName(title = "", snippet = "") {
  const text = title + " " + snippet;
  const m = text.match(/([A-ZÁÀÂÉÈÊËÎÏÔÙÛÜ][a-záàâéèêëîïôùûü]{2,})\s+([A-ZÁÀÂÉÈÊËÎÏÔÙÛÜ][a-z]{2,})/);
  return m ? m[0] : "";
}

async function search(query) {
  const { default: fetch } = await import("node-fetch");
  try {
    const url = `https://serpapi.com/search?q=${encodeURIComponent(query)}&hl=fr&gl=fr&num=10&api_key=${SERPAPI_KEY}`;
    const res = await fetch(url); const data = await res.json();
    return data.organic_results || [];
  } catch { return []; }
}

async function main() {
  // Charger leads existants
  let leads = [], seen = new Set();
  try {
    leads = JSON.parse(fs.readFileSync("results/armorcra-targets.json", "utf8"));
    leads.forEach(l => seen.add(l.email));
    console.log(`📥 ${leads.length} leads existants chargés\n`);
  } catch {}

  console.log("🛡️ Scan ArmorCRA v2...\n");

  for (const q of QUERIES) {
    if (leads.length >= 50) break;
    const niche = guessNiche(q);
    console.log(`→ [${niche}]`);
    const results = await search(q);
    for (const r of results) {
      const text = [r.title, r.snippet, r.displayed_link].join(" ");
      const emails = extractEmails(text);
      for (const email of emails) {
        if (seen.has(email)) continue;
        seen.add(email);
        const domain = (() => {
          const d = email.split("@")[1] || "";
          return ["gmail","yahoo","hotmail","orange","wanadoo","free","sfr","laposte","outlook","live"].some(x => d.startsWith(x)) ? null : d;
        })();
        leads.push({ email, name: guessName(r.title, r.snippet), niche, domain: domain || r.displayed_link?.replace(/^www\./,"").split("/")[0] || "", source: r.link, snippet: (r.snippet||"").slice(0,120) });
        console.log(`  ✅ ${email} [${niche}]`);
        if (leads.length >= 50) break;
      }
      if (leads.length >= 50) break;
    }
    await new Promise(r => setTimeout(r, 600));
  }

  fs.writeFileSync("results/armorcra-targets.json", JSON.stringify(leads, null, 2));
  console.log(`\n💾 TOTAL : ${leads.length} cibles → results/armorcra-targets.json`);
}
main();
