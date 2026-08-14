import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Production domain — every URL in the sitemap MUST use this
const SITE_URL = 'https://smarttools.vercel.app'

// Routes that should NEVER appear in the sitemap
const EXCLUDED_ROUTES = ['/favorites', '/recent', '/search']

/**
 * Sitemap plugin — generates sitemap.xml at build time.
 * Reads categories.json and tools.json from src/data.
 * Every <loc> is validated to be an absolute, non-empty, unique URL.
 */
function sitemapPlugin() {
  return {
    name: 'sitemap-generator',
    apply: 'build',
    generateBundle() {
      const cats = JSON.parse(readFileSync(resolve(__dirname, 'src/data/categories.json'), 'utf-8'))
      const tools = JSON.parse(readFileSync(resolve(__dirname, 'src/data/tools.json'), 'utf-8'))

      const today = new Date().toISOString().split('T')[0]
      const urls = []

      // Homepage
      urls.push({ loc: `${SITE_URL}/`, lastmod: today })

      // Categories index page
      urls.push({ loc: `${SITE_URL}/categories`, lastmod: today })

      // Individual category pages
      for (const cat of cats) {
        if (!cat.slug) continue
        urls.push({ loc: `${SITE_URL}/categories/${cat.slug}`, lastmod: today })
      }

      // Individual tool pages
      for (const tool of tools) {
        if (!tool.slug) continue
        if (EXCLUDED_ROUTES.includes(`/tools/${tool.slug}`)) continue
        urls.push({
          loc: `${SITE_URL}/tools/${tool.slug}`,
          lastmod: tool.created_at ? tool.created_at.split('T')[0] : today,
        })
      }

      // ── VALIDATION ──
      // Fail the build if any URL is invalid
      const errors = []
      const seen = new Set()

      for (let i = 0; i < urls.length; i++) {
        const u = urls[i]
        const loc = u.loc

        // Check empty
        if (!loc || loc.trim() === '') {
          errors.push(`URL #${i}: loc is empty`)
          continue
        }

        // Check not absolute / doesn't start with SITE_URL
        if (!loc.startsWith('https://')) {
          errors.push(`URL #${i}: loc is not absolute: "${loc}"`)
          continue
        }

        if (!loc.startsWith(SITE_URL)) {
          errors.push(`URL #${i}: loc does not start with ${SITE_URL}: "${loc}"`)
          continue
        }

        // Check for localhost
        if (loc.includes('localhost') || loc.includes('127.0.0.1')) {
          errors.push(`URL #${i}: loc contains localhost: "${loc}"`)
          continue
        }

        // Check for undefined/null
        if (loc.includes('undefined') || loc.includes('null')) {
          errors.push(`URL #${i}: loc contains undefined/null: "${loc}"`)
          continue
        }

        // Check for duplicates
        if (seen.has(loc)) {
          errors.push(`URL #${i}: duplicate loc: "${loc}"`)
          continue
        }
        seen.add(loc)
      }

      if (errors.length > 0) {
        const msg = `Sitemap validation FAILED:\n${errors.join('\n')}`
        console.error(msg)
        throw new Error(msg)
      }

      // Generate clean XML (no priority, no changefreq — simple and valid)
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
  </url>`).join('\n')}
</urlset>`

      console.log(`Sitemap generated: ${urls.length} valid URLs`)

      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: xml,
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), sitemapPlugin()],
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf-vendor': ['pdf-lib', 'pdfjs-dist'],
        },
      },
    },
  },
})
