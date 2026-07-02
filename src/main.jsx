import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import {
  GitBranch,
  Goal,
  Search,
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
  const roundOf32 = knockoutData.rounds.find((round) => round.id === 'round-of-32');
  const codes = new Set();

  roundOf32?.matches.forEach((match) => {
    if (match.winnerCode) {
      codes.add(match.winnerCode);
      return;
    }

    match.teams.forEach((entry) => {
      if (entry.code) codes.add(entry.code);
    });
  });

  return [...codes].map((code) => TEAM_BY_CODE.get(code)).filter(Boolean);
}

function BracketPage({ onNavigate, onTeamSelect }) {
  const remainingTeams = remainingKnockoutTeams();

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

        <section className="bracket-board" aria-label="Knockout bracket">
          {knockoutData.rounds.map((round) => (
            <div key={round.id} className="bracket-round">
              <h3>{round.label}</h3>
              <div className="bracket-match-list">
                {round.matches.map((match) => (
                  <BracketMatch key={match.id} match={match} onTeamSelect={onTeamSelect} />
                ))}
              </div>
            </div>
          ))}
        </section>
      </section>

      <SiteFooter />
    </main>
  );
}

function BracketMatch({ match, onTeamSelect }) {
  const complete = Boolean(match.winnerCode);

  return (
    <article className={`bracket-match ${complete ? 'complete' : 'pending'}`}>
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
          />
        ))}
      </div>
    </article>
  );
}

function BracketTeamSlot({ entry, match, onTeamSelect }) {
  const team = entry.code ? TEAM_BY_CODE.get(entry.code) : null;
  const isWinner = entry.code && match.winnerCode === entry.code;
  const isEliminated = entry.code && match.winnerCode && match.winnerCode !== entry.code;
  const score = entry.score ? `${entry.score}${entry.pens ? ` (${entry.pens})` : ''}` : '';
  const className = `bracket-team ${isWinner ? 'winner' : ''} ${isEliminated ? 'eliminated' : ''}`;

  if (!team) {
    return (
      <div className={`${className} placeholder`}>
        <span className="bracket-team-flag" />
        <span>{entry.label}</span>
        <strong>{score}</strong>
      </div>
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
      <img src={flagUrl(team)} alt="" />
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
              <span>Latest lineup and match details where available.</span>
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
