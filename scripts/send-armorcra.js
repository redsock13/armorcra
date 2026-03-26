// send-armorcra.js — Envoi emails ArmorCRA via Brevo

const fs = require("fs");
const BREVO_API_KEY = process.env.BREVO_API_KEY;

async function send(to, subject, html) {
  const { default: fetch } = await import("node-fetch");
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": BREVO_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: { email: "contact@mindforge-ia.com", name: "Safwane — ArmorCRA" },
      replyTo: { email: "contact.zmimax@gmail.com" },
      to: [{ email: to }],
      subject, htmlContent: html,
    }),
  });
  return res.status;
}

async function main() {
  if (!BREVO_API_KEY) { console.error("❌ BREVO_API_KEY manquant"); process.exit(1); }
  const emails = JSON.parse(fs.readFileSync("results/armorcra-emails.json", "utf8"));
  const batch = emails.slice(0, 20);
  console.log(`📤 Envoi ${batch.length} emails ArmorCRA...\n`);
  let ok = 0, fail = 0;
  for (const e of batch) {
    const s = await send(e.to, e.subject, e.html);
    if (s === 201) { console.log(`✅ [201] ${e.to}`); ok++; }
    else { console.log(`❌ [${s}] ${e.to}`); fail++; }
    await new Promise(r => setTimeout(r, 400));
  }
  console.log(`\n📊 ${ok} envoyés · ${fail} échoués`);
}
main();
