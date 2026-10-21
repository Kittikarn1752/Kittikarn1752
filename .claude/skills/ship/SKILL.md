---
name: ship
description: Release gate. Preflight checks, commit, push and live verification for the profile, the site, or the profile sidebar. User-invoked only.
argument-hint: "[profile|site|sidebar]"
disable-model-invocation: true
---
The user ran `/ship $ARGUMENTS`. That is their approval to publish the current work, which has already passed QA. With no argument, the target is `profile`. Follow the recipes in skill `github-ops`.

1. **Preflight.** Stop and report if any of these fail:
   - `npm run check -- --publish` passes. It covers required data, placeholders, budgets and a secrets scan.
   - `git status --short` shows only intended changes.
   - The current ROADMAP phase meets its done-when.

   Then tell the user in Thai, in ≤ 5 lines, what will go live.
2. **Update ROADMAP first:** check off the done items, update the status table, and add ≤ 5 decision lines and the next action. That way one push carries everything.
3. **Commit:** stage only the intended files. Message: `<type>(<scope>): …`.
4. **Publish by target:**
   - `profile`: if there's no `origin` yet, create the repo per github-ops. Then `git push -u origin main`.
   - `site`: run everything inside `site/`, its own repo. On the first run, create the repo and enable Pages. Then push.
   - `sidebar`: show the diff between current and proposed values, then apply via the github-ops API recipes. There's no git push for this target.
5. **Verify live:**
   - Open `https://github.com/<login>` (or the site) in the built-in browser and take a screenshot at scale 0.5.
   - Check for broken images: `[...document.images].filter(i => !i.complete || !i.naturalWidth).map(i => i.src)`
   - If workflows changed, run `gh run list -L 3`.
   - Raw files are CDN-cached for a few minutes, so wait and retry before calling anything broken.
6. **Report in Thai:** the live link, what's live, and anything pending or not verified.

To roll back, use `git revert <sha>` and push. Never force-push.
