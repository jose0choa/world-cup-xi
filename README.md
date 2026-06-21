# World Cup Lineups

Interactive 2026 World Cup squad and lineup browser. It shows all registered teams and players, club affiliations, club leagues, EA Sports FC card ratings, club crests, player portraits, and a FIFA-style pitch view built from the latest parsed starting XI when available.

## Commands

```bash
npm install
npm run fetch:data
npm run dev
```

The generated data lives in `src/data/worldcup-2026.json`. Re-run `npm run fetch:data` to refresh squads, club league labels, EA Sports FC ratings, club crest thumbnails, and published match XIs from the current Wikipedia, Wikidata, and EA ratings pages. Player portraits load on demand in the app from each player's Wikipedia page summary.
