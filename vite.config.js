import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Sitemap plugin — generates sitemap.xml at build time.
 * Reads categories.json and tools.json from src/data and creates URLs.
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
      urls.push({ loc: '/', priority: '1.0', changefreq: 'daily', lastmod: today })

      // Categories
      cats.forEach(cat => {
        urls.push({
          loc: `/categories/${cat.slug}`,
          priority: '0.8',
          changefreq: 'weekly',
          lastmod: today,
        })
      })

      // Tools
      tools.forEach(tool => {
        urls.push({
          loc: `/tools/${tool.slug}`,
          priority: '0.9',
          changefreq: 'monthly',
          lastmod: tool.created_at || today,
        })
      })

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`

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
})
