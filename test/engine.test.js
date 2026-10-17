const test = require("node:test");
const assert = require("node:assert");
const L = require("../engine.js");

test("handicap is 100% of 220 minus average, never negative", () => {
  assert.strictEqual(L.handicapFor(150), 70);
  assert.strictEqual(L.handicapFor(150.9), 70);
  assert.strictEqual(L.handicapFor(230), 0);
  assert.strictEqual(L.handicapFor(150, { handicapPct: 90 }), 63);
});

test("entering average uses earlier games once there are any", () => {
  assert.strictEqual(L.enteringAverage(140, []), 140);
  assert.strictEqual(L.enteringAverage(140, [150, 160, 171]), 160);
});

test("a full week is worth 15 points", () => {
  assert.strictEqual(L.pointsPerWeek(), 15);
});

test("scoreMatch awards head-to-head and team-total points with handicap", () => {
  const A = [{ average: 200, games: [200, 200, 200] }, { average: 120, games: [120, 120, 130] }];
  const B = [{ average: 150, games: [140, 160, 150] }, { average: 180, games: [180, 170, 180] }];
  const r = L.scoreMatch(A, B);
  // Handicaps: A 20/100, B 70/40. Game 1: A1 220 v B1 210 (A), A2 220 v B2 220 (split),
  // totals 440 v 430 (A) -> A 1+0.5+3, B 0.5.
  assert.deepStrictEqual([r.games[0].pointsA, r.games[0].pointsB], [4.5, 0.5]);
  // Game 2: 220 v 230 (B), 220 v 210 (A), 440 v 440 (split).
  assert.deepStrictEqual([r.games[1].pointsA, r.games[1].pointsB], [2.5, 2.5]);
  assert.strictEqual(r.a + r.b, 15);
});

test("round robin for 12 teams has no repeats over 8 weeks", () => {
  const ids = Array.from({ length: 12 }, (_, i) => "t" + i);
  const rounds = L.roundRobin(ids, 8);
  assert.strictEqual(rounds.length, 8);
  const seen = new Set();
  for (const pairs of rounds) {
    const teams = pairs.flat();
    assert.strictEqual(new Set(teams).size, 12);
    for (const [a, b] of pairs) {
      const key = [a, b].sort().join("-");
      assert.ok(!seen.has(key), key);
      seen.add(key);
    }
  }
});

test("odd team counts get a bye", () => {
  const rounds = L.roundRobin(["a", "b", "c"], 3);
  for (const pairs of rounds) assert.ok(pairs.some((p) => p.includes(null)));
});

test("an entered handicap overrides the calculated one", () => {
  const A = [{ average: 200, handicap: 0, games: [200, 200, 200] }, { average: 150, handicap: 0, games: [150, 150, 150] }];
  const B = [{ average: 200, handicap: 5, games: [200, 200, 200] }, { average: 150, handicap: 5, games: [150, 150, 150] }];
  const r = L.scoreMatch(A, B);
  assert.deepStrictEqual([r.a, r.b], [0, 15]);
});
