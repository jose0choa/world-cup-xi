# World Cup Lineups

Interactive 2026 World Cup squad, lineup, and knockout bracket browser. It shows all registered teams and players, club affiliations, club leagues, EA Sports FC card ratings, computed team rankings, club crests, player portraits, a FIFA-style pitch view built from the latest parsed starting XI when available, and a bracket view for the knockout rounds.

## Commands

```bash
npm install
npm run fetch:data
npm run sitemap
npm run dev
```

The generated data lives in `src/data/worldcup-2026.json`. Re-run `npm run fetch:data` to refresh squads, club league labels, EA Sports FC ratings, club crest thumbnails, and published match XIs from the current Wikipedia, Wikidata, and EA ratings pages. Player portraits load on demand in the app from each player's Wikipedia page summary. Teams without enough player ratings are ordered after computed teams with a small FIFA men's ranking fallback.

`npm run build` regenerates `public/sitemap.xml` and `public/robots.txt`. Set `SITE_URL` in Vercel to your production domain when you add a custom domain.
