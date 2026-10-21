---
name: kickoff
description: Start or resume a work session on the Kittikarn profile. Picks the ROADMAP phase, orients cheaply, and presents a plan for approval.
argument-hint: "[phase, e.g. P1]"
disable-model-invocation: true
---
Session kickoff.
- Requested phase: "$ARGUMENTS". If it's empty, take the first phase in docs/ROADMAP.md that isn't ✅.
- Current effort: ${CLAUDE_EFFORT}.

Read `prompts/03-claude-code-kickoff.md` and follow it exactly, starting at step 0. Edit nothing until the user approves your plan.
