# Prop 22 Earnings Top‑Up Calculator (Next.js + Tailwind)

A minimal Next.js (App Router) app that estimates the Prop 22 earnings top‑up for a 14‑day period.

## Quick start
```bash
npm i   # or: yarn / pnpm i
npm run dev  # http://localhost:3000
```

## Build & run
```bash
npm run build
npm start
```

## Deploy
### Vercel
- Push to GitHub
- Import on https://vercel.com/new

### Netlify
- New site from Git
- Build command: `next build`
- Publish directory: `.next`

## Data (Aug 2025)
- Prefilled city minimum wages: Berkeley $19.18, San Francisco $19.18, Los Angeles (City) $17.87, Emeryville $19.90, etc.
- Prop 22 per‑mile default: $0.36 (editable in UI).

## 3D apartment model

`public/apartment-3d/` holds a standalone, walkable Three.js model of a furnished one-bedroom
apartment built from a 2D floor plan. With the dev server running, open
`/apartment-3d/index.html`, or open the file directly in a browser. Geometry is entered in the
floor plan's pixel coordinates (see the notes at the top of `apartment.js`).
