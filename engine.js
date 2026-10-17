// League scoring engine. Pure functions, shared by the page and the tests.
(function (root) {
  const DEFAULT_SETTINGS = {
    leagueName: "Couples League",
    gamesPerWeek: 3,
    weeks: 8,
    handicapBase: 220, // TODO(league): confirm handicap base and percentage with the league
    handicapPct: 100,
    headToHeadPoints: 1, // per bowler matchup, per game
    teamGamePoints: 3, // for the higher handicapped team total, per game
    blindPenalty: 10, // absent bowler with no sub bowls average minus this
  };

  function withDefaults(settings) {
    return Object.assign({}, DEFAULT_SETTINGS, settings || {});
  }

  function handicapFor(average, settings) {
    const s = withDefaults(settings);
    const avg = Math.floor(Number(average) || 0);
    return Math.max(0, Math.floor(((s.handicapBase - avg) * s.handicapPct) / 100));
  }

  // Average a bowler carries into a week: their league average from earlier
  // weeks once they have games, otherwise the starting average they were given.
  function enteringAverage(startAvg, priorGames) {
    const games = (priorGames || []).filter((g) => Number.isFinite(g));
    if (!games.length) return Math.floor(Number(startAvg) || 0);
    return Math.floor(games.reduce((a, b) => a + b, 0) / games.length);
  }

  // Round robin by the circle method. Odd team counts get a bye (null opponent).
  function roundRobin(teamIds, weeks) {
    const ids = teamIds.slice();
    if (ids.length < 2) return [];
    if (ids.length % 2) ids.push(null);
    const n = ids.length;
    const rounds = [];
    let rot = ids.slice(1);
    for (let r = 0; r < weeks; r++) {
      const order = [ids[0]].concat(rot);
      const pairs = [];
      for (let i = 0; i < n / 2; i++) {
        const a = order[i];
        const b = order[n - 1 - i];
        // Alternate lanes side so a team isn't always listed first.
        pairs.push(r % 2 ? [b, a] : [a, b]);
      }
      rounds.push(pairs);
      rot = [rot[rot.length - 1]].concat(rot.slice(0, -1));
    }
    return rounds;
  }

  // Score one matchup for one week.
  // Each side: [{ average, games: [g1,g2,g3] }] in slot order (slot 1 vs slot 1).
  // Games must already be the scores that count (a blind score is passed in as a game).
  function scoreMatch(sideA, sideB, settings) {
    const s = withDefaults(settings);
    const result = { a: 0, b: 0, games: [] };
    const award = (x, y, pts) => {
      if (x > y) return [pts, 0];
      if (y > x) return [0, pts];
      return [pts / 2, pts / 2];
    };
    const hcp = (side) => side.map((p) => handicapFor(p.average, s));
    const hA = hcp(sideA);
    const hB = hcp(sideB);
    for (let g = 0; g < s.gamesPerWeek; g++) {
      const game = { matchups: [], totalA: 0, totalB: 0, pointsA: 0, pointsB: 0 };
      const slots = Math.max(sideA.length, sideB.length);
      for (let i = 0; i < slots; i++) {
        const a = sideA[i] ? (Number(sideA[i].games[g]) || 0) + hA[i] : 0;
        const b = sideB[i] ? (Number(sideB[i].games[g]) || 0) + hB[i] : 0;
        const [pa, pb] = award(a, b, s.headToHeadPoints);
        game.matchups.push({ a, b, pointsA: pa, pointsB: pb });
        game.totalA += a;
        game.totalB += b;
        game.pointsA += pa;
        game.pointsB += pb;
      }
      const [ta, tb] = award(game.totalA, game.totalB, s.teamGamePoints);
      game.pointsA += ta;
      game.pointsB += tb;
      result.a += game.pointsA;
      result.b += game.pointsB;
      result.games.push(game);
    }
    return result;
  }

  function pointsPerWeek(settings, bowlersPerTeam) {
    const s = withDefaults(settings);
    return s.gamesPerWeek * ((bowlersPerTeam || 2) * s.headToHeadPoints + s.teamGamePoints);
  }

  const api = { DEFAULT_SETTINGS, withDefaults, handicapFor, enteringAverage, roundRobin, scoreMatch, pointsPerWeek };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.League = api;
})(typeof window !== "undefined" ? window : globalThis);
