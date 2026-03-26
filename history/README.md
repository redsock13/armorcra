# ArmorCRA — Historique des Scorecards

Chaque prospect scanné = un fichier JSON ici.
Format : `YYYY-MM-DD_nom-entreprise.json`

Structure :
{
  "date": "2026-03-26",
  "company": "TechCorp SAS",
  "url": "https://techcorp.fr",
  "email": "contact@techcorp.fr",
  "score": 28,
  "critical": 4,
  "warnings": 2,
  "amende_min": 250000,
  "amende_max": 2500000,
  "email_sent": true,
  "email_opened": false,
  "relance_j7": false,
  "partner_sent": false,
  "status": "cold" // cold | warm | hot | converted
}
