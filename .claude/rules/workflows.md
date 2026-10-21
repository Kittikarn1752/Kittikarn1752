---
paths:
  - ".github/workflows/**"
  - "src/data/**"
  - "src/game/**"
---
# Automation rules
- Use `GITHUB_TOKEN` only. No PATs and no secrets: stats are public-only by decision.
- Give each workflow least-privilege `permissions:`. Use `contents: write` only where the workflow commits, and `issues: write` only for the game.
- Set a `concurrency:` group in every workflow. The game uses a queue and never cancels a run in progress.
- Pin actions to their latest major tag. Check which major is current before writing it; don't guess.
- Commit as github-actions[bot], and only when outputs changed. Message: `chore(<scope>): … [skip ci]`.
- Schedule off the hour (for example `17 3 * * *`), and always keep `workflow_dispatch`.
- Public repos disable schedules after 60 days without activity. The daily data commit plus the visible "synced" stamp keep it alive. Document how to re-enable it.
- Never echo tokens or full API payloads in logs.
- Test with `workflow_dispatch` (`gh workflow run`, which needs approval) before relying on the schedule.
