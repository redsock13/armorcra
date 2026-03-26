#!/usr/bin/env node
/**
 * ArmorCRA — GitHub Secret Scanner
 * Scans public GitHub repos associated with a domain for exposed secrets.
 * Legal: OSINT on public repositories only.
 */

const https = require('https')

// Secret patterns to detect
const SECRET_PATTERNS = [
  { name: 'Stripe Live Key',     regex: /sk_live_[a-zA-Z0-9]{20,}/g,          article: 'Article 18 CRA' },
  { name: 'Stripe Test Key',     regex: /sk_test_[a-zA-Z0-9]{20,}/g,          article: 'Article 18 CRA' },
  { name: 'AWS Access Key',      regex: /AKIA[0-9A-Z]{16}/g,                  article: 'Article 18 CRA' },
  { name: 'GitHub Token',        regex: /ghp_[a-zA-Z0-9]{36}/g,               article: 'Article 18 CRA' },
  { name: 'SendGrid API Key',    regex: /SG\.[a-zA-Z0-9_-]{22,}/g,            article: 'Article 18 CRA' },
  { name: 'Twilio Auth Token',   regex: /SK[a-f0-9]{32}/g,                    article: 'Article 18 CRA' },
  { name: 'Private Key Block',   regex: /-----BEGIN (RSA |EC )?PRIVATE KEY/g,  article: 'Article 15 CRA' },
  { name: 'JWT Secret hardcodé', regex: /jwt[_-]?secret\s*[:=]\s*['"][^'"]{8,}/gi, article: 'Article 10 CRA' },
  { name: 'Password hardcodé',   regex: /password\s*[:=]\s*['"][^'"]{6,}['"]/gi,   article: 'Article 10 CRA' },
  { name: 'Database URL',        regex: /mongodb(\+srv)?:\/\/[^:]+:[^@]+@/g,  article: 'Article 13 CRA' },
  { name: 'Database URL (SQL)',   regex: /postgresql:\/\/[^:]+:[^@]+@/g,       article: 'Article 13 CRA' },
]

// Sensitive files to check
const SENSITIVE_FILES = [
  '.env', '.env.local', '.env.production', '.env.development',
  'config.js', 'config.ts', 'settings.py', 'config.php',
  'secrets.json', 'credentials.json', 'application.properties',
  'wp-config.php', 'database.yml', '.npmrc', 'docker-compose.yml',
]

// GitHub token — set GITHUB_TOKEN env var for 5000 req/h instead of 60
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || null
if (!GITHUB_TOKEN) {
  console.error('⚠️  Pas de GITHUB_TOKEN — limite 60 req/h. Créer un token sur github.com/settings/tokens')
} else {
  console.error('✓ GitHub token détecté — limite 5000 req/h')
}

function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const opts = new URL(url)
    const authHeaders = GITHUB_TOKEN ? { 'Authorization': `Bearer ${GITHUB_TOKEN}` } : {}
    const options = {
      hostname: opts.hostname,
      path: opts.pathname + opts.search,
      method: 'GET',
      headers: {
        'User-Agent': 'ArmorCRA-SecurityScanner/1.0',
        'Accept': 'application/vnd.github.v3+json',
        ...authHeaders,
        ...headers
      }
    }
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }) }
        catch { resolve({ status: res.statusCode, data }) }
      })
    })
    req.on('error', reject)
    req.setTimeout(8000, () => { req.destroy(); reject(new Error('timeout')) })
    req.end()
  })
}

function maskSecret(secret) {
  if (secret.length <= 8) return secret.slice(0, 2) + '****'
  return secret.slice(0, 6) + '...' + secret.slice(-2)
}

async function findGitHubOrg(domain) {
  // Try to find GitHub org from domain name
  const company = domain.replace(/^www\./, '').split('.')[0]
  const candidates = [company, company.replace(/-/g, ''), company + '-fr', company + '-io']
  
  for (const candidate of candidates) {
    try {
      const res = await httpsGet(`https://api.github.com/orgs/${candidate}`)
      if (res.status === 200) return { type: 'org', login: res.data.login, name: res.data.name }
      const res2 = await httpsGet(`https://api.github.com/users/${candidate}`)
      if (res2.status === 200 && res2.data.type) return { type: 'user', login: res2.data.login, name: res2.data.name }
    } catch {}
  }
  return null
}

async function getPublicRepos(owner, type = 'org') {
  try {
    const endpoint = type === 'org'
      ? `https://api.github.com/orgs/${owner}/repos?sort=updated&per_page=10`
      : `https://api.github.com/users/${owner}/repos?sort=updated&per_page=10`
    const res = await httpsGet(endpoint)
    if (res.status === 200 && Array.isArray(res.data)) {
      return res.data.filter(r => !r.private).slice(0, 8)
    }
  } catch {}
  return []
}

async function scanFileForSecrets(owner, repo, filePath) {
  try {
    const res = await httpsGet(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`)
    if (res.status !== 200 || !res.data.content) return []
    
    const content = Buffer.from(res.data.content, 'base64').toString('utf8')
    const findings = []
    
    for (const pattern of SECRET_PATTERNS) {
      const matches = content.match(pattern.regex)
      if (matches) {
        findings.push({
          type: pattern.name,
          article: pattern.article,
          file: filePath,
          repo: repo,
          preview: maskSecret(matches[0]),
          severity: 'critical',
          url: `https://github.com/${owner}/${repo}/blob/main/${filePath}`,
        })
      }
    }
    return findings
  } catch { return [] }
}

async function getRepoTree(owner, repo) {
  try {
    const res = await httpsGet(`https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`)
    if (res.status === 200 && res.data.tree) {
      return res.data.tree.map(f => f.path).filter(p =>
        SENSITIVE_FILES.some(sf => p.endsWith(sf) || p.includes('/.env') || p.includes('/config/'))
      ).slice(0, 15)
    }
  } catch {}
  return []
}

async function scanDomain(domain) {
  console.error(`\n🔍 Scan GitHub pour : ${domain}`)
  const result = {
    domain,
    scannedAt: new Date().toISOString(),
    githubOrg: null,
    reposScanned: 0,
    filesScanned: 0,
    findings: [],
    summary: { critical: 0, warning: 0 },
  }

  // Find org
  const org = await findGitHubOrg(domain)
  if (!org) {
    console.error('  ⚠️  Aucune organisation GitHub trouvée pour ce domaine')
    result.githubOrg = null
    return result
  }

  console.error(`  ✓ Organisation GitHub : ${org.login} (${org.name || ''})`)
  result.githubOrg = org.login

  // Get repos
  const repos = await getPublicRepos(org.login, org.type)
  console.error(`  ✓ ${repos.length} repos publics trouvés`)
  result.reposScanned = repos.length

  // Scan each repo
  for (const repo of repos) {
    console.error(`  → Scan : ${repo.name}`)
    
    // First try common sensitive files directly
    for (const file of SENSITIVE_FILES.slice(0, 5)) {
      const findings = await scanFileForSecrets(org.login, repo.name, file)
      result.findings.push(...findings)
      if (findings.length) result.filesScanned++
    }
    
    // Then try to get tree and scan suspicious files
    const suspiciousFiles = await getRepoTree(org.login, repo.name)
    for (const file of suspiciousFiles) {
      const findings = await scanFileForSecrets(org.login, repo.name, file)
      result.findings.push(...findings)
      if (findings.length) result.filesScanned++
    }
  }

  // Deduplicate
  const seen = new Set()
  result.findings = result.findings.filter(f => {
    const key = `${f.type}-${f.file}-${f.preview}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  result.summary.critical = result.findings.filter(f => f.severity === 'critical').length
  result.summary.warning = result.findings.filter(f => f.severity === 'warning').length

  return result
}

// Main
const domain = process.argv[2]
if (!domain) {
  console.error('Usage: node github-secret-scan.js <domain>')
  console.error('Example: node github-secret-scan.js techcorp.fr')
  process.exit(1)
}

scanDomain(domain).then(result => {
  console.log(JSON.stringify(result, null, 2))
}).catch(err => {
  console.error('Erreur:', err.message)
  process.exit(1)
})
