import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { knockoutData as existingKnockoutData } from '../src/data/knockout-2026.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const SQUADS_URL =
  'https://en.wikipedia.org/w/index.php?title=2026_FIFA_World_Cup_squads&action=raw';
const GROUP_PAGE = (letter) =>
  `https://en.wikipedia.org/w/index.php?title=2026_FIFA_World_Cup_Group_${letter}&action=raw`;
const WIKI_API = 'https://en.wikipedia.org/w/api.php';
const EA_FC_RATINGS_PAGE = 'https://www.ea.com/en/games/ea-sports-fc/ratings';
const EA_FC_RATINGS_NEXT_DATA = 'https://www.ea.com/_next/data';
const EA_FC_LEGACY_RATINGS_API = 'https://drop-api.ea.com/rating/ea-sports-fc';
const FUT_GG_PLAYERS_URL = 'https://www.fut.gg/players';
const FUT_GG_GAME = '26';
const EA_FC_PAGE_SIZE = 100;
const DATA_PATH = path.join(rootDir, 'src', 'data', 'worldcup-2026.json');
const KNOCKOUT_PATH = path.join(rootDir, 'src', 'data', 'knockout-2026.js');
const BRACKET_URL = 'https://www.espn.com/soccer/bracket';
const MANUAL_EA_FC_RATING_OVERRIDES = {
  'BRA-10-neymar': {
    rating: 83,
    team: 'Santos',
    source: 'Manual app override',
  },
};

const TEAM_META = {
  'Czech Republic': { code: 'CZE', flag: 'cz', primary: '#d7141a' },
  Mexico: { code: 'MEX', flag: 'mx', primary: '#006847' },
  'South Africa': { code: 'RSA', flag: 'za', primary: '#007a4d' },
  'South Korea': { code: 'KOR', flag: 'kr', primary: '#c60c30' },
  'Bosnia and Herzegovina': { code: 'BIH', flag: 'ba', primary: '#002f6c' },
  Canada: { code: 'CAN', flag: 'ca', primary: '#d80621' },
  Qatar: { code: 'QAT', flag: 'qa', primary: '#8a1538' },
  Switzerland: { code: 'SUI', flag: 'ch', primary: '#d52b1e' },
  Brazil: { code: 'BRA', flag: 'br', primary: '#009b3a' },
  Haiti: { code: 'HAI', flag: 'ht', primary: '#00209f' },
  Morocco: { code: 'MAR', flag: 'ma', primary: '#c1272d' },
  Scotland: { code: 'SCO', flag: 'gb-sct', primary: '#005eb8' },
  Australia: { code: 'AUS', flag: 'au', primary: '#ffcd00' },
  Paraguay: { code: 'PAR', flag: 'py', primary: '#d52b1e' },
  Turkey: { code: 'TUR', flag: 'tr', primary: '#e30a17' },
  'United States': { code: 'USA', flag: 'us', primary: '#3c3b6e' },
  Curaçao: { code: 'CUW', flag: 'cw', primary: '#002b7f' },
  Ecuador: { code: 'ECU', flag: 'ec', primary: '#ffdd00' },
  Germany: { code: 'GER', flag: 'de', primary: '#111111' },
  'Ivory Coast': { code: 'CIV', flag: 'ci', primary: '#f77f00' },
  Japan: { code: 'JPN', flag: 'jp', primary: '#bc002d' },
  Netherlands: { code: 'NED', flag: 'nl', primary: '#f36c21' },
  Sweden: { code: 'SWE', flag: 'se', primary: '#006aa7' },
  Tunisia: { code: 'TUN', flag: 'tn', primary: '#e70013' },
  Belgium: { code: 'BEL', flag: 'be', primary: '#111111' },
  Egypt: { code: 'EGY', flag: 'eg', primary: '#ce1126' },
  Iran: { code: 'IRN', flag: 'ir', primary: '#239f40' },
  'New Zealand': { code: 'NZL', flag: 'nz', primary: '#00247d' },
  'Cape Verde': { code: 'CPV', flag: 'cv', primary: '#003893' },
  'Saudi Arabia': { code: 'KSA', flag: 'sa', primary: '#006c35' },
  Spain: { code: 'ESP', flag: 'es', primary: '#c60b1e' },
  Uruguay: { code: 'URU', flag: 'uy', primary: '#0038a8' },
  France: { code: 'FRA', flag: 'fr', primary: '#0055a4' },
  Iraq: { code: 'IRQ', flag: 'iq', primary: '#ce1126' },
  Norway: { code: 'NOR', flag: 'no', primary: '#ba0c2f' },
  Senegal: { code: 'SEN', flag: 'sn', primary: '#00853f' },
  Algeria: { code: 'ALG', flag: 'dz', primary: '#006233' },
  Argentina: { code: 'ARG', flag: 'ar', primary: '#74acdf' },
  Austria: { code: 'AUT', flag: 'at', primary: '#ed2939' },
  Jordan: { code: 'JOR', flag: 'jo', primary: '#007a3d' },
  Colombia: { code: 'COL', flag: 'co', primary: '#fcd116' },
  'DR Congo': { code: 'COD', flag: 'cd', primary: '#007fff' },
  Portugal: { code: 'POR', flag: 'pt', primary: '#006600' },
  Uzbekistan: { code: 'UZB', flag: 'uz', primary: '#1eb53a' },
  Croatia: { code: 'CRO', flag: 'hr', primary: '#e31b23' },
  England: { code: 'ENG', flag: 'gb-eng', primary: '#cf081f' },
  Ghana: { code: 'GHA', flag: 'gh', primary: '#ce1126' },
  Panama: { code: 'PAN', flag: 'pa', primary: '#d21034' },
};

const CODE_TO_TEAM = Object.fromEntries(
  Object.entries(TEAM_META).map(([team, meta]) => [meta.code, team]),
);

const TEAM_ALIASES = {
  Czechia: 'Czech Republic',
  'Korea Republic': 'South Korea',
  'Côte d’Ivoire': 'Ivory Coast',
  "Côte d'Ivoire": 'Ivory Coast',
  USA: 'United States',
};

const EA_FC_NATIONALITY_ALIASES = {
  'Cape Verde': ['Cape Verde Islands'],
  'Czech Republic': ['Czechia', 'Czech Republic'],
  'DR Congo': ['Congo DR', 'Democratic Republic of the Congo', 'DR Congo'],
  'Ivory Coast': ["Côte d'Ivoire", 'Ivory Coast'],
  Netherlands: ['Holland', 'Netherlands'],
  'South Korea': ['Korea Republic', 'Republic of Korea', 'South Korea'],
  Turkey: ['Türkiye', 'Turkey'],
  'United States': ['United States', 'USA'],
};

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'WorldCupLineupsLocalPrototype/0.1 (local generated data; contact: none)',
    },
  });

  if (!response.ok) {
    throw new Error(`Could not fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function splitTopLevelPipes(value) {
  const parts = [];
  let current = '';
  let curlyDepth = 0;
  let squareDepth = 0;

  for (let index = 0; index < value.length; index += 1) {
    const pair = value.slice(index, index + 2);

    if (pair === '{{') {
      curlyDepth += 1;
      current += pair;
      index += 1;
      continue;
    }

    if (pair === '}}' && curlyDepth > 0) {
      curlyDepth -= 1;
      current += pair;
      index += 1;
      continue;
    }

    if (pair === '[[') {
      squareDepth += 1;
      current += pair;
      index += 1;
      continue;
    }

    if (pair === ']]' && squareDepth > 0) {
      squareDepth -= 1;
      current += pair;
      index += 1;
      continue;
    }

    if (value[index] === '|' && curlyDepth === 0 && squareDepth === 0) {
      parts.push(current);
      current = '';
      continue;
    }

    current += value[index];
  }

  parts.push(current);
  return parts;
}

function parseTemplateParams(line, templateName) {
  const body = line
    .trim()
    .replace(new RegExp(`^\\{\\{${templateName}\\s*\\|?`), '')
    .replace(/\}\}$/, '');

  return Object.fromEntries(
    splitTopLevelPipes(body)
      .map((part) => {
        const equalsIndex = part.indexOf('=');
        if (equalsIndex === -1) return null;
        return [part.slice(0, equalsIndex).trim(), part.slice(equalsIndex + 1).trim()];
      })
      .filter(Boolean),
  );
}

function stripTemplates(value) {
  let cleaned = value;
  let previous = '';

  while (cleaned !== previous) {
    previous = cleaned;
    cleaned = cleaned.replace(/\{\{[^{}]*\}\}/g, '');
  }

  return cleaned;
}

function cleanWikiText(value = '') {
  return stripTemplates(value)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<ref\b[^>]*>[\s\S]*?<\/ref>/g, '')
    .replace(/<ref\b[^/]*\/>/g, '')
    .replace(/\[\[([^[\]|]+)\|([^[\]]+)\]\]/g, '$2')
    .replace(/\[\[([^[\]]+)\]\]/g, '$1')
    .replace(/'''/g, '')
    .replace(/''/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function wikiLinkTarget(value = '') {
  const match = value.match(/\[\[([^[\]|#]+)(?:#[^[\]|]+)?(?:\|[^[\]]+)?\]\]/);
  return cleanWikiText(match?.[1] ?? value);
}

function normalizeName(value = '') {
  return cleanWikiText(value)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[’']/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();
}

function slugify(value = '') {
  return normalizeName(value).replace(/\s+/g, '-');
}

function ageOnOpeningDay(ageTemplate = '') {
  const match = ageTemplate.match(
    /birth date and age2\|(?:[^|{}=]+=[^|{}]*\|)*2026\|6\|11\|(\d{4})\|(\d{1,2})\|(\d{1,2})/,
  );

  if (!match) return null;

  const [, year, month, day] = match.map(Number);
  let age = 2026 - year;
  if (month > 6 || (month === 6 && day > 11)) age -= 1;
  return age;
}

function parseSquads(raw) {
  const usefulText = raw.split('\n==Statistics==')[0];
  const teams = [];
  let currentGroup = '';
  let currentTeam = null;

  for (const line of usefulText.split('\n')) {
    const groupMatch = line.match(/^==Group ([A-L])==$/);
    if (groupMatch) {
      currentGroup = groupMatch[1];
      continue;
    }

    const teamMatch = line.match(/^===([^=]+)===$/);
    if (teamMatch) {
      const name = cleanWikiText(teamMatch[1]);
      const meta = TEAM_META[name];

      currentTeam = {
        id: meta?.code?.toLowerCase() ?? slugify(name),
        name,
        code: meta?.code ?? name.slice(0, 3).toUpperCase(),
        flag: meta?.flag ?? '',
        group: currentGroup,
        coach: '',
        primary: meta?.primary ?? '#246b45',
        players: [],
      };
      teams.push(currentTeam);
      continue;
    }

    if (!currentTeam) continue;

    if (line.startsWith('Coach:')) {
      currentTeam.coach = cleanWikiText(line.replace(/^Coach:\s*/, ''));
      continue;
    }

    if (line.startsWith('{{nat fs g player')) {
      const params = parseTemplateParams(line, 'nat fs g player');
      const name = cleanWikiText(params.name);
      const player = {
        id: `${currentTeam.code}-${params.no}-${slugify(name)}`,
        number: Number(params.no),
        position: params.pos,
        name,
        page: wikiLinkTarget(params.name),
        age: ageOnOpeningDay(params.age),
        caps: Number(params.caps ?? 0),
        goals: Number(params.goals ?? 0),
        club: cleanWikiText(params.club),
        clubPage: wikiLinkTarget(params.club),
        clubCountry: params.clubnat ?? '',
        captain: Boolean(params.other?.includes('Captain')),
      };

      currentTeam.players.push(player);
    }
  }

  for (const team of teams) {
    team.players.sort((a, b) => a.number - b.number);
    team.playersByNumber = Object.fromEntries(team.players.map((player) => [player.number, player.id]));
  }

  return teams.filter((team) => team.players.length > 0);
}

function chunks(items, size) {
  const result = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

async function fetchJson(url) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'WorldCupLineupsLocalPrototype/0.1 (local generated data; contact: none)',
      },
    });

    if (response.status === 429) {
      const retryAfter = Number(response.headers.get('retry-after'));
      const waitMs = Math.min(
        Number.isFinite(retryAfter) ? retryAfter * 1000 : 1800 * (attempt + 1),
        8000,
      );
      await sleep(waitMs);
      continue;
    }

    if (!response.ok) {
      throw new Error(`Could not fetch ${url}: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  throw new Error(`Could not fetch ${url}: too many rate-limit retries`);
}

function wikiApiUrl(params) {
  const url = new URL(WIKI_API);
  url.search = new URLSearchParams({ format: 'json', origin: '*', ...params });
  return url;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function roundIdForMatchNumber(matchNumber) {
  if (matchNumber >= 73 && matchNumber <= 88) return 'round-of-32';
  if (matchNumber >= 89 && matchNumber <= 96) return 'round-of-16';
  if (matchNumber >= 97 && matchNumber <= 100) return 'quarterfinals';
  if (matchNumber >= 101 && matchNumber <= 102) return 'semifinals';
  if (matchNumber >= 103 && matchNumber <= 104) return 'final';
  return '';
}

function mapEspnStatus(status = '') {
  const normalized = status.trim();
  if (normalized === 'FT') return 'Final';
  if (normalized === 'FT-Pens') return 'Final pens';
  if (normalized === 'AET') return 'Final aet';
  if (normalized === 'Upcoming') return 'Upcoming';
  if (normalized === 'TBD') return 'Awaiting';
  if (/^Final/i.test(normalized)) return 'Final';
  return normalized || 'Awaiting';
}

function parseKnockoutMatches(rawHtml) {
  const matchMap = new Map();
  const blocks = rawHtml.matchAll(/<div class="BracketMatchup[\s\S]*?SeriesHeader__MatchNumber">Match (\d+)<\/div>[\s\S]*?<\/div><\/div><\/div><\/div>/g);

  for (const block of blocks) {
    const html = block[0];
    const matchNumber = Number(block[1]);
    const status = mapEspnStatus(html.match(/SeriesHeader__Status">([^<]+)</)?.[1] ?? '');
    const teamMatches = [...html.matchAll(/BracketCell__Name[^>]*>([^<]+)<\/div>/g)].map((item) => item[1].trim());
    const scoreMatches = [...html.matchAll(/BracketCell__Score[^>]*><div>(\d+)/g)].map((item) => item[1].trim());
    const winnerIndex = html.includes('BracketCell__WinnerIcon')
      ? (html.includes('BracketCell__Score--post--loser') ? 1 : 0)
      : -1;
    const winnerCode = '';

    matchMap.set(matchNumber, {
      status,
      teams: teamMatches.slice(0, 2),
      scores: scoreMatches.slice(0, 2),
      winnerIndex,
      winnerCode,
    });
  }

  return matchMap;
}

function teamLabelToEntry(label = '') {
  const normalized = label.trim();
  if (!normalized) return { label: '' };
  const code = Object.entries(CODE_TO_TEAM).find(([, team]) => team === normalized)?.[0];
  return code ? { code } : { label: normalized };
}

function updateKnockoutData(existingData, matchMap) {
  const next = structuredClone(existingData);

  for (const round of next.rounds ?? []) {
    for (const match of round.matches ?? []) {
      const matchNumber = Number(match.id.replace(/^M/, ''));
      const live = matchMap.get(matchNumber);
      if (!live) continue;

      match.status = live.status;
      if (live.teams.length === 2) {
        match.teams = live.teams.map((team) => teamLabelToEntry(team));
      }
      if (live.scores.length === 2) {
        match.teams = (match.teams ?? []).map((team, index) =>
          live.scores[index] ? { ...team, score: live.scores[index] } : team,
        );
      }
      if (live.status === 'Final' || live.status === 'Final pens' || live.status === 'Final aet') {
        const winnerEntry = match.teams?.[live.winnerIndex] ?? null;
        match.winnerCode = winnerEntry?.code ?? match.winnerCode ?? '';
      }
    }
  }

  next.updatedAt = new Date().toISOString().slice(0, 10);
  return next;
}

async function fetchKnockoutData() {
  const html = await fetchText(BRACKET_URL);
  return parseKnockoutMatches(html);
}

async function writeKnockoutData() {
  const matchMap = await fetchKnockoutData();
  const updated = updateKnockoutData(existingKnockoutData, matchMap);
  await writeFile(KNOCKOUT_PATH, `export const knockoutData = ${JSON.stringify(updated, null, 2)};\n`);
  return updated;
}

function parseClubImageFile(raw = '') {
  const cleaned = raw.replace(/<!--[\s\S]*?-->/g, '');
  const candidates = [];

  for (const line of cleaned.split('\n')) {
    const match = line.match(/^\|\s*(image|logo|crest|badge)\s*=\s*(.+?)\s*$/i);
    if (!match) continue;

    let value = match[2].trim();
    if (!value || value === 'none') continue;

    const fileLink = value.match(/\[\[(?:File|Image):([^|\]]+)/i);
    if (fileLink) value = fileLink[1].trim();
    value = cleanWikiText(value).split('|')[0].trim();

    if (!value || /^(no|none|n\/a)$/i.test(value)) continue;
    if (/\b(flag|kit|jersey|stadium|commons-logo|placeholder)\b/i.test(value)) continue;

    candidates.push(value.replace(/^(File|Image):\s*/i, ''));
  }

  const preferred = candidates.find((file) => /\b(logo|crest|badge|escudo|emblem)\b/i.test(file));
  const file = preferred ?? candidates[0];
  return file ? `File:${file}` : '';
}

function parseClubLeague(raw = '') {
  const cleaned = raw.replace(/<!--[\s\S]*?-->/g, '');

  for (const line of cleaned.split('\n')) {
    const match = line.match(/^\|\s*league\s*=\s*(.+?)\s*$/i);
    if (!match) continue;

    const league = wikiLinkTarget(match[1]);
    if (league && !/^[-—]$/.test(league)) return league;
  }

  return '';
}

function normalizeFileTitle(title = '') {
  return title.replace(/^(File|Image):\s*/i, 'File:').replaceAll('_', ' ');
}

function normalizeColor(value = '') {
  const hex = value.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(hex)) {
    return `#${hex.split('').map((char) => char + char).join('')}`;
  }
  if (/^[0-9a-f]{6}$/i.test(hex)) return `#${hex}`;
  return '';
}

function patternFile(prefix, pattern) {
  const cleanPattern = pattern?.trim().replace(/^_/, '');
  return cleanPattern ? `File:Kit ${prefix} ${cleanPattern}.png` : '';
}

function extractTemplates(raw, templateName) {
  const templates = [];
  const needle = `{{${templateName}`;
  let start = raw.indexOf(needle);

  while (start !== -1) {
    let depth = 0;
    for (let index = start; index < raw.length - 1; index += 1) {
      const pair = raw.slice(index, index + 2);
      if (pair === '{{') {
        depth += 1;
        index += 1;
        continue;
      }
      if (pair === '}}') {
        depth -= 1;
        index += 1;
        if (depth === 0) {
          templates.push(raw.slice(start, index + 1));
          start = raw.indexOf(needle, index + 1);
          break;
        }
      }
    }

    if (depth !== 0) break;
  }

  return templates;
}

function parseKitTemplate(template) {
  const params = parseTemplateParams(template, 'Football kit');
  const title = cleanWikiText(params.title ?? '');

  return {
    title: TEAM_ALIASES[title] ?? title,
    colors: {
      leftArm: normalizeColor(params.leftarm),
      body: normalizeColor(params.body),
      rightArm: normalizeColor(params.rightarm),
      shorts: normalizeColor(params.shorts),
      socks: normalizeColor(params.socks),
    },
    patterns: {
      leftArm: patternFile('left arm', params.pattern_la),
      body: patternFile('body', params.pattern_b),
      rightArm: patternFile('right arm', params.pattern_ra),
      shorts: patternFile('shorts', params.pattern_sh),
      socks: patternFile('socks', params.pattern_so),
    },
  };
}

function parseKitsFromSection(section) {
  return extractTemplates(section, 'Football kit').map(parseKitTemplate).filter((kit) => kit.title);
}

async function fetchPageThumbnails(pages, thumbSize = '220') {
  const thumbnailsByRequestedPage = new Map();

  for (const batch of chunks([...new Set(pages.filter(Boolean))], 30)) {
    const url = wikiApiUrl({
      action: 'query',
      prop: 'pageimages',
      redirects: '1',
      piprop: 'thumbnail',
      pithumbsize: thumbSize,
      titles: batch.join('|'),
    });
    const json = await fetchJson(url);
    await sleep(500);
    const redirectMap = new Map();

    json.query?.normalized?.forEach((item) => redirectMap.set(item.from, item.to));
    json.query?.redirects?.forEach((item) => redirectMap.set(item.from, item.to));

    const pagesByTitle = new Map(
      Object.values(json.query?.pages ?? {}).map((page) => [page.title, page]),
    );

    for (const requestedTitle of batch) {
      const normalizedTitle = redirectMap.get(requestedTitle) ?? requestedTitle;
      const finalTitle = redirectMap.get(normalizedTitle) ?? normalizedTitle;
      const page = pagesByTitle.get(finalTitle) ?? pagesByTitle.get(normalizedTitle);
      const url = page?.thumbnail?.source ?? '';
      if (!url) continue;

      const thumbnail = {
        url,
        sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replaceAll(' ', '_'))}`,
        page: page.title,
      };

      thumbnailsByRequestedPage.set(requestedTitle, thumbnail);
      thumbnailsByRequestedPage.set(page.title, thumbnail);
    }
  }

  return thumbnailsByRequestedPage;
}

async function attachPlayerPhotos(teams) {
  const players = teams.flatMap((team) => team.players);
  const missingPlayers = players.filter((player) => !player.photo);
  const thumbnailsByPage = await fetchPageThumbnails(missingPlayers.map((player) => player.page), '220');

  for (const player of missingPlayers) {
    const thumbnail = thumbnailsByPage.get(player.page);
    player.photo = thumbnail?.url ?? '';
    player.photoSource = thumbnail?.sourceUrl ?? '';
  }

  return players.filter((player) => player.photo).length;
}

async function loadExistingData() {
  try {
    return JSON.parse(await readFile(DATA_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function applyCachedImages(teams, existingData) {
  if (!existingData?.teams) return { clubLogoAliases: 0, playerPhotos: 0 };

  const existingPlayers = existingData.teams.flatMap((team) => team.players ?? []);
  const cachedByPlayerId = new Map(existingPlayers.map((player) => [player.id, player]));
  const cachedByClubPage = new Map();

  for (const player of existingPlayers) {
    if (player.clubPage && player.clubLogo) {
      cachedByClubPage.set(player.clubPage, {
        clubLogo: player.clubLogo,
        clubLogoSource: player.clubLogoSource,
      });
    }
  }

  for (const player of teams.flatMap((team) => team.players)) {
    const cachedPlayer = cachedByPlayerId.get(player.id);
    const cachedClub = cachedByClubPage.get(player.clubPage);

    player.clubLogo = cachedClub?.clubLogo ?? cachedPlayer?.clubLogo ?? '';
    player.clubLogoSource = cachedClub?.clubLogoSource ?? cachedPlayer?.clubLogoSource ?? '';
    player.clubLeague = cachedPlayer?.clubLeague ?? '';
    player.eaFcRating = cachedPlayer?.eaFcRating ?? null;
    player.eaFcTeam = cachedPlayer?.eaFcTeam ?? '';
    player.eaFcRatingSource = cachedPlayer?.eaFcRatingSource ?? '';
    player.eaFcRatingUrl = cachedPlayer?.eaFcRatingUrl ?? '';
    player.photo = cachedPlayer?.photo ?? '';
    player.photoSource = cachedPlayer?.photoSource ?? '';
  }

  return {
    clubLogoAliases: cachedByClubPage.size,
    playerPhotos: teams.flatMap((team) => team.players).filter((player) => player.photo).length,
  };
}

async function fetchClubWikidataIds(clubPages) {
  const idsByClubPage = new Map();

  for (const batch of chunks([...new Set(clubPages.filter(Boolean))], 50)) {
    const url = wikiApiUrl({
      action: 'query',
      prop: 'pageprops',
      redirects: '1',
      titles: batch.join('|'),
    });
    const json = await fetchJson(url);
    await sleep(250);
    const redirectMap = new Map();

    json.query?.normalized?.forEach((item) => redirectMap.set(item.from, item.to));
    json.query?.redirects?.forEach((item) => redirectMap.set(item.from, item.to));

    const pagesByTitle = new Map(
      Object.values(json.query?.pages ?? {}).map((page) => [page.title, page]),
    );

    for (const requestedTitle of batch) {
      const normalizedTitle = redirectMap.get(requestedTitle) ?? requestedTitle;
      const finalTitle = redirectMap.get(normalizedTitle) ?? normalizedTitle;
      const page = pagesByTitle.get(finalTitle) ?? pagesByTitle.get(normalizedTitle);
      const id = page?.pageprops?.wikibase_item;
      if (!id) continue;

      idsByClubPage.set(requestedTitle, id);
      idsByClubPage.set(page.title, id);
    }
  }

  return idsByClubPage;
}

function bestLabel(entity) {
  return (
    entity?.labels?.en?.value ??
    entity?.labels?.['en-gb']?.value ??
    entity?.labels?.mul?.value ??
    entity?.labels?.de?.value ??
    entity?.labels?.es?.value ??
    entity?.labels?.fr?.value ??
    ''
  );
}

async function fetchWikidataLeagues(entityIds) {
  const leagueIdsByEntityId = new Map();
  const leagueLabelsById = new Map();

  for (const batch of chunks([...new Set(entityIds.filter(Boolean))], 20)) {
    const url = new URL('https://www.wikidata.org/w/api.php');
    url.search = new URLSearchParams({
      action: 'wbgetentities',
      format: 'json',
      origin: '*',
      ids: batch.join('|'),
      props: 'claims',
    });
    let json;
    try {
      json = await fetchJson(url);
    } catch {
      await sleep(2500);
      json = { entities: {} };
      for (const entityId of batch) {
        const singleUrl = new URL('https://www.wikidata.org/w/api.php');
        singleUrl.search = new URLSearchParams({
          action: 'wbgetentities',
          format: 'json',
          origin: '*',
          ids: entityId,
          props: 'claims',
        });

        try {
          const singleJson = await fetchJson(singleUrl);
          Object.assign(json.entities, singleJson.entities ?? {});
        } catch {
          // Keep the generator moving if a single Wikidata entity is temporarily unavailable.
        }
        await sleep(700);
      }
    }
    await sleep(900);

    for (const [entityId, entity] of Object.entries(json.entities ?? {})) {
      const leagueIds = (entity.claims?.P118 ?? [])
        .map((claim) => claim.mainsnak?.datavalue?.value?.id)
        .filter(Boolean);
      if (leagueIds.length) leagueIdsByEntityId.set(entityId, leagueIds);
    }
  }

  const leagueIds = [...new Set([...leagueIdsByEntityId.values()].flat())];
  for (const batch of chunks(leagueIds, 15)) {
    const url = new URL('https://www.wikidata.org/w/api.php');
    url.search = new URLSearchParams({
      action: 'wbgetentities',
      format: 'json',
      origin: '*',
      ids: batch.join('|'),
      props: 'labels',
      languages: 'en|en-gb|mul|de|es|fr',
    });
    let json;
    try {
      json = await fetchJson(url);
    } catch {
      await sleep(2500);
      json = { entities: {} };
      for (const leagueId of batch) {
        const singleUrl = new URL('https://www.wikidata.org/w/api.php');
        singleUrl.search = new URLSearchParams({
          action: 'wbgetentities',
          format: 'json',
          origin: '*',
          ids: leagueId,
          props: 'labels',
          languages: 'en|en-gb|mul|de|es|fr',
        });

        try {
          const singleJson = await fetchJson(singleUrl);
          Object.assign(json.entities, singleJson.entities ?? {});
        } catch {
          // League names are additive metadata, so leave only the failed one blank.
        }
        await sleep(700);
      }
    }
    await sleep(900);

    for (const [leagueId, entity] of Object.entries(json.entities ?? {})) {
      const label = bestLabel(entity);
      if (label) leagueLabelsById.set(leagueId, label);
    }
  }

  const leagueByEntityId = new Map();
  for (const [entityId, leagueIdsForEntity] of leagueIdsByEntityId.entries()) {
    const labels = leagueIdsForEntity.map((id) => leagueLabelsById.get(id)).filter(Boolean);
    const preferred =
      labels.find((label) => !/\b(cup|champions|libertadores|sudamericana)\b/i.test(label)) ??
      labels[0] ??
      '';
    if (preferred) leagueByEntityId.set(entityId, preferred);
  }

  return leagueByEntityId;
}

async function attachClubLeagues(teams) {
  const players = teams.flatMap((team) => team.players);
  const missingClubPages = [
    ...new Set(players.filter((player) => !player.clubLeague).map((player) => player.clubPage).filter(Boolean)),
  ];

  if (!missingClubPages.length) {
    return new Set(players.map((player) => player.clubLeague).filter(Boolean)).size;
  }

  const idsByClubPage = await fetchClubWikidataIds(missingClubPages);
  const leagueByEntityId = await fetchWikidataLeagues([...idsByClubPage.values()]);

  for (const player of players) {
    if (player.clubLeague) continue;
    const entityId = idsByClubPage.get(player.clubPage);
    player.clubLeague = leagueByEntityId.get(entityId) ?? '';
  }

  const stillMissingClubPages = [
    ...new Set(players.filter((player) => !player.clubLeague).map((player) => player.clubPage).filter(Boolean)),
  ];
  if (stillMissingClubPages.length) {
    const pageRows = await fetchClubPages(stillMissingClubPages);
    const leagueByClubPage = new Map();

    for (const row of pageRows) {
      if (!row.league) continue;
      leagueByClubPage.set(row.requestedTitle, row.league);
      leagueByClubPage.set(row.title, row.league);
    }

    for (const player of players) {
      if (player.clubLeague) continue;
      player.clubLeague = leagueByClubPage.get(player.clubPage) ?? '';
    }
  }

  return new Set(players.map((player) => player.clubLeague).filter(Boolean)).size;
}

function normalizeRatingText(value = '') {
  return normalizeName(value).replace(/\bjr\b/g, 'junior').replace(/\s+/g, ' ').trim();
}

function comparableClubName(value = '') {
  return normalizeRatingText(value)
    .replace(/\b(fc|cf|sc|afc|ac|cd|club|the|de|del|sad|sk|fk|bk|nk|sv|tsg|rc|rsc)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function comparableClubTokens(value = '') {
  return comparableClubName(value)
    .split(/\s+/)
    .filter((token) => token.length > 3);
}

function eaFcDisplayName(row) {
  return [row.commonName, row.firstName, row.lastName].filter(Boolean).join(' ').trim();
}

function eaFcNameVariants(row) {
  const first = row.firstName ?? '';
  const last = row.lastName ?? '';
  const common = row.commonName ?? '';

  return [
    common,
    `${first} ${last}`,
    `${last} ${first}`,
    common && `${common} ${last}`,
    common && `${first} ${common}`,
  ]
    .filter(Boolean)
    .map(normalizeRatingText)
    .filter(Boolean);
}

function playerNameVariants(player) {
  const base = player.name.replace(/\s+\([^)]*\)\s*$/, '');
  const words = base.split(/\s+/);
  const reversed = words.length > 1 ? `${words[words.length - 1]} ${words.slice(0, -1).join(' ')}` : '';

  return [...new Set([base, reversed].filter(Boolean).map(normalizeRatingText).filter(Boolean))];
}

function significantNameTokens(value = '') {
  const ignored = new Set(['bin', 'da', 'de', 'del', 'der', 'di', 'dos', 'el', 'ibn', 'jr', 'junior', 'la', 'van']);
  return normalizeRatingText(value)
    .split(/\s+/)
    .filter((token) => token.length > 1 && !ignored.has(token));
}

function eaFcNationalityKeys(teamName) {
  return [...new Set([teamName, ...(EA_FC_NATIONALITY_ALIASES[teamName] ?? [])].map(normalizeRatingText))];
}

function eaFcPositionType(position) {
  if (position === 'GK') return 'goalkeeper';
  if (position === 'DF') return 'defender';
  if (position === 'MF') return 'midfielder';
  if (position === 'FW') return 'forward';
  return '';
}

function eaFcNameQuality(player, row) {
  const playerTokens = significantNameTokens(player.name);
  const rowVariants = eaFcNameVariants(row);
  const rowTokenSet = new Set(rowVariants.flatMap(significantNameTokens));

  if (playerTokens.length === 1) {
    const [token] = playerTokens;
    if (token.length < 5) return 0;
    return rowVariants.some((variant) => variant === token || variant.startsWith(`${token} `)) ? 55 : 0;
  }

  const matchedTokens = playerTokens.filter((token) => rowTokenSet.has(token));
  if (matchedTokens.length < 2) return 0;

  return 25 + matchedTokens.length * 10 + Math.round((matchedTokens.length / playerTokens.length) * 20);
}

function scoreEaFcCandidate(player, team, row, nameQuality) {
  let score = nameQuality;
  const nationality = normalizeRatingText(row.nationality?.label ?? '');

  if (eaFcNationalityKeys(team.name).includes(nationality)) score += 35;

  const playerClub = comparableClubName(player.club);
  const eaClub = comparableClubName(row.team?.label ?? '');
  if (playerClub && eaClub && (playerClub === eaClub || playerClub.includes(eaClub) || eaClub.includes(playerClub))) {
    score += 10;
  } else {
    const eaClubTokens = new Set(comparableClubTokens(row.team?.label ?? ''));
    if (comparableClubTokens(player.club).some((token) => eaClubTokens.has(token))) score += 6;
  }

  if (eaFcPositionType(player.position) === row.position?.positionType?.id) score += 3;

  return score;
}

function buildEaFcIndex(rows) {
  const mensRows = rows.filter((row) => row.gender?.id === 0);
  const byName = new Map();
  const byNationality = new Map();

  for (const row of mensRows) {
    for (const variant of eaFcNameVariants(row)) {
      const rowsForName = byName.get(variant) ?? [];
      rowsForName.push(row);
      byName.set(variant, rowsForName);
    }

    const nationality = normalizeRatingText(row.nationality?.label ?? '');
    if (nationality) {
      const rowsForNationality = byNationality.get(nationality) ?? [];
      rowsForNationality.push(row);
      byNationality.set(nationality, rowsForNationality);
    }
  }

  return { byName, byNationality, rows: mensRows };
}

function matchEaFcRating(player, team, index) {
  const candidateMap = new Map();

  for (const variant of playerNameVariants(player)) {
    for (const row of index.byName.get(variant) ?? []) {
      candidateMap.set(row.id, { row, nameQuality: 55 });
    }
  }

  for (const nationality of eaFcNationalityKeys(team.name)) {
    for (const row of index.byNationality.get(nationality) ?? []) {
      const nameQuality = eaFcNameQuality(player, row);
      if (!nameQuality) continue;

      const existing = candidateMap.get(row.id);
      if (!existing || nameQuality > existing.nameQuality) {
        candidateMap.set(row.id, { row, nameQuality });
      }
    }
  }

  const candidates = [...candidateMap.values()]
    .map(({ row, nameQuality }) => ({
      row,
      score: scoreEaFcCandidate(player, team, row, nameQuality),
    }))
    .sort((a, b) => b.score - a.score || b.row.overallRating - a.row.overallRating || a.row.rank - b.row.rank);

  const best = candidates[0];
  const second = candidates[1];
  if (!best || best.score < 85) return null;
  if (second && second.score >= best.score - 2 && second.row.id !== best.row.id) return null;

  return best.row;
}

async function fetchEaFcRatingsJson(url) {
  let response;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        Referer: EA_FC_RATINGS_PAGE,
        'User-Agent':
          'WorldCupLineupsLocalPrototype/0.1 (local generated data; contact: none)',
      },
    });

    if (response.status !== 429) break;
    const retryAfter = Number(response.headers.get('retry-after'));
    await sleep(Math.min(Number.isFinite(retryAfter) ? retryAfter * 1000 : 1800 * (attempt + 1), 8000));
  }

  if (!response?.ok) {
    throw new Error(`Could not fetch ${url}: ${response?.status} ${response?.statusText}`);
  }

  return response.json();
}

async function fetchLegacyEaFcRatings() {
  const rows = [];
  let totalItems = Infinity;

  for (let offset = 0; offset < totalItems; offset += EA_FC_PAGE_SIZE) {
    const url = new URL(EA_FC_LEGACY_RATINGS_API);
    url.search = new URLSearchParams({
      locale: 'en',
      limit: String(EA_FC_PAGE_SIZE),
      offset: String(offset),
    });

    let response;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          Origin: 'https://www.ea.com',
          Referer: EA_FC_RATINGS_PAGE,
          'User-Agent':
            'WorldCupLineupsLocalPrototype/0.1 (local generated data; contact: none)',
        },
      });

      if (response.status !== 429) break;
      const retryAfter = Number(response.headers.get('retry-after'));
      await sleep(Math.min(Number.isFinite(retryAfter) ? retryAfter * 1000 : 1800 * (attempt + 1), 8000));
    }

    if (!response?.ok) {
      throw new Error(`Could not fetch ${url}: ${response?.status} ${response?.statusText}`);
    }

    const json = await response.json();
    if (!Array.isArray(json.items)) break;

    rows.push(...json.items);
    totalItems = json.totalItems ?? rows.length;
    await sleep(80);
  }

  return rows;
}

function eaFcNextDataPageUrl(buildId, page) {
  const url = new URL(`${EA_FC_RATINGS_NEXT_DATA}/${buildId}/en/games/ea-sports-fc/ratings.json`);
  if (page > 1) url.searchParams.set('page', String(page));
  return url;
}

function ratingDetailsFromNextData(json) {
  const details = json?.props?.pageProps?.ratingDetails ?? json?.pageProps?.ratingDetails;
  if (!Array.isArray(details?.items)) {
    throw new Error('EA FC ratings response did not include ratingDetails.items');
  }
  return details;
}

async function fetchEaFcRatings() {
  const pageHtml = await fetchText(EA_FC_RATINGS_PAGE);
  const nextDataMatch = pageHtml.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
  );

  if (!nextDataMatch) {
    throw new Error('Could not find EA FC ratings Next.js data payload');
  }

  const nextData = JSON.parse(nextDataMatch[1]);
  const buildId = nextData.buildId;
  if (!buildId) {
    throw new Error('Could not find EA FC ratings Next.js build id');
  }

  const firstPageDetails = ratingDetailsFromNextData(nextData);
  const rows = [...firstPageDetails.items];
  const totalItems = firstPageDetails.totalItems ?? rows.length;
  const totalPages = Math.ceil(totalItems / EA_FC_PAGE_SIZE);

  for (let page = 2; page <= totalPages; page += 1) {
    const json = await fetchEaFcRatingsJson(eaFcNextDataPageUrl(buildId, page));
    rows.push(...ratingDetailsFromNextData(json).items);
    await sleep(80);
  }

  return rows;
}

function futGgPlayerUrl(row) {
  return `${FUT_GG_PLAYERS_URL}/${row.id}-${slugify(eaFcDisplayName(row))}/`;
}

function parseFutGgCommonRating(html, row) {
  const exactBaseCardPattern = new RegExp(
    `slug:"${FUT_GG_GAME}-${row.id}"[\\s\\S]{0,3000}?overall:(\\d+)[\\s\\S]{0,14000}?rarityName:"Common"`,
  );
  const exactBaseCardMatch = html.match(exactBaseCardPattern);
  if (exactBaseCardMatch) return Number(exactBaseCardMatch[1]);

  const currentCommonPattern = new RegExp(
    `game:"${FUT_GG_GAME}"[\\s\\S]{0,3000}?eaId:${row.id}[\\s\\S]{0,3000}?basePlayerEaId:${row.id}[\\s\\S]{0,3000}?overall:(\\d+)[\\s\\S]{0,14000}?rarityName:"Common"`,
  );
  const currentCommonMatch = html.match(currentCommonPattern);
  return currentCommonMatch ? Number(currentCommonMatch[1]) : null;
}

async function fetchFutGgCommonRating(row) {
  const url = futGgPlayerUrl(row);

  try {
    const html = await fetchText(url);
    const rating = parseFutGgCommonRating(html, row);
    return Number.isFinite(rating) ? { rating, url } : null;
  } catch {
    return null;
  }
}

async function attachEaFcRatings(teams) {
  const rows = await fetchEaFcRatings();
  const index = buildEaFcIndex(rows);
  const unmatched = [];
  let primaryMatched = 0;

  for (const team of teams) {
    for (const player of team.players) {
      const match = matchEaFcRating(player, team, index);
      player.eaFcRating = match?.overallRating ?? null;
      player.eaFcTeam = match?.team?.label ?? '';
      delete player.eaFcRatingSource;
      delete player.eaFcRatingUrl;

      if (match) {
        primaryMatched += 1;
      } else {
        unmatched.push({ player, team });
      }
    }
  }

  const legacyRows = await fetchLegacyEaFcRatings();
  const legacyIndex = buildEaFcIndex(legacyRows);
  const fallbackCandidates = unmatched
    .map(({ player, team }) => ({
      player,
      team,
      match: matchEaFcRating(player, team, legacyIndex),
    }))
    .filter(({ match }) => match);

  let futGgMatched = 0;
  const futGgRatingByEaId = new Map();

  for (const batch of chunks(fallbackCandidates, 8)) {
    await Promise.all(
      batch.map(async ({ player, match }) => {
        const cached = futGgRatingByEaId.get(match.id);
        const fallback = cached === undefined ? await fetchFutGgCommonRating(match) : cached;
        if (cached === undefined) futGgRatingByEaId.set(match.id, fallback);
        if (!fallback) return;

        player.eaFcRating = fallback.rating;
        player.eaFcTeam = player.club;
        player.eaFcRatingSource = 'FUT.GG EA FC 26 common card';
        player.eaFcRatingUrl = fallback.url;
        futGgMatched += 1;
      }),
    );
    await sleep(250);
  }

  let manualMatched = 0;
  for (const player of teams.flatMap((team) => team.players)) {
    const override = MANUAL_EA_FC_RATING_OVERRIDES[player.id];
    if (!override) continue;

    player.eaFcRating = override.rating;
    player.eaFcTeam = override.team;
    player.eaFcRatingSource = override.source;
    delete player.eaFcRatingUrl;
    manualMatched += 1;
  }

  return {
    matched: primaryMatched + futGgMatched + manualMatched,
    primaryMatched,
    futGgMatched,
    manualMatched,
    fallbackCandidates: fallbackCandidates.length,
    available: index.rows.length,
    legacyAvailable: legacyIndex.rows.length,
  };
}

async function fetchClubPages(clubPages) {
  const pageRows = [];

  for (const batch of chunks(clubPages, 40)) {
    const url = wikiApiUrl({
      action: 'query',
      prop: 'revisions|pageimages',
      redirects: '1',
      rvprop: 'content',
      rvslots: 'main',
      piprop: 'thumbnail',
      pithumbsize: '120',
      titles: batch.join('|'),
    });
    const json = await fetchJson(url);
    await sleep(350);
    const redirectMap = new Map();

    json.query?.normalized?.forEach((item) => redirectMap.set(item.from, item.to));
    json.query?.redirects?.forEach((item) => redirectMap.set(item.from, item.to));

    const pagesByTitle = new Map(
      Object.values(json.query?.pages ?? {}).map((page) => [page.title, page]),
    );

    for (const requestedTitle of batch) {
      const normalizedTitle = redirectMap.get(requestedTitle) ?? requestedTitle;
      const finalTitle = redirectMap.get(normalizedTitle) ?? normalizedTitle;
      const page = pagesByTitle.get(finalTitle) ?? pagesByTitle.get(normalizedTitle);
      if (!page || page.missing) continue;

      const raw = page.revisions?.[0]?.slots?.main?.['*'] ?? '';
      pageRows.push({
        requestedTitle,
        title: page.title,
        fileTitle: parseClubImageFile(raw),
        league: parseClubLeague(raw),
        thumbnail: page.thumbnail?.source ?? '',
      });
    }
  }

  return pageRows;
}

async function fetchImageInfo(fileTitles, width = '120') {
  const logosByFile = new Map();
  const uniqueFiles = [...new Set(fileTitles.filter(Boolean))];

  for (const batch of chunks(uniqueFiles, 40)) {
    const url = wikiApiUrl({
      action: 'query',
      prop: 'imageinfo',
      iiprop: 'url|mime',
      iiurlwidth: width,
      titles: batch.join('|'),
    });
    const json = await fetchJson(url);
    await sleep(350);

    Object.values(json.query?.pages ?? {}).forEach((page) => {
      const image = page.imageinfo?.[0];
      if (!image) return;

      const logo = {
        url: image.thumburl ?? image.url,
        sourceUrl: image.descriptionurl ?? '',
        mime: image.mime ?? '',
      };

      logosByFile.set(page.title, logo);
      logosByFile.set(normalizeFileTitle(page.title), logo);
    });
  }

  return logosByFile;
}

async function resolveKitImages(teams) {
  const kits = teams.map((team) => team.latestKit).filter(Boolean);
  const files = kits.flatMap((kit) => Object.values(kit.patterns ?? {}));
  const imagesByFile = await fetchImageInfo(files, '220');

  for (const kit of kits) {
    kit.images = Object.fromEntries(
      Object.entries(kit.patterns ?? {}).map(([part, fileTitle]) => {
        const image = imagesByFile.get(fileTitle) ?? imagesByFile.get(normalizeFileTitle(fileTitle));
        return [part, image?.url ?? ''];
      }),
    );
  }
}

async function attachClubLogos(teams) {
  const players = teams.flatMap((team) => team.players);
  const clubPages = [...new Set(players.map((player) => player.clubPage).filter(Boolean))];
  const pageRows = await fetchClubPages(clubPages);
  const imageInfoByFile = await fetchImageInfo(pageRows.map((row) => row.fileTitle));
  const logosByRequestedPage = new Map();

  for (const row of pageRows) {
    const imageInfo = imageInfoByFile.get(row.fileTitle) ?? imageInfoByFile.get(normalizeFileTitle(row.fileTitle));
    const logo = imageInfo
      ? {
          url: imageInfo.url,
          sourceUrl: imageInfo.sourceUrl,
          page: row.title,
        }
      : row.thumbnail
        ? {
            url: row.thumbnail,
            sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(row.title.replaceAll(' ', '_'))}`,
            page: row.title,
          }
        : null;

    if (logo?.url) {
      logosByRequestedPage.set(row.requestedTitle, logo);
      logosByRequestedPage.set(row.title, logo);
    }
  }

  for (const player of players) {
    const logo = logosByRequestedPage.get(player.clubPage);
    player.clubLogo = logo?.url ?? '';
    player.clubLogoSource = logo?.sourceUrl ?? '';
  }

  return logosByRequestedPage.size;
}

function parseDate(section) {
  const match = section.match(/\|date=\{\{Start date\|(\d{4})\|(\d{1,2})\|(\d{1,2})\}\}/);
  if (!match) return '';
  const [, year, month, day] = match;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function parseScore(section) {
  const match = section.match(/\|score=\{\{score link\|[^|]+?\|([^}]+)\}\}/);
  return match ? cleanWikiText(match[1]) : '';
}

function parseTeamCode(section, side) {
  const match = section.match(
    new RegExp(`\\|${side}=\\{\\{#invoke:flag\\|fb(?:-rt)?\\|([^}|]+)`),
  );
  return match?.[1]?.trim() ?? '';
}

function parseStarters(tableText) {
  const starters = [];
  const starterRows = tableText.split(/\|colspan=3\|'''Substitutions:'''/)[0];
  const rowPattern = /^\|([A-Z]{1,3})\s*\|\|'''(\d+)'''\s*\|\|(.+)$/gm;
  let match;

  while ((match = rowPattern.exec(starterRows))) {
    const [, role, number, cell] = match;
    const nameCell = cell.split('||')[0];
    starters.push({
      role,
      number: Number(number),
      name: cleanWikiText(nameCell).replace(/\s+\([^)]*\)\s*$/, ''),
      captain: cell.includes('Captain (association football)'),
    });
  }

  return starters;
}

function normalizeLineupRoles(starters) {
  const centerBacks = starters.filter((player) => player.role === 'CB').length;
  if (centerBacks < 3) return starters;

  return starters.map((player) => {
    if (!['DF', 'MF'].includes(player.squadPosition)) return player;
    if (player.role === 'RM') return { ...player, role: 'RWB' };
    if (player.role === 'LM') return { ...player, role: 'LWB' };
    return player;
  });
}

function parseLineupsFromGroup(raw, letter) {
  const headings = [...raw.matchAll(/^===([^=]+)===$/gm)].map((match) => ({
    title: cleanWikiText(match[1]),
    index: match.index,
  }));
  const lineups = [];

  headings.forEach((heading, index) => {
    if (!heading.title.includes(' vs ')) return;

    const nextHeading = headings[index + 1]?.index ?? raw.length;
    const section = raw.slice(heading.index, nextHeading);
    const team1Code = parseTeamCode(section, 'team1');
    const team2Code = parseTeamCode(section, 'team2');
    const team1 = TEAM_ALIASES[CODE_TO_TEAM[team1Code]] ?? CODE_TO_TEAM[team1Code];
    const team2 = TEAM_ALIASES[CODE_TO_TEAM[team2Code]] ?? CODE_TO_TEAM[team2Code];
    const tableSegments = [
      ...section.matchAll(/\{\|\s*style="font-size:90%[\s\S]*?\|colspan=3\|'''Substitutions:'''/g),
    ].map((match) => match[0]);

    if (!team1 || !team2 || tableSegments.length < 2) return;

    const date = parseDate(section);
    const score = parseScore(section);
    const base = {
      group: letter,
      date,
      score,
      match: `${team1} vs ${team2}`,
      sourceUrl: `https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_${letter}#${heading.title.replaceAll(' ', '_')}`,
    };

    lineups.push({
      ...base,
      team: team1,
      opponent: team2,
      starters: parseStarters(tableSegments[0]),
    });

    lineups.push({
      ...base,
      team: team2,
      opponent: team1,
      starters: parseStarters(tableSegments[1]),
    });
  });

  return lineups.filter((lineup) => lineup.starters.length === 11);
}

function attachLineups(teams, lineups) {
  const teamsByName = new Map(teams.map((team) => [team.name, team]));

  for (const lineup of lineups) {
    const teamName = TEAM_ALIASES[lineup.team] ?? lineup.team;
    const team = teamsByName.get(teamName);
    if (!team) continue;

    const enrichedStarters = normalizeLineupRoles(lineup.starters.map((starter) => {
      const normalizedStarter = normalizeName(starter.name);
      const player =
        team.players.find((candidate) => candidate.number === starter.number) ??
        team.players.find((candidate) => normalizeName(candidate.name) === normalizedStarter);

      return {
        ...starter,
        playerId: player?.id ?? '',
        name: player?.name ?? starter.name,
        page: player?.page ?? '',
        club: player?.club ?? '',
        clubLogo: player?.clubLogo ?? '',
        photo: player?.photo ?? '',
        squadPosition: player?.position ?? '',
      };
    }));

    const nextLineup = { ...lineup, starters: enrichedStarters };
    if (!team.latestLineup || nextLineup.date >= team.latestLineup.date) {
      team.latestLineup = nextLineup;
    }
  }
}

function topClubs(teams) {
  const clubCounts = new Map();
  teams.flatMap((team) => team.players).forEach((player) => {
    const current = clubCounts.get(player.club) ?? {
      club: player.club,
      count: 0,
      logo: player.clubLogo,
      sourceUrl: player.clubLogoSource,
    };
    current.count += 1;
    current.logo = current.logo || player.clubLogo;
    current.sourceUrl = current.sourceUrl || player.clubLogoSource;
    clubCounts.set(player.club, current);
  });

  return [...clubCounts.values()]
    .sort((a, b) => b.count - a.count || a.club.localeCompare(b.club))
    .slice(0, 12);
}

function buildTotals(teams) {
  const players = teams.flatMap((team) => team.players);
  const clubs = new Set(players.map((player) => player.club));
  const lineups = teams.filter((team) => team.latestLineup).length;

  return {
    teams: teams.length,
    players: players.length,
    clubs: clubs.size,
    lineups,
    ratedPlayers: players.filter((player) => player.eaFcRating).length,
  };
}

async function main() {
  const existingData = await loadExistingData();
  const squadsRaw = await fetchText(SQUADS_URL);
  const teams = parseSquads(squadsRaw);
  const cached = applyCachedImages(teams, existingData);
  let logoCount = cached.clubLogoAliases;
  if (logoCount === 0) {
    logoCount = await attachClubLogos(teams);
  }
  console.log(`Attached ${logoCount} club logo aliases.`);
  const leagueCount = await attachClubLeagues(teams);
  console.log(`Attached ${leagueCount} club leagues.`);
  const eaFcRatings = await attachEaFcRatings(teams);
  console.log(
    `Attached ${eaFcRatings.matched} EA FC ratings (${eaFcRatings.primaryMatched} official EA, ${eaFcRatings.futGgMatched} FUT.GG fallbacks, ${eaFcRatings.manualMatched} manual overrides) from ${eaFcRatings.available} current EA items and ${eaFcRatings.legacyAvailable} legacy EA items.`,
  );
  const photoCount = teams.flatMap((team) => team.players).filter((player) => player.photo).length;
  console.log(`Attached ${photoCount} cached player photos.`);
  const groupLetters = 'ABCDEFGHIJKL'.split('');
  const lineupGroups = await Promise.all(
    groupLetters.map(async (letter) => parseLineupsFromGroup(await fetchText(GROUP_PAGE(letter)), letter)),
  );

  attachLineups(teams, lineupGroups.flat());

  const knockoutData = await writeKnockoutData();

  teams.sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name));

  const data = {
    generatedAt: new Date().toISOString(),
    tournament: 'FIFA World Cup 2026',
    source: {
      squads: 'https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_squads',
      groups: 'https://en.wikipedia.org/wiki/2026_FIFA_World_Cup',
      eaFcRatings: EA_FC_RATINGS_PAGE,
      eaFcFallbackRatings: FUT_GG_PLAYERS_URL,
      note:
        'Squads and clubs are parsed from the Wikipedia squad page, which cites the FIFA squad list. Club logos are fetched from Wikipedia page image metadata, club leagues are fetched from Wikidata league metadata with club infobox fallbacks, and EA FC ratings are matched from the official EA Sports FC 26 ratings table with FUT.GG EA FC 26 common-card fallbacks for players omitted from the official table. Player photos are loaded from Wikipedia page summaries in the app.',
    },
    totals: buildTotals(teams),
    topClubs: topClubs(teams),
    teams,
  };

  const outDir = path.join(rootDir, 'src', 'data');
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, 'worldcup-2026.json'), `${JSON.stringify(data, null, 2)}\n`);

  console.log(
    `Generated ${data.totals.teams} teams, ${data.totals.players} players, ${data.totals.lineups} latest lineups, ${logoCount} logo aliases, ${leagueCount} leagues, ${eaFcRatings.matched} EA FC ratings, ${photoCount} player photos.`,
  );
  console.log(`Updated bracket data for ${knockoutData.rounds?.length ?? 0} rounds.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
