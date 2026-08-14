#!/usr/bin/env node
/**
 * Sitemap Validator — runs after build to verify sitemap.xml integrity.
 * Fails (exit 1) if any URL is: empty, relative, wrong domain, duplicate, or malformed.
 *
 * Usage: node scripts/validate-sitemap.js
 */
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SITEMAP_PATH = resolve(__dirname, '../dist/sitemap.xml')
const REQUIRED_DOMAIN = 'https://smarttools.vercel.app'

let errors = []
let seen = new Set()

try {
  const xml = readFileSync(SITEMAP_PATH, 'utf-8')

  if (!xml.startsWith('<?xml')) {
    errors.push('Missing XML declaration at start of file')
  }
  if (!xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')) {
    errors.push('Missing or incorrect urlset namespace')
  }
  if (!xml.includes('</urlset>')) {
    errors.push('Missing closing </urlset> tag')
  }

  const locMatches = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)]
  const urls = locMatches.map(m => m[1])

  if (urls.length === 0) {
    errors.push('No <loc> entries found in sitemap')
  }

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]

    if (!url || url.trim() === '') {
      errors.push('URL #' + (i + 1) + ': <loc> is empty')
      continue
    }
    if (!url.startsWith('https://')) {
      errors.push('URL #' + (i + 1) + ': not absolute URL: "' + url + '"')
      continue
    }
    if (!url.startsWith(REQUIRED_DOMAIN)) {
      errors.push('URL #' + (i + 1) + ': wrong domain: "' + url + '"')
      continue
    }
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      errors.push('URL #' + (i + 1) + ': contains localhost: "' + url + '"')
      continue
    }
    if (url.includes('undefined') || url.includes('null')) {
      errors.push('URL #' + (i + 1) + ': contains undefined/null: "' + url + '"')
      continue
    }
    if (seen.has(url)) {
      errors.push('URL #' + (i + 1) + ': duplicate URL: "' + url + '"')
      continue
    }
    seen.add(url)
  }

  const excluded = ['/favorites', '/recent']
  for (const url of seen) {
    for (const ex of excluded) {
      if (url.endsWith(ex)) {
        errors.push('Excluded route in sitemap: "' + url + '"')
      }
    }
  }

} catch (err) {
  if (err.code === 'ENOENT') {
    errors.push('Sitemap file not found at ' + SITEMAP_PATH)
  } else {
    errors.push('Failed to read sitemap: ' + err.message)
  }
}

console.log('\n=== Sitemap Validation ===')
console.log('File: ' + SITEMAP_PATH)
console.log('Required domain: ' + REQUIRED_DOMAIN)

if (errors.length > 0) {
  console.log('\nFAILED — ' + errors.length + ' error(s):')
  errors.forEach(function(e) { console.log('   ' + e) })
  console.log('')
  process.exit(1)
} else {
  console.log('\nPASSED — all URLs valid')
  console.log('   Total URLs: ' + seen.size)
  console.log('   Zero empty locs')
  console.log('   Zero relative URLs')
  console.log('   Zero duplicates')
  console.log('   Zero localhost URLs')
  console.log('   Zero undefined/null URLs')
  console.log('')
  process.exit(0)
}
