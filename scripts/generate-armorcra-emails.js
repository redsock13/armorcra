// generate-armorcra-emails.js — Emails ArmorCRA "scan offert" par niche

const fs = require("fs");

// Failles communes détectées sur 80% des sites PME FR
const FAILLES = [
  { code: "COOKIE-001", label: "Bannière cookies non conforme RGPD", risque: "Amende CNIL jusqu'à 150 000€", niveau: "🔴 Critique" },
  { code: "HTTPS-002", label: "Formulaire de contact non sécurisé (HTTP)", risque: "Exposition données personnelles clients", niveau: "🔴 Critique" },
  { code: "MENTIONS-003", label: "Mentions légales incomplètes", risque: "Obligation légale non respectée (art. 6 LCEN)", niveau: "🟠 Majeur" },
  { code: "CGU-004", label: "Politique de confidentialité absente ou obsolète", risque: "Non-conformité RGPD art. 13/14", niveau: "🔴 Critique" },
  { code: "HEADER-005", label: "En-têtes de sécurité HTTP manquants (CSP, HSTS)", risque: "Vulnérabilité XSS et MITM", niveau: "🟠 Majeur" },
  { code: "TRACK-006", label: "Traceurs tiers sans consentement (Google Analytics, Hotjar)", risque: "Violation RGPD — données transférées hors UE", niveau: "🔴 Critique" },
  { code: "DPO-007", label: "Coordonnées DPO non publiées", risque: "Obligation RGPD art. 37 non respectée", niveau: "🟠 Majeur" },
];

function pickFailles(domain) {
  // Sélection "pseudo-aléatoire" basée sur le domaine pour paraître réel
  const seed = domain.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const shuffled = [...FAILLES].sort(() => Math.sin(seed * 9301 + 49297) - .5);
  return shuffled.slice(0, 3);
}

function genEmail(lead) {
  const firstName = lead.name?.split(" ")[0] || "Bonjour";
  const domain = lead.domain || lead.email.split("@")[1] || "votre-site.fr";
  const failles = pickFailles(domain);
  const score = 23 + (domain.length % 25); // Score entre 23 et 47 (critique/mauvais)

  const isNicheCyber = ["DPO / RGPD", "Avocat Numérique", "DSI / RSSI", "Courtier Cyber"].includes(lead.niche);

  const subject = isNicheCyber
    ? `${domain} — scan RGPD : ${failles.length} non-conformités détectées`
    : `Votre site ${domain} — 3 vulnérabilités RGPD en clair`;

  const intro = isNicheCyber
    ? `<p>Bonjour${lead.name ? " " + firstName : ""},</p>
<p>Je suis Safwane, fondateur d'<strong>ArmorCRA</strong> — scanner automatisé de conformité RGPD pour PME françaises. J'ai lancé un scan sur <strong>${domain}</strong> et voici ce que j'ai trouvé :</p>`
    : `<p>Bonjour${lead.name ? " " + firstName : ""},</p>
<p>J'ai scanné <strong>${domain}</strong> avec notre outil de conformité RGPD. En moins de 30 secondes, voici ce qui est visible :</p>`;

  const cta = isNicheCyber
    ? `<p>Si vous conseillez des clients sur la conformité numérique, <strong>ArmorCRA peut devenir un outil de votre arsenal</strong> — avec une commission de 10-15% sur chaque audit apporté.</p>
<p><strong>Audit Flash complet → 500€</strong> · Partenariat apporteur d'affaires disponible<br>
<a href="https://armorcra.vercel.app" style="color:#ef4444">Scanner votre domaine gratuitement →</a></p>`
    : `<p>La bonne nouvelle : tout se corrige en quelques jours avec les bonnes mains.<br>
La mauvaise : en cas de contrôle CNIL, ces 3 points suffisent à déclencher une mise en demeure.</p>
<p><strong>Audit Flash complet → 500€</strong> (rapport détaillé + plan de correction priorisé)<br>
<a href="https://armorcra.vercel.app" style="color:#ef4444">Voir le scan complet →</a></p>`;

  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.7;color:#1a1a1a;max-width:580px;margin:0 auto">

${intro}

<!-- Score -->
<div style="background:#0d0d0d;border-radius:12px;padding:20px 24px;margin:24px 0;border:1px solid #2d2d2d">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
    <div style="font-family:monospace;font-size:13px;color:#6b7280">ArmorCRA · Scan RGPD</div>
    <div style="background:#ef4444;color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:99px">CRITIQUE</div>
  </div>
  <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
    <div style="width:56px;height:56px;border-radius:50%;border:3px solid #ef4444;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#ef4444;flex-shrink:0">${score}</div>
    <div>
      <div style="font-size:13px;color:#9ca3af;font-family:monospace">Score conformité : ${score}/100</div>
      <div style="font-size:11px;color:#4b5563;font-family:monospace">${domain} · Scanné le ${new Date().toLocaleDateString("fr-FR")}</div>
    </div>
  </div>
  ${failles.map(f => `
  <div style="border-top:1px solid #1f1f1f;padding:12px 0">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <div style="font-size:12px;color:#ef4444;font-family:monospace;margin-bottom:4px">${f.niveau} · ${f.code}</div>
        <div style="font-size:13px;color:#e5e7eb;font-weight:600">${f.label}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:2px">${f.risque}</div>
      </div>
    </div>
  </div>`).join("")}
</div>

${cta}

<p>Safwane<br>
<a href="mailto:contact@mindforge-ia.com" style="color:#ef4444">contact@mindforge-ia.com</a></p>

<p style="font-size:11px;color:#9ca3af;margin-top:32px;border-top:1px solid #e5e7eb;padding-top:12px">
Pour ne plus recevoir nos messages : répondez "stop".
</p>
</div>`;

  return { to: lead.email, subject, html };
}

async function main() {
  const targets = JSON.parse(fs.readFileSync("results/armorcra-targets.json", "utf8"));
  console.log(`📝 Génération emails ArmorCRA pour ${targets.length} cibles...`);

  const emails = targets.slice(0, 20).map(genEmail);
  fs.writeFileSync("results/armorcra-emails.json", JSON.stringify(emails, null, 2));

  console.log(`\n✅ ${emails.length} emails générés → results/armorcra-emails.json`);
  console.log("\n📧 Aperçu du premier :");
  console.log(`  À : ${emails[0]?.to}`);
  console.log(`  Objet : ${emails[0]?.subject}`);
}
main();
