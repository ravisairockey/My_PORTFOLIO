# Ravi Sai Vigneswara — Portfolio

> Environment Artist & Game Designer · Unreal Engine worlds, overgrown ruins and tidal light.

A premium, single-page portfolio built with **React 19**, **Vite 7**, and **Tailwind CSS v4**. The entire app is compiled into a single self-contained HTML file via `vite-plugin-singlefile`, making it ideal for static hosting on GitHub Pages.

---

## ✨ Features

- **Single-file build** — all JS, CSS, and assets inlined into one `index.html`
- **Canvas FX** — custom particle systems, liquid video, and generative text effects
- **Responsive** — fluid layouts from mobile to ultrawide
- **Type-safe** — strict TypeScript with `noUnusedLocals` / `noUnusedParameters`
- **Zero runtime errors** — type-checked in CI before every deploy

---

## 🛠 Tech Stack

| Layer        | Technology                                      |
| ------------ | ----------------------------------------------- |
| Framework    | React 19                                        |
| Build tool   | Vite 7                                          |
| Styling      | Tailwind CSS v4 (`@tailwindcss/vite`)          |
| Language     | TypeScript 5.9 (strict mode)                    |
| Bundling     | `vite-plugin-singlefile`                        |
| Icons        | lucide-react                                    |
| Deployment   | GitHub Actions → GitHub Pages                   |

---

## 🚀 Live Site

**https://ravisairockey.github.io/My_PORTFOLIO/**

---

## 📦 Local Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Type-check the project
npm run type-check

# Build for production → dist/
npm run build

# Preview the production build locally
npm run preview
```

---

## 📤 Deployment (GitHub Pages)

This repository includes a GitHub Actions workflow (`.github/workflows/pages.yml`) that automatically builds and deploys the site on every push to `main`.

### One-time setup

1. Go to **Repo Settings → Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions**
3. Push to `main` — the workflow handles the rest

### Workflow overview

| Step          | Action                                              |
| ------------- | --------------------------------------------------- |
| Checkout      | `actions/checkout@v4`                               |
| Setup Node 20| `actions/setup-node@v4` (with npm cache)            |
| Install       | `npm ci` (clean install from lockfile)              |
| Type-check    | `npm run type-check` (`tsc --noEmit`)               |
| Build         | `npm run build` (Vite production build)             |
| Upload        | `actions/upload-pages-artifact@v3` (dist folder)    |
| Deploy        | `actions/deploy-pages@v4` (publishes to Pages)      |

---

## 📁 Project Structure

```
webPortfolio/
├── .github/
│   └── workflows/
│       └── pages.yml          # CI/CD pipeline
├── public/
│   ├── img/                   # Showcase images
│   └── videos/                # Showcase videos
├── src/
│   ├── App.tsx                # Root component
│   ├── data.ts                # Content data
│   ├── main.tsx               # Entry point
│   ├── index.css              # Global styles (Tailwind)
│   ├── fx/                    # Canvas & visual effects
│   │   ├── canvas.tsx
│   │   ├── carousels.tsx
│   │   ├── liquidVideo.tsx
│   │   ├── media.tsx
│   │   ├── text.tsx
│   │   └── util.ts
│   ├── sections/              # Page sections
│   │   ├── Core.tsx
│   │   └── Showcase.tsx
│   └── utils/
│       └── cn.ts              # className merge utility
├── index.html                 # HTML template
├── vite.config.ts             # Vite config (base: /My_PORTFOLIO/)
├── tsconfig.json              # TypeScript config (strict)
├── package.json
└── .gitignore
```

---

## 📄 License

Private portfolio. All rights reserved.