import { useEffect } from 'react'

/**
 * SEO Hook — sets document head meta tags dynamically.
 * Supports: title, description, canonical, OG, Twitter, hreflang, JSON-LD.
 * All canonical URLs are absolute (https://smarttools.app/...).
 *
 * Usage: useSEO({ title, description, canonical, ogImage, ogType, jsonLd, lang })
 */

export const SITE_URL = 'https://smartools.vercel.app'
export const SITE_NAME = 'SmartTools'

function upsertMeta(selector, attr, content) {
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement('meta')
    const match = selector.match(/meta\[(\w+)="([^"]+)"\]/)
    if (match) {
      el.setAttribute(match[1], match[2])
    } else {
      el.setAttribute('name', selector)
    }
    document.head.appendChild(el)
  }
  el.setAttribute(attr, content)
}

function upsertLink(rel, href, extraAttrs = {}) {
  let selector = `link[rel="${rel}"]`
  if (extraAttrs.hreflang) selector += `[hreflang="${extraAttrs.hreflang}"]`
  let link = document.head.querySelector(selector)
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', rel)
    document.head.appendChild(link)
  }
  link.setAttribute('href', href)
  for (const [k, v] of Object.entries(extraAttrs)) {
    link.setAttribute(k, v)
  }
}

function upsertJsonLd(id, data) {
  let script = document.getElementById(id)
  if (!script) {
    script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = id
    document.head.appendChild(script)
  }
  script.textContent = JSON.stringify(data)
}

function removeJsonLd(id) {
  document.getElementById(id)?.remove()
}

function removeHreflangs() {
  document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove())
}

export function useSEO({ title, description, canonical, ogImage, ogType = 'website', jsonLd, lang = 'en', hreflangs } = {}) {
  useEffect(() => {
    const fullTitle = title
      ? title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`
      : `${SITE_NAME} - Free Online Tools`

    document.title = fullTitle

    if (description) {
      upsertMeta('meta[name="description"]', 'content', description)
    }

    if (canonical) {
      const absUrl = canonical.startsWith('http') ? canonical : `${SITE_URL}${canonical}`
      upsertLink('canonical', absUrl)
    }

    upsertMeta('meta[property="og:title"]', 'content', fullTitle)
    upsertMeta('meta[property="og:description"]', 'content', description || '')
    upsertMeta('meta[property="og:type"]', 'content', ogType)
    upsertMeta('meta[property="og:site_name"]', 'content', SITE_NAME)
    upsertMeta('meta[property="og:image"]', 'content', ogImage || `${SITE_URL}/logo.png`)
    if (canonical) {
      const absUrl = canonical.startsWith('http') ? canonical : `${SITE_URL}${canonical}`
      upsertMeta('meta[property="og:url"]', 'content', absUrl)
    }

    upsertMeta('meta[name="twitter:card"]', 'content', 'summary_large_image')
    upsertMeta('meta[name="twitter:title"]', 'content', fullTitle)
    upsertMeta('meta[name="twitter:description"]', 'content', description || '')
    upsertMeta('meta[name="twitter:image"]', 'content', ogImage || `${SITE_URL}/logo.png`)

    removeHreflangs()
    if (hreflangs !== false && canonical) {
      for (const l of ['en', 'fr', 'ar']) {
        upsertLink('alternate', `${SITE_URL}${canonical}`, { hreflang: l })
      }
      upsertLink('alternate', `${SITE_URL}${canonical}`, { hreflang: 'x-default' })
    }

    if (jsonLd) {
      upsertJsonLd('page-jsonld', jsonLd)
    } else {
      removeJsonLd('page-jsonld')
    }

    return () => {
      document.title = `${SITE_NAME} - Free Online Tools`
    }
  }, [title, description, canonical, ogImage, ogType, jsonLd, lang])
}

export function buildWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: 'Free online tools for PDF, images, text and calculators. No sign-up required.',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE_URL}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/logo.png`,
      },
    ],
  }
}

export function buildBreadcrumbJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  }
}

export function buildFaqJsonLd(faqs) {
  if (!faqs || faqs.length === 0) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a,
      },
    })),
  }
}

export function buildToolJsonLd(tool, category, descOverride) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.name?.en || tool.name,
    url: `${SITE_URL}/tools/${tool.slug}`,
    description: descOverride || tool.description?.en || tool.description,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any (Web Browser)',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    isAccessibleForFree: true,
  }
}

export function useToolViews(toolSlug) {
  useEffect(() => {
    if (!toolSlug) return
    try {
      const key = `tool_views_${toolSlug}`
      const current = parseInt(localStorage.getItem(key) || '0', 10)
      localStorage.setItem(key, String(current + 1))
    } catch {}
  }, [toolSlug])

  if (!toolSlug) return 0
  try {
    return parseInt(localStorage.getItem(`tool_views_${toolSlug}`) || '0', 10)
  } catch {
    return 0
  }
}

export function getPopularTools(allTools, limit = 12) {
  const views = allTools.map(t => {
    try {
      return { tool: t, views: parseInt(localStorage.getItem(`tool_views_${t.slug}`) || '0', 10) }
    } catch {
      return { tool: t, views: 0 }
    }
  })
  views.sort((a, b) => {
    if (b.views !== a.views) return b.views - a.views
    if (a.tool.featured && !b.tool.featured) return -1
    if (!a.tool.featured && b.tool.featured) return 1
    return 0
  })
  return views.slice(0, limit).map(v => v.tool)
}
