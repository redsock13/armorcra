# Dashboard Partenaire ArmorCRA

## Google Sheet — Structure

### Onglet 1 : Leads actifs

| # | Date envoi | Entreprise | Domaine | Score CRA | Failles clés | Email décideur | Statut | Commission (€) | Notes |
|---|-----------|------------|---------|-----------|--------------|----------------|--------|----------------|-------|
| 1 | 26/03/2026 | TechCorp SAS | techcorp.fr | 28/100 | GitHub + SSL | cto@techcorp.fr | 🟡 Envoyé | - | - |

### Statuts possibles
- 🔵 Scanné — scorecard prête, pas encore envoyé
- 🟡 Envoyé — email parti, en attente
- 🟠 Ouvert — email ouvert, pas de réponse
- 🟢 Chaud — prospect a répondu ou cliqué CTA
- 🔴 Passé partenaire — transmis à Fidens/Vaadata
- ✅ Signé — contrat signé, commission due
- ❌ Fermé — sans suite

### Onglet 2 : Commissions

| Date signature | Entreprise | Partenaire | Montant contrat | % commission | Commission due | Reçu le | Statut |
|---------------|------------|------------|-----------------|--------------|----------------|---------|--------|
| - | - | Fidens | 5 000€ | 12% | 600€ | - | ⏳ En attente |

### Règles partagées avec le partenaire
1. Chaque lead transmis est horodaté dans ce sheet
2. Le partenaire met à jour le statut dans les 48h
3. Commission payée dans les 15 jours après signature client
4. En cas de désaccord : le lead date du sheet fait foi
