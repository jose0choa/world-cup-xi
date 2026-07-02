import { readFileSync, writeFileSync } from 'node:fs';

const worldCupData = JSON.parse(
  readFileSync(new URL('../src/data/worldcup-2026.json', import.meta.url), 'utf8'),
);

const fallbackSiteUrl = 'https://world-cup-xi.vercel.app';
const siteUrl = normalizeSiteUrl(
  process.env.SITE_URL ||
    process.env.VITE_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    fallbackSiteUrl,
);

const paths = [
  '/',
  '/bracket',
  '/about',
  '/sources',
  '/privacy',
  ...worldCupData.teams.map((team) => `/teams/${teamSlug(team)}`),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths
  .map(
    (path) => `  <url>
    <loc>${escapeXml(`${siteUrl}${path}`)}</loc>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

const robots = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

writeFileSync(new URL('../public/sitemap.xml', import.meta.url), sitemap);
writeFileSync(new URL('../public/robots.txt', import.meta.url), robots);

function normalizeSiteUrl(value) {
  const trimmed = value.trim().replace(/\/+$/, '');
  return /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function normalizeSearchText(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function teamSlug(team) {
  return normalizeSearchText(team.name)
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
