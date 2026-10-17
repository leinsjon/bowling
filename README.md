# Couples bowling league

A single-page league manager published as a claude.ai artifact.

- `index.html` – the page (teams, subs, schedule, rules). Data lives in the artifact's database.
- `engine.js` – scoring engine: handicap, entering averages, round-robin schedule, match points.
- `npm test` – engine tests.

Scoring: per game, 1 point per bowler matchup (bowler 1 vs bowler 1, bowler 2 vs bowler 2)
plus 3 points for the higher handicapped team total, so 15 points a week. Handicap defaults to
100% of 220 minus average (to be confirmed with the league).
