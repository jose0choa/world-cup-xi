import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import {
  GitBranch,
  Goal,
  RotateCcw,
  Search,
  Share2,
  Shield,
  Sparkles,
  SquareStack,
  Trophy,
  Users,
} from 'lucide-react';
import worldCupData from './data/worldcup-2026.json';
import { knockoutData } from './data/knockout-2026';
import './styles.css';

const FORMATIONS = {
  '4-3-3': ['GK', 'LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'AM', 'LF', 'CF', 'RF'],
  '4-2-3-1': ['GK', 'LB', 'CB', 'CB', 'RB', 'DM', 'DM', 'LM', 'AM', 'RM', 'CF'],
  '3-5-2': ['GK', 'CB', 'CB', 'CB', 'LWB', 'CM', 'CM', 'AM', 'RWB', 'CF', 'CF'],
  '4-4-2': ['GK', 'LB', 'CB', 'CB', 'RB', 'LM', 'CM', 'CM', 'RM', 'CF', 'CF'],
};

const roleDepth = {
  GK: 91,
  LB: 72,
  RB: 72,
  CB: 76,
  LWB: 63,
  RWB: 63,
  SW: 80,
  DF: 74,
  DM: 59,
  CM: 49,
  AM: 38,
  LM: 44,
  RM: 44,
  MF: 49,
  LW: 28,
  RW: 28,
  LF: 23,
  RF: 23,
  CF: 16,
  ST: 16,
  FW: 19,
};

const roleX = {
  GK: 50,
  LB: 18,
  RB: 82,
  LWB: 12,
  RWB: 88,
  LM: 18,
  RM: 82,
  LW: 20,
  RW: 80,
  LF: 30,
  RF: 70,
  CF: 50,
  ST: 50,
};

const wideRoleX = new Set(['LB', 'RB', 'LWB', 'RWB', 'LM', 'RM', 'LW', 'RW', 'LF', 'RF']);

const lineY = {
  keeper: 90,
  defense: 76,
  wingback: 60,
  midfield: 44,
  attackingMidfield: 32,
  attack: 18,
};

const roleOrder = {
  LB: 0,
  LWB: 0,
  LM: 0,
  LW: 0,
  LF: 0,
  SW: 1,
  CB: 2,
  DF: 2,
  DM: 2,
  CM: 2,
  MF: 2,
  AM: 2,
  CF: 2,
  ST: 2,
  FW: 2,
  RB: 4,
  RWB: 4,
  RM: 4,
  RW: 4,
  RF: 4,
};

const TEAM_RATING_TARGET = 16;
const TEAM_RATING_MINIMUM = 8;
const RATING_SPLITS = [
  { label: 'ATT', positions: ['FW'], target: 4, minimum: 2 },
  { label: 'MID', positions: ['MF'], target: 5, minimum: 2 },
  { label: 'DEF', positions: ['GK', 'DF'], target: 7, minimum: 4 },
];

const FIFA_MENS_RANKING_URL = 'https://inside.fifa.com/fifa-world-ranking/men';
// Used only to order teams that cannot get a computed rating rank.
const FIFA_FALLBACK_RANKS = {
  IRN: 20,
  EGY: 29,
  UZB: 50,
  QAT: 56,
  RSA: 60,
  JOR: 63,
  CUW: 82,
};

const SEO_BY_PATH = {
  '/': {
    title: 'World Cup Lineups | 2026 Squads, Starting XIs and Ratings',
    description:
      'Explore 2026 World Cup squads, starting lineups, player clubs, club leagues, EA Sports FC ratings, and computed team rankings.',
  },
  '/about': {
    title: 'About | World Cup Lineups',
    description:
      'Learn how World Cup Lineups compares international squads, tactical XIs, player clubs, ratings, and computed team strength.',
  },
  '/bracket': {
    title: 'World Cup 2026 Knockout Bracket | World Cup Lineups',
    description:
      'Track the 2026 World Cup knockout bracket, remaining teams, round-of-32 results, round-of-16 fixtures, and route to the final.',
  },
  '/sources': {
    title: 'Sources | World Cup Lineups',
    description:
      'Review the squad, lineup, player rating, image, and computed ranking sources used by World Cup Lineups.',
  },
  '/privacy': {
    title: 'Privacy | World Cup Lineups',
    description:
      'Read the privacy notice for World Cup Lineups, including Vercel Analytics, hosting logs, and third-party data sources.',
  },
};

const STATIC_PATHS = new Set(['/about', '/bracket', '/sources', '/privacy']);
const TEAM_BY_SLUG = new Map(worldCupData.teams.map((team) => [teamSlug(team), team]));
const TEAM_BY_CODE = new Map(worldCupData.teams.map((team) => [team.code, team]));
const KNOCKOUT_MATCH_BY_ID = new Map(
  knockoutData.rounds.flatMap((round) => round.matches.map((match) => [match.id, match])),
);
const BRACKET_SIDES = [
  {
    id: 'left',
    lanes: [
      { label: 'Round of 32', matchIds: ['M73', 'M75', 'M74', 'M77', 'M83', 'M84', 'M81', 'M82'] },
      { label: 'Round of 16', matchIds: ['M89', 'M90', 'M93', 'M94'] },
      { label: 'Quarterfinals', matchIds: ['M97', 'M98'] },
      { label: 'Semifinal', matchIds: ['M101'] },
    ],
  },
  {
    id: 'right',
    lanes: [
      { label: 'Semifinal', matchIds: ['M102'] },
      { label: 'Quarterfinals', matchIds: ['M99', 'M100'] },
      { label: 'Round of 16', matchIds: ['M91', 'M92', 'M95', 'M96'] },
      { label: 'Round of 32', matchIds: ['M76', 'M78', 'M79', 'M80', 'M86', 'M85', 'M88', 'M87'] },
    ],
  },
];
const BRACKET_SLOT_STARTS = {
  8: [1, 3, 5, 7, 9, 11, 13, 15],
  4: [2, 6, 10, 14],
  2: [4, 12],
  1: [8],
};
const BRACKET_FEEDERS = {
  M89: ['W73', 'W75'],
  M90: ['W74', 'W77'],
  M91: ['W76', 'W78'],
  M92: ['W79', 'W80'],
  M93: ['W83', 'W84'],
  M94: ['W81', 'W82'],
  M95: ['W86', 'W85'],
  M96: ['W88', 'W87'],
  M97: ['W89', 'W90'],
  M98: ['W93', 'W94'],
  M99: ['W91', 'W92'],
  M100: ['W95', 'W96'],
  M101: ['W97', 'W98'],
  M102: ['W99', 'W100'],
  M104: ['W101', 'W102'],
  M103: ['L101', 'L102'],
};
const ACTUAL_KNOCKOUT_RESULT_COUNT = knockoutData.rounds.reduce(
  (count, round) => count + round.matches.filter((match) => match.winnerCode).length,
  0,
);
const BRACKET_SHARE_PARAM = 'picks';
const REMAINING_PREDICTION_MATCH_IDS = knockoutData.rounds.flatMap((round) =>
  round.matches.filter((match) => !match.winnerCode).map((match) => match.id),
);
const REMAINING_PREDICTION_MATCH_ID_SET = new Set(REMAINING_PREDICTION_MATCH_IDS);

function lineForRole(role) {
  if (role === 'GK') return 'keeper';
  if (['LB', 'RB', 'CB', 'DF', 'SW'].includes(role)) return 'defense';
  if (['LWB', 'RWB', 'DM'].includes(role)) return 'wingback';
  if (['AM'].includes(role)) return 'attackingMidfield';
  if (['CF', 'LF', 'RF', 'LW', 'RW', 'ST', 'FW'].includes(role)) return 'attack';
  return 'midfield';
}

function flagUrl(team) {
  return team.flag ? `https://flagcdn.com/${team.flag}.svg` : '';
}

function clubInitials(name = '') {
  const ignored = new Set(['fc', 'cf', 'sc', 'afc', 'ac', 'cd', 'club']);
  const words = name
    .replace(/[()]/g, ' ')
    .split(/\s+/)
    .filter((word) => word && !ignored.has(word.toLowerCase()));

  return (words[0]?.[0] ?? 'C').toUpperCase() + (words[1]?.[0] ?? '').toUpperCase();
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

function teamPath(team) {
  return `/teams/${teamSlug(team)}`;
}

function routeFromPathname(pathname = window.location.pathname) {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (STATIC_PATHS.has(path)) return { type: 'static', path };

  const teamMatch = path.match(/^\/teams\/([^/]+)$/);
  if (teamMatch) {
    let slug = teamMatch[1];
    try {
      slug = decodeURIComponent(slug);
    } catch {
      slug = '';
    }
    const team = TEAM_BY_SLUG.get(slug);
    if (team) return { type: 'team', path: teamPath(team), team };
  }

  return { type: 'home', path: '/' };
}

function seoForRoute(route) {
  if (route.type === 'team') {
    return {
      title: `${route.team.name} World Cup 2026 Squad, Lineup and Ratings | World Cup Lineups`,
      description: `View the ${route.team.name} 2026 World Cup squad, latest lineup, player clubs, club leagues, EA Sports FC ratings, caps, goals, and computed team rank.`,
    };
  }

  return SEO_BY_PATH[route.path] ?? SEO_BY_PATH['/'];
}

function isPlainLeftClick(event) {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.shiftKey
  );
}

function handleInternalNav(event, path, onNavigate) {
  if (!isPlainLeftClick(event)) return;
  event.preventDefault();
  onNavigate(path);
}

function ratedPlayers(players, positions) {
  return players
    .filter(
      (player) =>
        Number.isFinite(player.eaFcRating) && (!positions || positions.includes(player.position)),
    )
    .sort((a, b) => b.eaFcRating - a.eaFcRating || b.caps - a.caps || a.number - b.number);
}

function averageRatingScore(players) {
  if (!players.length) return null;
  return players.reduce((sum, player) => sum + player.eaFcRating, 0) / players.length;
}

function summarizeRatings(players, target, minimum) {
  const usedPlayers = players.slice(0, target);
  const score = usedPlayers.length >= minimum ? averageRatingScore(usedPlayers) : null;
  return {
    value: score === null ? null : Math.round(score),
    score,
    count: usedPlayers.length,
    target,
    status:
      usedPlayers.length >= target
        ? 'complete'
        : usedPlayers.length >= minimum
          ? 'partial'
          : 'insufficient',
  };
}

function teamRatingSummary(team) {
  const rankedPlayers = ratedPlayers(team.players);
  const overall = summarizeRatings(rankedPlayers, TEAM_RATING_TARGET, TEAM_RATING_MINIMUM);
  const splits = RATING_SPLITS.map((split) => ({
    ...split,
    ...summarizeRatings(ratedPlayers(team.players, split.positions), split.target, split.minimum),
  }));

  return { overall, splits };
}

function rankedTeamRatings(teams) {
  const summaries = teams.map((team) => ({
    team,
    summary: teamRatingSummary(team),
  }));
  const rankable = summaries
    .filter(({ summary }) => summary.overall.score !== null)
    .sort(
      (a, b) =>
        b.summary.overall.score - a.summary.overall.score ||
        a.team.name.localeCompare(b.team.name),
    );
  const fifaFallbackRankable = summaries
    .filter(
      ({ team, summary }) =>
        summary.overall.score === null && Number.isFinite(FIFA_FALLBACK_RANKS[team.code]),
    )
    .sort(
      (a, b) =>
        FIFA_FALLBACK_RANKS[a.team.code] - FIFA_FALLBACK_RANKS[b.team.code] ||
        a.team.name.localeCompare(b.team.name),
    );
  const computedRankedCount = rankable.length;
  const rankedCount = computedRankedCount + fifaFallbackRankable.length;
  const ranksByTeam = new Map();
  rankable.forEach(({ team }, index) =>
    ranksByTeam.set(team.id, { rank: index + 1, source: 'computed' }),
  );
  fifaFallbackRankable.forEach(({ team }, index) =>
    ranksByTeam.set(team.id, {
      rank: computedRankedCount + index + 1,
      source: 'fifa-fallback',
    }),
  );

  return new Map(
    summaries.map(({ team, summary }) => {
      const rankMeta = ranksByTeam.get(team.id);

      return [
        team.id,
        {
          ...summary,
          rank: rankMeta?.rank ?? null,
          rankSource: rankMeta?.source ?? null,
          rankedCount,
        },
      ];
    }),
  );
}

function ClubMark({ logo, name, className = '' }) {
  return (
    <span className={`club-mark ${className}`} title={name}>
      <span className="club-fallback">{clubInitials(name)}</span>
      {logo ? (
        <img
          src={logo}
          alt=""
          loading="lazy"
          onError={(event) => {
            event.currentTarget.hidden = true;
          }}
        />
      ) : null}
    </span>
  );
}

function TeamRatingSummary({ rating }) {
  const coverageText = `${rating.overall.count}/${rating.overall.target} rated`;
  const coverageStatus =
    rating.overall.status === 'partial'
      ? 'partial'
      : rating.overall.status === 'insufficient'
        ? 'insufficient'
        : '';
  const usesFifaFallback = rating.rankSource === 'fifa-fallback';
  const rankStateClass = rating.rank ? (usesFifaFallback ? 'fallback' : 'rated') : 'empty';
  const rankTitle = rating.rank
    ? usesFifaFallback
      ? `Team rank #${rating.rank} of ${rating.rankedCount}, ordered after computed teams by FIFA men's ranking because fewer than ${TEAM_RATING_MINIMUM} players have ratings`
      : `Team rank #${rating.rank} of ${rating.rankedCount}, computed from the unrounded top-${rating.overall.target} average`
    : `Unranked because fewer than ${TEAM_RATING_MINIMUM} players have ratings and no FIFA fallback rank is available`;

  return (
    <div className="team-rating-panel" aria-label="Computed team ratings">
      <div
        className={`team-rank-card ${rankStateClass}`}
        title={rankTitle}
      >
        <span>Rank</span>
        <strong>{rating.rank ? `#${rating.rank}` : 'n/a'}</strong>
        {usesFifaFallback ? <small>FIFA</small> : null}
      </div>

      <div
        className={`team-rating-overall ${rating.overall.value ? 'rated' : 'empty'}`}
        title={`Top ${rating.overall.target} rated-player average: ${coverageText}${coverageStatus ? `, ${coverageStatus}` : ''}`}
      >
        <span>OVR</span>
        <strong>{rating.overall.value ?? 'n/a'}</strong>
        <small>
          {coverageText}
          {coverageStatus ? ` · ${coverageStatus}` : ''}
        </small>
      </div>

      <div className="team-rating-splits" aria-label="Attack midfield defense ratings">
        {rating.splits.map((split) => (
          <span
            key={split.label}
            className={`team-rating-split ${split.value ? 'rated' : 'empty'}`}
            title={`${split.label}: top ${split.target} average, ${split.count}/${split.target} rated${split.status !== 'complete' ? `, ${split.status}` : ''}`}
          >
            <b>{split.label}</b>
            <strong>{split.value ?? 'n/a'}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

function PlayerPhoto({ photo, name }) {
  return (
    <div className="player-photo">
      <span>{clubInitials(name)}</span>
      {photo ? (
        <img
          src={photo}
          alt=""
          loading="lazy"
          onError={(event) => {
            event.currentTarget.hidden = true;
          }}
        />
      ) : null}
    </div>
  );
}

function summaryUrl(page) {
  return `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page.replaceAll(' ', '_'))}`;
}

function updateMetaAttribute(attribute, key, content) {
  let meta = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, key);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

function usePageSeo(route) {
  useEffect(() => {
    const seo = seoForRoute(route);
    const canonicalUrl = `${window.location.origin}${route.path === '/' ? '/' : route.path}`;

    document.title = seo.title;
    updateMetaAttribute('name', 'description', seo.description);
    updateMetaAttribute('property', 'og:title', seo.title);
    updateMetaAttribute('property', 'og:description', seo.description);
    updateMetaAttribute('property', 'og:url', canonicalUrl);
    updateMetaAttribute('name', 'twitter:title', seo.title);
    updateMetaAttribute('name', 'twitter:description', seo.description);

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);
  }, [route]);
}

function spreadByIndex(index, total, center = 50, width = 42) {
  if (total <= 1) return center;
  const start = center - width / 2;
  return start + (width / (total - 1)) * index;
}

function coordinatesFor(starters) {
  const grouped = starters.reduce((groups, starter) => {
    const role = starter.role || starter.squadPosition || 'MF';
    const line = lineForRole(role);
    groups[line] = groups[line] ?? [];
    groups[line].push({ ...starter, role, line });
    return groups;
  }, {});

  const positioned = new Map();

  Object.entries(grouped).forEach(([line, linePlayers]) => {
    const sorted = [...linePlayers].sort(
      (a, b) => (roleOrder[a.role] ?? 2) - (roleOrder[b.role] ?? 2) || a.number - b.number,
    );
    const total = sorted.length;
    const width = total >= 5 ? 78 : total === 4 ? 68 : total === 3 ? 52 : 34;

    sorted.forEach((player, index) => {
      const fixedX = wideRoleX.has(player.role) || total === 1 ? roleX[player.role] : null;
      positioned.set(player.playerId || `${player.role}-${player.number}-${player.name}`, {
        ...player,
        x: fixedX ?? spreadByIndex(index, total, 50, width),
        y: lineY[line] ?? (roleDepth[player.role] ?? roleDepth.MF),
      });
    });
  });

  return starters.map((starter) =>
    positioned.get(starter.playerId || `${starter.role}-${starter.number}-${starter.name}`),
  );
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

function squadForAutoXi(players, formation) {
  const starters = [];
  const used = new Set();
  const slots = FORMATIONS[formation];

  const pickPlayer = (slot) => {
    const preferredPosition =
      slot === 'GK' ? 'GK' : ['LB', 'RB', 'CB', 'LWB', 'RWB', 'DF'].includes(slot) ? 'DF' : ['CF', 'LF', 'RF', 'LW', 'RW', 'ST'].includes(slot) ? 'FW' : 'MF';
    const backupOrder =
      preferredPosition === 'GK'
        ? ['GK']
        : preferredPosition === 'FW'
          ? ['FW', 'MF', 'DF']
          : preferredPosition === 'DF'
            ? ['DF', 'MF', 'FW']
            : ['MF', 'FW', 'DF'];
    const candidates = players
      .filter((player) => !used.has(player.id) && backupOrder.includes(player.position))
      .sort((a, b) => {
        const positionDelta = backupOrder.indexOf(a.position) - backupOrder.indexOf(b.position);
        if (positionDelta) return positionDelta;
        if (a.eaFcRating && b.eaFcRating && a.eaFcRating !== b.eaFcRating) {
          return b.eaFcRating - a.eaFcRating;
        }
        return b.caps - a.caps || b.goals - a.goals || a.number - b.number;
      });

    const player = candidates[0] ?? (slot === 'GK' ? null : players.find((candidate) => !used.has(candidate.id)));
    if (player) used.add(player.id);
    return player;
  };

  slots.forEach((role) => {
    const player = pickPlayer(role);
    if (!player) return;
    starters.push({
      role,
      number: player.number,
      name: player.name,
      page: player.page,
      club: player.club,
      clubLogo: player.clubLogo,
      squadPosition: player.position,
      captain: player.captain,
      playerId: player.id,
    });
  });

  return starters;
}

function inferFormation(starters) {
  const defenders = starters.filter((player) =>
    ['LB', 'RB', 'CB', 'DF', 'LWB', 'RWB', 'SW'].includes(player.role),
  ).length;
  const forwards = starters.filter((player) =>
    ['CF', 'LF', 'RF', 'LW', 'RW', 'ST', 'FW'].includes(player.role),
  ).length;
  const midfielders = Math.max(0, starters.length - 1 - defenders - forwards);
  return `${defenders}-${midfielders}-${forwards}`;
}

function groupTeams(teams) {
  return teams.reduce((groups, team) => {
    groups[team.group] = groups[team.group] ?? [];
    groups[team.group].push(team);
    return groups;
  }, {});
}

function comparePlayers(a, b) {
  const rank = { GK: 0, DF: 1, MF: 2, FW: 3 };
  return rank[a.position] - rank[b.position] || a.number - b.number;
}

function AppTopbar({ activeView, onNavigate }) {
  return (
    <section className="app-topbar">
      <a
        className="brand-lockup app-brand"
        href="/"
        onClick={(event) => handleInternalNav(event, '/', onNavigate)}
      >
        <div className="brand-mark">
          <Trophy size={22} strokeWidth={2.4} />
        </div>
        <div>
          <h1>World Cup Lineups</h1>
          <p>{worldCupData.tournament}</p>
        </div>
      </a>

      <nav className="view-switch" aria-label="Primary views">
        <a
          className={activeView === 'lineups' ? 'active' : ''}
          href="/"
          onClick={(event) => handleInternalNav(event, '/', onNavigate)}
        >
          <SquareStack size={16} />
          Lineups
        </a>
        <a
          className={activeView === 'bracket' ? 'active' : ''}
          href="/bracket"
          onClick={(event) => handleInternalNav(event, '/bracket', onNavigate)}
        >
          <GitBranch size={16} />
          Bracket
        </a>
      </nav>

      <div className="stat-strip" aria-label="Tournament totals">
        <Stat icon={<Shield size={17} />} value={worldCupData.totals.teams} label="Teams" />
        <Stat icon={<Users size={17} />} value={worldCupData.totals.players} label="Players" />
        <Stat icon={<SquareStack size={17} />} value={worldCupData.totals.clubs} label="Clubs" />
        <Stat icon={<Goal size={17} />} value={worldCupData.totals.lineups} label="XIs" />
      </div>
    </section>
  );
}

function LineupsPage({ routeTeam = null, onNavigate, onTeamSelect }) {
  const [query, setQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState('All');
  const [lineupMode, setLineupMode] = useState('latest');
  const [formation, setFormation] = useState('4-3-3');
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [photoCache, setPhotoCache] = useState({});

  const teamRatings = useMemo(() => rankedTeamRatings(worldCupData.teams), []);
  const selectedTeam = routeTeam ?? worldCupData.teams[0];
  const selectedTeamRating = teamRatings.get(selectedTeam.id) ?? teamRatingSummary(selectedTeam);
  const visibleTeams = useMemo(() => {
    const normalized = normalizeSearchText(query.trim());
    return worldCupData.teams.filter((team) => {
      const inGroup = groupFilter === 'All' || team.group === groupFilter;
      const matchesQuery =
        !normalized ||
        normalizeSearchText(team.name).includes(normalized) ||
        team.players.some(
          (player) =>
            normalizeSearchText(player.name).includes(normalized) ||
            normalizeSearchText(player.club).includes(normalized) ||
            normalizeSearchText(player.clubLeague).includes(normalized) ||
            normalizeSearchText(player.eaFcTeam).includes(normalized) ||
            String(player.eaFcRating ?? '').includes(normalized),
        );
      return inGroup && matchesQuery;
    });
  }, [groupFilter, query]);

  const groupedTeams = useMemo(() => groupTeams(visibleTeams), [visibleTeams]);
  const latestStarters = selectedTeam.latestLineup?.starters ?? [];
  const useLatest = lineupMode === 'latest' && latestStarters.length === 11;
  const lineupStarters = useLatest
    ? normalizeLineupRoles(latestStarters)
    : squadForAutoXi(selectedTeam.players, formation);
  const activeStarters = coordinatesFor(lineupStarters);
  const lineupPlayersById = new Map(activeStarters.map((player) => [player.playerId, player]));
  const selectedPlayer =
    selectedTeam.players.find((player) => player.id === selectedPlayerId) ??
    selectedTeam.players.find((player) => player.captain) ??
    selectedTeam.players[0];
  const selectedLineupPlayer = lineupPlayersById.get(selectedPlayer.id);
  const selectedPosition = selectedLineupPlayer?.role ?? selectedPlayer.position;
  const selectedPhoto = selectedPlayer.photo || photoCache[selectedPlayer.page]?.url || '';

  useEffect(() => {
    setSelectedPlayerId('');
  }, [selectedTeam.id]);

  useEffect(() => {
    if (!selectedPlayer.page || photoCache[selectedPlayer.page]) return;

    let cancelled = false;
    fetch(summaryUrl(selectedPlayer.page))
      .then((response) => (response.ok ? response.json() : null))
      .then((summary) => {
        if (cancelled) return;
        const url = summary?.thumbnail?.source ?? summary?.originalimage?.source ?? '';
        setPhotoCache((current) => ({
          ...current,
          [selectedPlayer.page]: {
            url,
            sourceUrl: summary?.content_urls?.desktop?.page ?? '',
          },
        }));
      })
      .catch(() => {
        if (cancelled) return;
        setPhotoCache((current) => ({ ...current, [selectedPlayer.page]: { url: '' } }));
      });

    return () => {
      cancelled = true;
    };
  }, [selectedPlayer.page, photoCache]);

  const clubsForTeam = useMemo(() => {
    const counts = new Map();
    selectedTeam.players.forEach((player) => {
      const current = counts.get(player.club) ?? {
        club: player.club,
        count: 0,
        logo: player.clubLogo,
      };
      current.count += 1;
      current.logo = current.logo || player.clubLogo;
      counts.set(player.club, current);
    });
    return [...counts.values()]
      .sort((a, b) => b.count - a.count || a.club.localeCompare(b.club))
      .slice(0, 6);
  }, [selectedTeam]);

  return (
    <main className="app-shell">
      <AppTopbar activeView="lineups" onNavigate={onNavigate} />

      <section className="workspace-grid">
        <aside className="team-sidebar" aria-label="Teams">
          <div className="search-control">
            <Search size={17} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search team, player, club, league, rating"
              aria-label="Search teams, players, clubs, leagues, or ratings"
            />
          </div>

          <div className="group-tabs" aria-label="Groups">
            {['All', ...'ABCDEFGHIJKL'.split('')].map((group) => (
              <button
                key={group}
                type="button"
                className={groupFilter === group ? 'active' : ''}
                onClick={() => setGroupFilter(group)}
              >
                {group}
              </button>
            ))}
          </div>

          <div className="teams-list">
            {Object.entries(groupedTeams).map(([group, teams]) => (
              <div key={group} className="group-block">
                <div className="group-heading">Group {group}</div>
                {teams.map((team) => {
                  const rating = teamRatings.get(team.id);
                  const rankSourceClass = rating?.rank
                    ? rating.rankSource === 'fifa-fallback'
                      ? 'fallback'
                      : 'rated'
                    : 'empty';
                  const rankTitle = rating?.rank
                    ? rating.rankSource === 'fifa-fallback'
                      ? `Rank #${rating.rank} · FIFA ranking fallback`
                      : `Rank #${rating.rank} · ${rating.overall.value} OVR`
                    : 'Unranked';

                  return (
                    <a
                      key={team.id}
                      href={teamPath(team)}
                      className={`team-row ${team.id === selectedTeam.id ? 'active' : ''}`}
                      onClick={(event) => {
                        if (!isPlainLeftClick(event)) return;
                        event.preventDefault();
                        onTeamSelect(team);
                      }}
                    >
                      <img src={flagUrl(team)} alt="" />
                      <span>{team.name}</span>
                      <span
                        className={`team-row-rank ${rankSourceClass}`}
                        title={rankTitle}
                      >
                        {rating?.rank ? `#${rating.rank}` : 'n/a'}
                      </span>
                      <strong>{team.code}</strong>
                    </a>
                  );
                })}
              </div>
            ))}
          </div>
        </aside>

        <section className="lineup-stage">
          <header className="team-header">
            <div className="team-title">
              <img src={flagUrl(selectedTeam)} alt="" />
              <div>
                <span>Group {selectedTeam.group}</span>
                <h2>{selectedTeam.name}</h2>
              </div>
            </div>

            <div className="team-header-aside">
              <TeamRatingSummary rating={selectedTeamRating} />
              <div className="team-meta">
                <span>Coach</span>
                <strong>{selectedTeam.coach}</strong>
              </div>
            </div>
          </header>

          <div className="lineup-toolbar">
            <div className="mode-switch" aria-label="Lineup source">
              <button
                type="button"
                className={lineupMode === 'latest' ? 'active' : ''}
                onClick={() => setLineupMode('latest')}
                disabled={!selectedTeam.latestLineup}
              >
                <Goal size={16} />
                Latest XI
              </button>
              <button
                type="button"
                className={lineupMode === 'auto' ? 'active' : ''}
                onClick={() => setLineupMode('auto')}
              >
                <Sparkles size={16} />
                Auto XI
              </button>
            </div>

            <select
              value={formation}
              onChange={(event) => {
                setFormation(event.target.value);
                setLineupMode('auto');
              }}
              aria-label="Formation"
            >
              {Object.keys(FORMATIONS).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="lineup-caption">
            <strong>{useLatest ? selectedTeam.latestLineup.match : `${selectedTeam.name} auto XI`}</strong>
            <span>
              {useLatest
                ? `${selectedTeam.latestLineup.date} · ${inferFormation(lineupStarters)} · ${selectedTeam.latestLineup.score}`
                : formation}
            </span>
          </div>

          <div className="pitch-panel" style={{ '--team-color': selectedTeam.primary }}>
            <div className="pitch-glow" />
            <div className="pitch-lines">
              <span className="halfway" />
              <span className="center-circle" />
              <span className="box box-top" />
              <span className="box box-bottom" />
            </div>

            {activeStarters.map((player) => (
              <button
                key={`${player.role}-${player.number}-${player.name}`}
                type="button"
                className="player-card"
                style={{ left: `${player.x}%`, top: `${player.y}%` }}
                onClick={() => setSelectedPlayerId(player.playerId)}
                aria-label={`${player.name}${player.captain ? ', captain' : ''}, number ${player.number}, ${player.role}, ${player.club}`}
                title={`${player.name}${player.captain ? ' (C)' : ''}, ${player.role}, ${player.club}`}
              >
                <span className="player-card-top">
                  <ClubMark logo={player.clubLogo} name={player.club} className="pitch-club-mark" />
                  <span className="player-number">
                    <span className="player-number-value">{player.number}</span>
                    <span className="player-role">{player.role}</span>
                  </span>
                </span>
                <span className="player-name">
                  <span className="player-name-text">{player.name}</span>
                  {player.captain ? (
                    <span className="captain-badge" title="Captain" aria-label="Captain">
                      C
                    </span>
                  ) : null}
                </span>
                <small>{player.club}</small>
              </button>
            ))}
          </div>
        </section>

        <aside className="detail-rail">
          <section className="detail-card selected-player">
            <span className="eyebrow">Player</span>
            <PlayerPhoto photo={selectedPhoto} name={selectedPlayer.name} />
            <h3>{selectedPlayer.name}</h3>
            <div className="selected-club">
              <ClubMark logo={selectedPlayer.clubLogo} name={selectedPlayer.club} />
              <span className="selected-club-copy">
                <span className="selected-club-name">{selectedPlayer.club}</span>
                {selectedPlayer.clubLeague ? <small>{selectedPlayer.clubLeague}</small> : null}
              </span>
            </div>
            <div className="player-line">
              <span
                className={`ea-rating-pill ${selectedPlayer.eaFcRating ? 'rated' : ''}`}
                title={
                  selectedPlayer.eaFcRating
                    ? `${selectedPlayer.eaFcRatingSource || 'EA Sports FC 26'}: ${selectedPlayer.eaFcRating} OVR${selectedPlayer.eaFcTeam ? `, ${selectedPlayer.eaFcTeam}` : ''}`
                    : 'EA Sports FC 26 rating unavailable'
                }
              >
                <small>EA FC</small>
                <b>{selectedPlayer.eaFcRating ?? 'n/a'}</b>
              </span>
              <strong>#{selectedPlayer.number}</strong>
              <span
                title={
                  selectedLineupPlayer
                    ? `Lineup role: ${selectedPosition}`
                    : `Squad position: ${selectedPlayer.position}`
                }
              >
                {selectedPosition}
              </span>
              <span>{selectedPlayer.age ? `${selectedPlayer.age} yrs` : 'Age n/a'}</span>
            </div>
            <dl>
              <div>
                <dt>Club FA</dt>
                <dd>{selectedPlayer.clubCountry || 'n/a'}</dd>
              </div>
              <div>
                <dt>Caps</dt>
                <dd>{selectedPlayer.caps}</dd>
              </div>
              <div>
                <dt>Goals</dt>
                <dd>{selectedPlayer.goals}</dd>
              </div>
            </dl>
          </section>

          <section className="detail-card">
            <span className="eyebrow">Club Mix</span>
            <div className="club-list">
              {clubsForTeam.map((club) => (
                <div key={club.club} className="club-row">
                  <ClubMark logo={club.logo} name={club.club} />
                  <span className="club-name">{club.club}</span>
                  <strong>{club.count}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="detail-card compact">
            <span className="eyebrow">Tournament Clubs</span>
            <div className="mini-cloud">
              {worldCupData.topClubs.slice(0, 8).map((club) => (
                <span key={club.club} className="mini-club-pill">
                  <ClubMark logo={club.logo} name={club.club} />
                  {club.club} <b>{club.count}</b>
                </span>
              ))}
            </div>
          </section>
        </aside>
      </section>

      <section className="roster-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Squad</span>
            <h2>{selectedTeam.players.length} registered players</h2>
          </div>
          <a href={worldCupData.source.squads} target="_blank" rel="noreferrer">
            Source
          </a>
        </div>

        <div className="roster-table" role="table" aria-label={`${selectedTeam.name} squad`}>
          <div className="roster-head" role="row">
            <span>No.</span>
            <span>Player</span>
            <span>Pos</span>
            <span>Rating</span>
            <span>Club</span>
            <span>Caps</span>
            <span>Goals</span>
          </div>
          {[...selectedTeam.players].sort(comparePlayers).map((player) => {
            const lineupPlayer = lineupPlayersById.get(player.id);
            const lineupRole = lineupPlayer?.role;

            return (
              <button
                type="button"
                role="row"
                key={player.id}
                className={`roster-row ${player.id === selectedPlayer.id ? 'active' : ''}`}
                onClick={() => setSelectedPlayerId(player.id)}
              >
                <span>{player.number}</span>
                <span className="roster-player-name">
                  <span className="roster-player-text">{player.name}</span>
                  {player.captain ? (
                    <span className="captain-badge" title="Captain" aria-label="Captain">
                      C
                    </span>
                  ) : null}
                </span>
                <span
                  className="roster-position"
                  title={
                    lineupPlayer
                      ? `Squad position: ${player.position} · Lineup role: ${lineupRole}`
                      : `Squad position: ${player.position}`
                  }
                >
                  <span className="roster-position-main">{player.position}</span>
                  {lineupRole && lineupRole !== player.position ? <small>XI {lineupRole}</small> : null}
                </span>
                <span
                  className={`roster-rating ${player.eaFcRating ? 'rated' : ''}`}
                  title={
                    player.eaFcRating
                      ? `${player.eaFcRatingSource || 'EA Sports FC 26'}: ${player.eaFcRating} OVR${player.eaFcTeam ? `, ${player.eaFcTeam}` : ''}`
                      : 'EA Sports FC 26 rating unavailable'
                  }
                >
                  {player.eaFcRating ?? 'n/a'}
                </span>
                <span className="roster-club">
                  <ClubMark logo={player.clubLogo} name={player.club} />
                  {player.club}
                </span>
                <span>{player.caps}</span>
                <span>{player.goals}</span>
              </button>
            );
          })}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function remainingKnockoutTeams() {
  const currentMatchById = buildSimulatedKnockoutMatches();
  const remainingCodes = possibleWinnerCodesForMatch('M104', currentMatchById);

  if (remainingCodes.length > 0) {
    return remainingCodes.map((code) => TEAM_BY_CODE.get(code)).filter(Boolean);
  }

  const championCode = currentMatchById.get('M104')?.winnerCode;
  return championCode ? [TEAM_BY_CODE.get(championCode)].filter(Boolean) : [];
}

function possibleWinnerCodesForMatch(matchId, matchById, visitedMatchIds = new Set()) {
  if (visitedMatchIds.has(matchId)) return [];
  visitedMatchIds.add(matchId);

  const match = matchById.get(matchId);
  if (!match) return [];
  if (match.winnerCode) return [match.winnerCode];

  const feederReferences = BRACKET_FEEDERS[match.id] ?? [];
  const codes = feederReferences
    .filter((reference) => reference.startsWith('W'))
    .flatMap((reference) =>
      possibleWinnerCodesForMatch(`M${reference.slice(1)}`, matchById, visitedMatchIds),
    );

  const directCodes = match.teams.map((entry) => entry.code).filter(Boolean);
  return [...new Set([...codes, ...directCodes])];
}

function loserCodeForMatch(match) {
  if (!match?.winnerCode) return '';
  return match.teams.find((entry) => entry.code && entry.code !== match.winnerCode)?.code ?? '';
}

function entryFromBracketReference(reference, matchById, fallbackEntry) {
  const referenceType = reference.slice(0, 1);
  const sourceMatchId = `M${reference.slice(1)}`;
  const sourceMatch = matchById.get(sourceMatchId);
  const code =
    referenceType === 'W' ? sourceMatch?.winnerCode : loserCodeForMatch(sourceMatch);

  if (code) return { code };
  return fallbackEntry ? { ...fallbackEntry } : { label: reference };
}

function buildSimulatedKnockoutMatches(predictions = {}) {
  const matchById = new Map();

  knockoutData.rounds.forEach((round) => {
    round.matches.forEach((baseMatch) => {
      const feeders = BRACKET_FEEDERS[baseMatch.id];
      const teams = feeders
        ? feeders.map((reference, index) =>
            entryFromBracketReference(reference, matchById, baseMatch.teams[index]),
          )
        : baseMatch.teams.map((entry) => ({ ...entry }));
      const predictedWinnerCode = predictions[baseMatch.id];
      const canPredict =
        !baseMatch.winnerCode && teams.length === 2 && teams.every((entry) => entry.code);
      const validPrediction = canPredict
        ? teams.find((entry) => entry.code === predictedWinnerCode)?.code
        : '';
      const winnerCode = baseMatch.winnerCode ?? validPrediction ?? '';

      matchById.set(baseMatch.id, {
        ...baseMatch,
        teams,
        status: validPrediction ? 'Projected' : baseMatch.status,
        winnerCode,
        canPredict,
        isProjected: Boolean(validPrediction),
      });
    });
  });

  return matchById;
}

function pruneBracketPredictions(predictions) {
  const matchById = buildSimulatedKnockoutMatches(predictions);

  return Object.entries(predictions).reduce((validPredictions, [matchId, winnerCode]) => {
    const baseMatch = KNOCKOUT_MATCH_BY_ID.get(matchId);
    const simulatedMatch = matchById.get(matchId);

    if (
      !baseMatch?.winnerCode &&
      simulatedMatch?.isProjected &&
      simulatedMatch.winnerCode === winnerCode
    ) {
      validPredictions[matchId] = winnerCode;
    }

    return validPredictions;
  }, {});
}

function orderedBracketPredictionEntries(predictions) {
  return REMAINING_PREDICTION_MATCH_IDS.map((matchId) => [matchId, predictions[matchId]]).filter(
    ([, winnerCode]) => Boolean(winnerCode),
  );
}

function encodeBracketPredictions(predictions) {
  return orderedBracketPredictionEntries(predictions)
    .map(([matchId, winnerCode]) => `${matchId}:${winnerCode}`)
    .join(',');
}

function decodeBracketPredictions(encodedPredictions = '') {
  const predictions = {};

  encodedPredictions.split(',').forEach((entry) => {
    const [matchId, winnerCode] = entry.split(':');
    const normalizedWinnerCode = winnerCode?.toUpperCase();

    if (
      REMAINING_PREDICTION_MATCH_ID_SET.has(matchId) &&
      normalizedWinnerCode &&
      TEAM_BY_CODE.has(normalizedWinnerCode)
    ) {
      predictions[matchId] = normalizedWinnerCode;
    }
  });

  return pruneBracketPredictions(predictions);
}

function sharedBracketPredictionsFromUrl() {
  if (typeof window === 'undefined') return {};

  const searchParams = new URLSearchParams(window.location.search);
  const encodedPredictions = searchParams.get(BRACKET_SHARE_PARAM);

  return encodedPredictions ? decodeBracketPredictions(encodedPredictions) : {};
}

function hasSharedBracketUrl() {
  return typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).has(BRACKET_SHARE_PARAM)
    : false;
}

function createBracketShareUrl(predictions) {
  if (typeof window === 'undefined') return '';

  const url = new URL('/bracket', window.location.origin);
  url.searchParams.set(BRACKET_SHARE_PARAM, encodeBracketPredictions(predictions));
  return url.toString();
}

function clearBracketShareUrl() {
  if (typeof window === 'undefined' || window.location.pathname !== '/bracket') return;

  const searchParams = new URLSearchParams(window.location.search);
  if (!searchParams.has(BRACKET_SHARE_PARAM)) return;

  searchParams.delete(BRACKET_SHARE_PARAM);
  const nextSearch = searchParams.toString();
  const nextUrl = nextSearch ? `/bracket?${nextSearch}` : '/bracket';
  window.history.replaceState({}, '', nextUrl);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function copyTextToClipboard(value) {
  if (!navigator.clipboard) return false;

  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

function BracketPage({ onNavigate, onTeamSelect }) {
  const remainingTeams = remainingKnockoutTeams();
  const snapshotRef = useRef(null);
  const [predictions, setPredictions] = useState(() => sharedBracketPredictionsFromUrl());
  const [shareStatus, setShareStatus] = useState(() =>
    hasSharedBracketUrl() ? 'Snapshot loaded' : '',
  );
  const [snapshotBusy, setSnapshotBusy] = useState(false);
  const simulatedMatchById = useMemo(
    () => buildSimulatedKnockoutMatches(predictions),
    [predictions],
  );
  const finalMatch = simulatedMatchById.get('M104');
  const thirdPlaceMatch = simulatedMatchById.get('M103');
  const predictionCount = Object.keys(predictions).length;
  const predictionTargetCount = REMAINING_PREDICTION_MATCH_IDS.length;
  const bracketComplete = predictionCount === predictionTargetCount;
  const projectedChampion = finalMatch?.winnerCode
    ? TEAM_BY_CODE.get(finalMatch.winnerCode)
    : null;
  const shareUrl = useMemo(
    () => (bracketComplete ? createBracketShareUrl(predictions) : ''),
    [bracketComplete, predictions],
  );

  useEffect(() => {
    const syncSharedPredictions = () => {
      const sharedPredictions = sharedBracketPredictionsFromUrl();
      setPredictions(sharedPredictions);
      setShareStatus(hasSharedBracketUrl() ? 'Snapshot loaded' : '');
    };

    window.addEventListener('popstate', syncSharedPredictions);
    return () => {
      window.removeEventListener('popstate', syncSharedPredictions);
    };
  }, []);

  useEffect(() => {
    if (!bracketComplete && shareStatus !== 'Snapshot loaded') {
      setShareStatus('');
    }
  }, [bracketComplete, shareStatus]);

  function handleWinnerSelect(match, winnerCode) {
    if (!match.canPredict || !winnerCode) return;

    clearBracketShareUrl();
    setShareStatus('');
    setPredictions((currentPredictions) => {
      const nextPredictions = { ...currentPredictions };

      if (nextPredictions[match.id] === winnerCode) {
        delete nextPredictions[match.id];
      } else {
        nextPredictions[match.id] = winnerCode;
      }

      return pruneBracketPredictions(nextPredictions);
    });
  }

  function handleResetBracket() {
    clearBracketShareUrl();
    setPredictions({});
    setShareStatus('');
  }

  async function handleShareBracket() {
    if (!bracketComplete || !shareUrl || !snapshotRef.current || snapshotBusy) return;

    setSnapshotBusy(true);
    setShareStatus('Creating PNG...');

    try {
      const { toBlob } = await import('html-to-image');
      const blob = await toBlob(snapshotRef.current, {
        backgroundColor: '#f4f6f1',
        cacheBust: true,
        pixelRatio: 2,
      });

      if (!blob) throw new Error('Could not create bracket snapshot.');

      const filename = `world-cup-lineups-bracket-${Date.now()}.png`;
      const file = new File([blob], filename, { type: 'image/png' });
      const shareText = projectedChampion
        ? `My World Cup bracket has ${projectedChampion.name} winning it all. ${shareUrl}`
        : `My completed World Cup bracket prediction. ${shareUrl}`;

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: 'World Cup Lineups bracket prediction',
          text: shareText,
          files: [file],
        });
        setShareStatus('Snapshot shared');
        return;
      }

      downloadBlob(blob, filename);
      const copied = await copyTextToClipboard(shareUrl);
      setShareStatus(copied ? 'PNG downloaded + link copied' : 'PNG downloaded');
    } catch (error) {
      if (error?.name === 'AbortError') return;

      const copied = await copyTextToClipboard(shareUrl);
      setShareStatus(copied ? 'PNG failed, link copied' : 'Snapshot failed');
    } finally {
      setSnapshotBusy(false);
    }
  }

  return (
    <main className="app-shell">
      <AppTopbar activeView="bracket" onNavigate={onNavigate} />

      <section className="bracket-shell">
        <header className="bracket-header">
          <div>
            <span className="eyebrow">Knockout Stage</span>
            <h2>World Cup bracket</h2>
            <p>
              A live-style bracket snapshot for the remaining route to the final, while
              the full group and squad browser stays available in Lineups.
            </p>
          </div>
          <a href={knockoutData.sourceUrl} target="_blank" rel="noreferrer">
            {knockoutData.sourceLabel}
          </a>
        </header>

        <section className="remaining-panel" aria-label="Remaining teams">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Still Alive</span>
              <h2>{remainingTeams.length} teams remaining</h2>
            </div>
            <span className="bracket-updated">Updated {knockoutData.updatedAt}</span>
          </div>

          <div className="remaining-team-strip">
            {remainingTeams.map((team) => (
              <a
                key={team.id}
                href={teamPath(team)}
                className="remaining-team-pill"
                onClick={(event) => {
                  if (!isPlainLeftClick(event)) return;
                  event.preventDefault();
                  onTeamSelect(team);
                }}
              >
                <img src={flagUrl(team)} alt="" />
                {team.name}
              </a>
            ))}
          </div>
        </section>

        <section className="bracket-sim-panel" aria-label="Bracket simulator">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Simulator</span>
              <h2>Prediction mode</h2>
            </div>
            <div className="bracket-actions">
              <button
                type="button"
                className="bracket-share-button"
                onClick={handleShareBracket}
                disabled={!bracketComplete || snapshotBusy}
                title={bracketComplete ? 'Share this completed bracket as a PNG' : 'Complete every pick to share'}
              >
                <Share2 size={16} />
                {snapshotBusy ? 'Creating PNG' : 'Share snapshot'}
              </button>
              <button
                type="button"
                className="bracket-reset-button"
                onClick={handleResetBracket}
                disabled={!predictionCount && !hasSharedBracketUrl()}
              >
                <RotateCcw size={16} />
                Reset to current bracket
              </button>
            </div>
          </div>

          <div className="simulation-stats" aria-label="Simulation status">
            <span>
              {predictionCount}/{predictionTargetCount} picks
            </span>
            <span>{ACTUAL_KNOCKOUT_RESULT_COUNT} results locked</span>
            <span>
              {projectedChampion
                ? `Projected champion: ${projectedChampion.name}`
                : 'Champion open'}
            </span>
            {shareStatus && <span className="share-status">{shareStatus}</span>}
          </div>
        </section>

        <section className="bracket-tree" aria-label="Knockout bracket">
          <BracketSide
            side={BRACKET_SIDES[0].id}
            lanes={BRACKET_SIDES[0].lanes}
            matchById={simulatedMatchById}
            onTeamSelect={onTeamSelect}
            onWinnerSelect={handleWinnerSelect}
          />

          <div className="bracket-final-column" aria-label="Final matches">
            {finalMatch && (
              <div className="bracket-final-card primary">
                <h3>Final</h3>
                <BracketMatch
                  match={finalMatch}
                  onTeamSelect={onTeamSelect}
                  onWinnerSelect={handleWinnerSelect}
                />
              </div>
            )}
            {thirdPlaceMatch && (
              <div className="bracket-final-card secondary">
                <h3>Third Place</h3>
                <BracketMatch
                  match={thirdPlaceMatch}
                  onTeamSelect={onTeamSelect}
                  onWinnerSelect={handleWinnerSelect}
                />
              </div>
            )}
          </div>

          <BracketSide
            side={BRACKET_SIDES[1].id}
            lanes={BRACKET_SIDES[1].lanes}
            matchById={simulatedMatchById}
            onTeamSelect={onTeamSelect}
            onWinnerSelect={handleWinnerSelect}
          />
        </section>
      </section>

      {bracketComplete && (
        <BracketSnapshot
          snapshotRef={snapshotRef}
          matchById={simulatedMatchById}
          finalMatch={finalMatch}
          thirdPlaceMatch={thirdPlaceMatch}
          projectedChampion={projectedChampion}
          predictionCount={predictionCount}
          predictionTargetCount={predictionTargetCount}
          shareUrl={shareUrl}
        />
      )}

      <SiteFooter />
    </main>
  );
}

function BracketSnapshot({
  snapshotRef,
  matchById,
  finalMatch,
  thirdPlaceMatch,
  projectedChampion,
  predictionCount,
  predictionTargetCount,
  shareUrl,
}) {
  const shareHost = shareUrl ? new URL(shareUrl).host : 'World Cup Lineups';

  return (
    <div className="snapshot-capture-wrap" aria-hidden="true">
      <section ref={snapshotRef} className="bracket-snapshot-card">
        <header className="snapshot-header">
          <div className="snapshot-brand">
            <div className="brand-mark">
              <Trophy size={24} strokeWidth={2.4} />
            </div>
            <div>
              <span>World Cup Lineups</span>
              <h2>Bracket prediction</h2>
            </div>
          </div>

          <div className="snapshot-champion">
            <span>Projected champion</span>
            <strong>{projectedChampion?.name ?? 'Open'}</strong>
          </div>
        </header>

        <div className="snapshot-meta">
          <span>Updated {knockoutData.updatedAt}</span>
          <span>
            {predictionCount}/{predictionTargetCount} picks
          </span>
          <span>{ACTUAL_KNOCKOUT_RESULT_COUNT} results locked</span>
        </div>

        <section className="bracket-tree snapshot-tree" aria-label="Completed bracket snapshot">
          <BracketSide
            side={BRACKET_SIDES[0].id}
            lanes={BRACKET_SIDES[0].lanes}
            matchById={matchById}
            readOnly
          />

          <div className="bracket-final-column" aria-label="Final matches">
            {finalMatch && (
              <div className="bracket-final-card primary">
                <h3>Final</h3>
                <BracketMatch match={finalMatch} readOnly />
              </div>
            )}
            {thirdPlaceMatch && (
              <div className="bracket-final-card secondary">
                <h3>Third Place</h3>
                <BracketMatch match={thirdPlaceMatch} readOnly />
              </div>
            )}
          </div>

          <BracketSide
            side={BRACKET_SIDES[1].id}
            lanes={BRACKET_SIDES[1].lanes}
            matchById={matchById}
            readOnly
          />
        </section>

        <footer className="snapshot-footer">
          <span>{shareHost}</span>
          <span>Independent fan project</span>
        </footer>
      </section>
    </div>
  );
}

function BracketSide({ side, lanes, matchById, onTeamSelect, onWinnerSelect, readOnly = false }) {
  const sideLabel = side === 'left' ? 'Left' : 'Right';

  return (
    <section className={`bracket-side ${side}`} aria-label={`${sideLabel} side of bracket`}>
      {lanes.map((lane) => (
        <BracketLane
          key={`${side}-${lane.label}`}
          lane={lane}
          matchById={matchById}
          onTeamSelect={onTeamSelect}
          onWinnerSelect={onWinnerSelect}
          readOnly={readOnly}
        />
      ))}
    </section>
  );
}

function BracketLane({ lane, matchById, onTeamSelect, onWinnerSelect, readOnly = false }) {
  const matches = lane.matchIds.map((matchId) => matchById.get(matchId)).filter(Boolean);
  const slotStarts = BRACKET_SLOT_STARTS[matches.length] ?? matches.map((_, index) => index + 1);

  return (
    <div className={`bracket-lane match-count-${matches.length}`}>
      <h3 className="bracket-lane-title">{lane.label}</h3>
      <div className="bracket-lane-grid">
        {matches.map((match, index) => (
          <div
            key={match.id}
            className={`bracket-node ${index % 2 === 0 && matches.length > 1 ? 'pair-start' : ''}`}
            style={{ '--slot': slotStarts[index] }}
          >
            <BracketMatch
              match={match}
              onTeamSelect={onTeamSelect}
              onWinnerSelect={onWinnerSelect}
              readOnly={readOnly}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function BracketMatch({ match, onTeamSelect, onWinnerSelect, readOnly = false }) {
  const projected = Boolean(match.isProjected);
  const complete = Boolean(match.winnerCode && !projected);
  const matchState = complete ? 'complete' : projected ? 'projected' : 'pending';

  return (
    <article className={`bracket-match ${matchState} ${match.canPredict ? 'predictable' : ''}`}>
      <div className="bracket-match-meta">
        <span>{match.id}</span>
        <span>{match.date}</span>
        <strong>{match.status}</strong>
      </div>

      <div className="bracket-slots">
        {match.teams.map((entry, index) => (
          <BracketTeamSlot
            key={`${match.id}-${entry.code ?? entry.label}-${index}`}
            entry={entry}
            match={match}
            onTeamSelect={onTeamSelect}
            onWinnerSelect={onWinnerSelect}
            readOnly={readOnly}
          />
        ))}
      </div>
    </article>
  );
}

function BracketTeamSlot({ entry, match, onTeamSelect, onWinnerSelect, readOnly = false }) {
  const team = entry.code ? TEAM_BY_CODE.get(entry.code) : null;
  const isWinner = entry.code && match.winnerCode === entry.code;
  const isEliminated = entry.code && match.winnerCode && match.winnerCode !== entry.code;
  const canSelectWinner = Boolean(team && match.canPredict && onWinnerSelect && !readOnly);
  const score = entry.score ? `${entry.score}${entry.pens ? ` (${entry.pens})` : ''}` : '';
  const className = [
    'bracket-team',
    isWinner ? 'winner' : '',
    isEliminated ? 'eliminated' : '',
    canSelectWinner ? 'selectable' : '',
    match.isProjected && isWinner ? 'projected-winner' : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (!team) {
    return (
      <div className={`${className} placeholder`}>
        <span className="bracket-team-flag" />
        <span>{entry.label}</span>
        <strong>{score}</strong>
      </div>
    );
  }

  if (readOnly) {
    return (
      <div className={className}>
        <img src={flagUrl(team)} alt="" crossOrigin="anonymous" />
        <span>{team.name}</span>
        <strong>{score}</strong>
      </div>
    );
  }

  if (canSelectWinner) {
    return (
      <button
        type="button"
        className={className}
        title={`Project ${team.name} to advance`}
        onClick={() => onWinnerSelect(match, entry.code)}
      >
        <img src={flagUrl(team)} alt="" crossOrigin="anonymous" />
        <span>{team.name}</span>
        <strong>{score}</strong>
      </button>
    );
  }

  return (
    <a
      href={teamPath(team)}
      className={className}
      title={`Open ${team.name} squad`}
      onClick={(event) => {
        if (!isPlainLeftClick(event)) return;
        event.preventDefault();
        onTeamSelect(team);
      }}
    >
      <img src={flagUrl(team)} alt="" crossOrigin="anonymous" />
      <span>{team.name}</span>
      <strong>{score}</strong>
    </a>
  );
}

function Stat({ icon, value, label }) {
  return (
    <div className="stat-pill">
      {icon}
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <span>World Cup Lineups</span>
      <nav aria-label="Site links">
        <a href="/">Lineups</a>
        <a href="/bracket">Bracket</a>
        <a href="/about">About</a>
        <a href="/sources">Sources</a>
        <a href="/privacy">Privacy</a>
        <a href="https://github.com/jose0choa/world-cup-xi" target="_blank" rel="noreferrer">
          GitHub
        </a>
      </nav>
    </footer>
  );
}

function InfoHeader() {
  return (
    <section className="app-topbar info-topbar">
      <a className="brand-lockup info-brand" href="/">
        <div className="brand-mark">
          <Trophy size={22} strokeWidth={2.4} />
        </div>
        <div>
          <h1>World Cup Lineups</h1>
          <p>{worldCupData.tournament}</p>
        </div>
      </a>

      <a className="home-link" href="/">
        Back to lineups
      </a>
    </section>
  );
}

function InfoPageLayout({ eyebrow, title, children }) {
  return (
    <main className="app-shell info-shell">
      <InfoHeader />
      <section className="info-page">
        <div className="info-hero">
          <span className="eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        {children}
      </section>
      <SiteFooter />
    </main>
  );
}

function AboutPage() {
  return (
    <InfoPageLayout eyebrow="About" title="A neutral squad and lineup viewer">
      <div className="info-content">
        <section className="info-block">
          <h3>What This Is</h3>
          <p>
            World Cup Lineups helps compare international football squads, formations,
            player clubs, ratings, and computed team strength in one focused interface.
          </p>
        </section>

        <section className="info-block">
          <h3>How Ratings Work</h3>
          <p>
            Player ratings are matched from public ratings sources. Team OVR and primary
            ranks are computed from each team's top 16 rated players.
          </p>
          <p>
            If a team does not have enough rated players for a fair computed rank, it is
            placed after the computed teams using FIFA men's ranking order. FIFA rankings
            are only used for those missing-rank teams, so they do not move or override
            teams that already have a computed app rank.
          </p>
        </section>

        <section className="info-block">
          <h3>Independence</h3>
          <p>
            This is an independent fan project. It is not affiliated with, endorsed by, or
            sponsored by any governing body, league, club, game publisher, or data provider.
          </p>
        </section>
      </div>
    </InfoPageLayout>
  );
}

function SourcesPage() {
  return (
    <InfoPageLayout eyebrow="Sources" title="Data and asset sources">
      <div className="info-content">
        <section className="info-block">
          <h3>Primary Data</h3>
          <ul className="source-list">
            <li>
              <a href={worldCupData.source.squads} target="_blank" rel="noreferrer">
                Wikipedia squad data
              </a>
              <span>Players, clubs, coaches, caps, goals, and squad numbers.</span>
            </li>
            <li>
              <a href={worldCupData.source.groups} target="_blank" rel="noreferrer">
                Wikipedia match/group data
              </a>
              <span>Group-stage lineup and match details where available.</span>
            </li>
            <li>
              <a href={worldCupData.source.lineups} target="_blank" rel="noreferrer">
                Sky Sports match lineups
              </a>
              <span>Knockout-stage team sheets where 11 starters are available.</span>
            </li>
            <li>
              <a href={worldCupData.source.eaFcRatings} target="_blank" rel="noreferrer">
                Official EA Sports FC ratings
              </a>
              <span>Primary player rating source.</span>
            </li>
            <li>
              <a href={worldCupData.source.eaFcFallbackRatings} target="_blank" rel="noreferrer">
                FUT.GG player ratings
              </a>
              <span>Fallback FC 26 common-card ratings for players missing from the official table.</span>
            </li>
            <li>
              <strong>Manual rating overrides</strong>
              <span>Small app-level fixes for prominent players missing because of licensing/data gaps.</span>
            </li>
            <li>
              <a href={FIFA_MENS_RANKING_URL} target="_blank" rel="noreferrer">
                FIFA/Coca-Cola men's ranking
              </a>
              <span>Fallback order for teams without enough player ratings.</span>
            </li>
            <li>
              <a href={knockoutData.sourceUrl} target="_blank" rel="noreferrer">
                {knockoutData.sourceLabel}
              </a>
              <span>Knockout bracket snapshot and remaining tournament path.</span>
            </li>
          </ul>
        </section>

        <section className="info-block">
          <h3>Images and Metadata</h3>
          <p>
            Team flags are loaded from FlagCDN. Club logos and player images come from
            public page metadata and summaries when available. All marks, photos, names,
            and statistics belong to their respective owners.
          </p>
        </section>

        <section className="info-block">
          <h3>Computed Values</h3>
          <p>
            Team OVR, ATT, MID, DEF, and ranks are calculated by this app from available
            player ratings. A team needs at least {TEAM_RATING_MINIMUM} rated players to
            receive a computed rank.
          </p>
          <p>
            Teams with too few ratings are ranked after all computed teams by FIFA men's
            ranking order. This means a team can have a strong official FIFA ranking but
            still appear below the computed teams here, because the FIFA order is only a
            fallback for otherwise unavailable ranks. These values are comparison aids,
            not official tournament rankings.
          </p>
        </section>
      </div>
    </InfoPageLayout>
  );
}

function PrivacyPage() {
  return (
    <InfoPageLayout eyebrow="Privacy" title="Privacy notice">
      <div className="info-content">
        <section className="info-block">
          <h3>Current Data Collection</h3>
          <p>
            This site does not require accounts, does not include a contact form, and does
            not ask visitors to submit personal information.
          </p>
        </section>

        <section className="info-block">
          <h3>Hosting and Logs</h3>
          <p>
            The site is hosted on Vercel, which may process standard technical information
            such as IP address, device information, request logs, and performance data to
            operate and protect the service.
          </p>
        </section>

        <section className="info-block">
          <h3>Analytics and Ads</h3>
          <p>
            This site uses Vercel Web Analytics to understand page views and basic traffic
            patterns. Vercel Web Analytics is designed without third-party cookies and
            reports aggregated usage data. Advertising is not currently enabled; if ads are
            added later, this notice should be updated with the provider and any consent
            options required for visitors.
          </p>
        </section>

        <section className="info-block">
          <h3>Third-Party Sources</h3>
          <p>
            Some images and data are requested from third-party sources listed on the
            Sources page. Visiting those providers directly is subject to their own privacy
            policies.
          </p>
        </section>
      </div>
    </InfoPageLayout>
  );
}

function App() {
  const [route, setRoute] = useState(() => routeFromPathname());
  usePageSeo(route);

  useEffect(() => {
    const syncRoute = () => {
      setRoute(routeFromPathname());
    };

    window.addEventListener('popstate', syncRoute);
    return () => {
      window.removeEventListener('popstate', syncRoute);
    };
  }, []);

  const navigateToPath = (nextPath) => {
    const nextRoute = routeFromPathname(nextPath);
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
    setRoute(nextRoute);
  };

  const navigateToTeam = (team) => navigateToPath(teamPath(team));

  let page = (
    <LineupsPage
      routeTeam={route.type === 'team' ? route.team : null}
      onNavigate={navigateToPath}
      onTeamSelect={navigateToTeam}
    />
  );
  if (route.path === '/bracket') {
    page = <BracketPage onNavigate={navigateToPath} onTeamSelect={navigateToTeam} />;
  }
  if (route.path === '/about') page = <AboutPage />;
  if (route.path === '/sources') page = <SourcesPage />;
  if (route.path === '/privacy') page = <PrivacyPage />;

  return (
    <>
      {page}
      <Analytics />
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
