# SmartTools 🚀

A fast, multilingual online tools platform — **Arabic · French · English**

![SmartTools](https://img.shields.io/badge/SmartTools-v1.0.0-6366f1?style=flat-square)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38BDF8?style=flat-square&logo=tailwindcss)

## ✨ Features

- 🌍 **Multilingual** — English, French, Arabic (with RTL support)
- 🌙 **Dark / Light mode** — persisted in localStorage
- 📱 **Mobile-first** responsive design
- ⚡ **Fast** — Vite + zero runtime dependencies
- 🗃️ **JSON-based** — no database, everything in flat files
- 🔍 **Search** — live search across all tools
- 📂 **4 categories**, **8 tools** — easy to expand

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| Framework | React 18 |
| Build | Vite 5 |
| Styling | Tailwind CSS 3 |
| Routing | React Router 6 |
| Icons | Lucide React |
| Data | Local JSON files |

## 📁 Project Structure

```
smarttools/
├── public/
│   ├── favicon.svg
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   ├── CategoryCard.jsx
│   │   ├── ToolCard.jsx
│   │   └── SearchBar.jsx
│   ├── data/
│   │   ├── categories.json   ← Add categories here
│   │   ├── tools.json        ← Add tools here
│   │   └── translations.json ← UI strings in 3 languages
│   ├── hooks/
│   │   ├── useTheme.js
│   │   └── useLang.js
│   ├── lib/
│   │   └── utils.js
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   ├── CategoriesPage.jsx
│   │   ├── ToolPage.jsx
│   │   └── SearchPage.jsx
│   ├── styles/
│   │   └── index.css
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/your-username/smarttools.git
cd smarttools

# Install
npm install

# Develop
npm run dev

# Build
npm run build

# Preview production
npm run preview
```

## ➕ Adding a New Category

Edit `src/data/categories.json`:

```json
{
  "id": "my-category",
  "slug": "my-category",
  "icon": "Wrench",
  "color": "from-orange-500 to-red-600",
  "name": { "en": "My Category", "fr": "Ma Catégorie", "ar": "فئتي" },
  "description": { "en": "...", "fr": "...", "ar": "..." }
}
```

## ➕ Adding a New Tool

Edit `src/data/tools.json`:

```json
{
  "id": "my-tool",
  "slug": "my-tool",
  "categoryId": "my-category",
  "icon": "Wrench",
  "featured": false,
  "name": { "en": "My Tool", "fr": "Mon outil", "ar": "أداتي" },
  "description": { "en": "...", "fr": "...", "ar": "..." },
  "howTo": {
    "en": ["Step 1", "Step 2", "Step 3"],
    "fr": ["Étape 1", "Étape 2", "Étape 3"],
    "ar": ["خطوة 1", "خطوة 2", "خطوة 3"]
  }
}
```

Then add a live component in `src/pages/ToolPage.jsx` and register it in `LIVE_TOOLS`.

## 🌐 Pages & Routes

| Route | Page |
|-------|------|
| `/` | Homepage |
| `/categories` | All categories |
| `/categories/:slug` | Single category |
| `/tools/:slug` | Tool page |
| `/search?q=...` | Search results |

## 🔧 Live Tools Included

| Tool | Interface |
|------|-----------|
| Word Counter | ✅ Live |
| Password Generator | ✅ Live |
| Age Calculator | ✅ Live |
| BMI Calculator | ✅ Live |
| PDF to Word | 🔲 Coming soon |
| Word to PDF | 🔲 Coming soon |
| Compress Image | 🔲 Coming soon |
| Resize Image | 🔲 Coming soon |

## 📦 Deploy

### Vercel
```bash
npx vercel
```

### Netlify
```bash
npm run build
# Upload dist/ to Netlify
```

### GitHub Pages
```bash
npm run build
# Push dist/ to gh-pages branch
```

## 📄 License

MIT — free to use, fork, and expand.
