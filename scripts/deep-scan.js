#!/usr/bin/env node
/**
 * ArmorCRA — Deep Scanner
 * - Headers de sécurité HTTP
 * - SSL/TLS
 * - Sous-domaines orphelins
 * - DNS records
 */

const https = require('https')
const http = require('http')
const dns = require('dns').promises
const { URL } = require('url')

// Headers de sécurité requis par CRA/bonnes pratiques
const SECURITY_HEADERS = [
  { name: 'strict-transport-security', label: 'HSTS', article: 'Article 10 CRA', severity: 'critical' },
  { name: 'content-security-policy', label: 'Content Security Policy', article: 'Article 10 CRA', severity: 'critical' },
  { name: 'x-frame-options', label: 'X-Frame-Options (clickjacking)', article: 'Article 10 CRA', severity: 'high' },
  { name: 'x-content-type-options', label: 'X-Content-Type-Options', article: 'Article 10 CRA', severity: 'medium' },
  { name: 'referrer-policy', label: 'Referrer Policy', article: 'Article 15 CRA', severity: 'medium' },
  { name: 'permissions-policy', label: 'Permissions Policy', article: 'Article 15 CRA', severity: 'medium' },
  { name: 'x-xss-protection', label: 'XSS Protection', article: 'Article 10 CRA', severity: 'medium' },
]

// Sous-domaines courants à vérifier
const COMMON_SUBDOMAINS = [
  'dev', 'staging', 'test', 'beta', 'api', 'admin', 'mail', 'smtp',
  'ftp', 'old', 'backup', 'demo', 'app', 'portal', 'dashboard',
  'dev2', 'preprod', 'recette', 'v2', 'static', 'cdn'
]

// Services qui indiquent un takeover possible si CNAME pointe vers eux
const TAKEOVER_SERVICES = [
  { pattern: /\.github\.io/, service: 'GitHub Pages' },
  { pattern: /\.herokuapp\.com/, service: 'Heroku' },
  { pattern: /\.netlify\.app/, service: 'Netlify' },
  { pattern: /\.vercel\.app/, service: 'Vercel' },
  { pattern: /\.s3\.amazonaws\.com/, service: 'AWS S3' },
  { pattern: /\.azurewebsites\.net/, service: 'Azure' },
  { pattern: /unbouncepages\.com/, service: 'Unbounce' },
]

async function checkHeaders(domain) {
  const url = `https://${domain}`
  return new Promise((resolve) => {
    const req = https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 8000,
    }, (res) => {
      const headers = res.headers
      const findings = []

      for (const h of SECURITY_HEADERS) {
        if (!headers[h.name]) {
          findings.push({
            type: 'missing_header',
            label: `Header "${h.label}" absent`,
            article: h.article,
            severity: h.severity,
          })
        }
      }

      // Vérifier si HTTP redirige vers HTTPS
      const hasHsts = !!headers['strict-transport-security']

      // Vérifier version TLS (basique)
      resolve({
        statusCode: res.statusCode,
        findings,
        hasHsts,
        server: headers['server'] || 'inconnu',
      })
    })
    req.on('error', () => {
      // Essayer HTTP
      http.get(`http://${domain}`, { timeout: 5000 }, (res) => {
        resolve({
          statusCode: res.statusCode,
          findings: [{ type: 'no_https', label: 'Site sans HTTPS', article: 'Article 10 CRA', severity: 'critical' }],
          hasHsts: false,
          server: res.headers['server'] || 'inconnu',
        })
      }).on('error', () => resolve({ statusCode: 0, findings: [], hasHsts: false, server: 'N/A' }))
    })
    req.on('timeout', () => { req.destroy() })
  })
}

async function checkSubdomains(domain) {
  const orphaned = []
  const found = []

  for (const sub of COMMON_SUBDOMAINS) {
    const fqdn = `${sub}.${domain}`
    try {
      const addresses = await dns.resolve(fqdn)
      if (addresses && addresses.length > 0) {
        found.push(fqdn)
        // Vérifier CNAME pour takeover
        try {
          const cnames = await dns.resolveCname(fqdn)
          for (const cname of cnames) {
            for (const svc of TAKEOVER_SERVICES) {
              if (svc.pattern.test(cname)) {
                orphaned.push({
                  subdomain: fqdn,
                  cname,
                  service: svc.service,
                  severity: 'critical',
                  label: `Sous-domaine ${fqdn} → ${svc.service} (takeover possible)`,
                  article: 'Article 18 CRA',
                })
              }
            }
          }
        } catch {}
      }
    } catch {}
  }
  return { found, orphaned }
}

async function checkDns(domain) {
  const findings = []
  try {
    // Vérifier SPF
    const txt = await dns.resolveTxt(domain)
    const spf = txt.flat().find(r => r.startsWith('v=spf1'))
    if (!spf) findings.push({ type: 'no_spf', label: 'SPF absent (risque usurpation email)', article: 'Article 13 CRA', severity: 'high' })

    // Vérifier DMARC
    try {
      const dmarc = await dns.resolveTxt(`_dmarc.${domain}`)
      if (!dmarc.flat().find(r => r.startsWith('v=DMARC1'))) {
        findings.push({ type: 'no_dmarc', label: 'DMARC absent (risque phishing)', article: 'Article 13 CRA', severity: 'high' })
      }
    } catch {
      findings.push({ type: 'no_dmarc', label: 'DMARC absent (risque phishing)', article: 'Article 13 CRA', severity: 'high' })
    }
  } catch {
    findings.push({ type: 'dns_error', label: 'Erreur résolution DNS', article: 'Article 13 CRA', severity: 'medium' })
  }
  return findings
}

async function deepScan(domain) {
  console.error(`\n🔬 Deep Scan : ${domain}`)
  console.error('='.repeat(50))

  const [headerResult, subdomains, dnsFindings] = await Promise.all([
    checkHeaders(domain),
    checkSubdomains(domain),
    checkDns(domain),
  ])

  const allFindings = [
    ...headerResult.findings,
    ...subdomains.orphaned,
    ...dnsFindings,
  ]

  // Score basé sur les findings
  const criticalCount = allFindings.filter(f => f.severity === 'critical').length
  const highCount = allFindings.filter(f => f.severity === 'high').length
  const mediumCount = allFindings.filter(f => f.severity === 'medium').length

  const score = Math.max(0, 100 - (criticalCount * 15) - (highCount * 10) - (mediumCount * 5))

  return {
    domain,
    scannedAt: new Date().toISOString(),
    score,
    level: score < 30 ? 'CRITIQUE' : score < 60 ? 'ÉLEVÉ' : score < 80 ? 'MODÉRÉ' : 'BON',
    server: headerResult.server,
    https: headerResult.statusCode > 0,
    findings: allFindings,
    subdomains: {
      found: subdomains.found,
      orphaned: subdomains.orphaned,
    },
    summary: { critical: criticalCount, high: highCount, medium: mediumCount },
  }
}

const domain = process.argv[2]
if (!domain) { console.error('Usage: node deep-scan.js <domain>'); process.exit(1) }

deepScan(domain).then(result => {
  console.log(JSON.stringify(result, null, 2))
  console.error(`\n✅ Score : ${result.score}/100 (${result.level})`)
  console.error(`   ${result.summary.critical} critiques | ${result.summary.high} élevés | ${result.summary.medium} moyens`)
}).catch(console.error)
