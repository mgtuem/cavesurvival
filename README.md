# CaveSurvival 🗡️⛏️

**2D Survival Game** — Entwickelt von Ryan und Mohammed  
Tech Stack: Next.js · Phaser.js · TailwindCSS · PWA

---

## Features

- 5-Wellen Survival in einer Mine
- 3 Schwierigkeitsgrade (Einfach / Medium / Nightmare)
- Mobs: Zombie, Skelett, Creeper
- Loot-System mit Waffen & Consumables
- Blocken / Parry Kampfsystem
- Death & Revive mit Münzsystem
- Vollständige PWA (installierbar, offline-fähig)
- 4 Sprachen: DE, EN, FR, ES

## Lokal starten

```bash
npm install
npm run dev
```

Dann öffne `http://localhost:3000`

## Deployment auf Vercel

### Option A: Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

### Option B: GitHub Integration

1. Push das Repo zu GitHub
2. Gehe zu [vercel.com/new](https://vercel.com/new)
3. Importiere das GitHub Repository
4. Vercel erkennt Next.js automatisch — klicke "Deploy"

## Projektstruktur

```
cavesurvival/
├── public/
│   ├── icons/          # PWA Icons
│   ├── manifest.json   # PWA Manifest
│   └── sw.js           # Service Worker
├── src/
│   ├── components/     # React UI Komponenten
│   ├── contexts/       # GameContext (State Management)
│   ├── game/
│   │   └── scenes/     # Phaser GameScene
│   ├── i18n/           # Übersetzungen
│   ├── pages/          # Next.js Pages
│   └── styles/         # Global CSS + Tailwind
├── vercel.json         # Vercel Config
├── next.config.js
├── tailwind.config.js
└── package.json
```
