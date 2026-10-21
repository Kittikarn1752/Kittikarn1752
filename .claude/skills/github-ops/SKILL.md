---
name: github-ops
description: Exact gh/git recipes for this project. Covers auth scopes, the noreply git identity, creating the profile and site repos, Pages via Actions, labels, workflow runs, the profile sidebar API (bio, links, social accounts, status), and what must stay manual. Use when planning or doing any GitHub operation; every write still needs the user's approval.
---

# GitHub operations
Replace `<login>` with the real login. Read-only commands are fine. Every write needs the user's approval, and settings.json also prompts for it.

## Auth and identity (P0)
- Run `gh auth status`. The scopes must include `repo`, `workflow` and `user`.
  - If any are missing, tell the user to run `gh auth refresh -h github.com -s workflow,user` themselves. It's interactive.
- Get the account details with `gh api user --jq '.login, .id, .name'`.
- Set a repo-local identity, never `--global`:
  ```
  git config user.name "<display name>"
  git config user.email "<id>+<login>@users.noreply.github.com"
  ```
  This hides the user's real email and avoids GH007 push rejections.
- `git init -b main`, then make the first commit.

## Profile repo (P1, through /ship)
1. Check first: `gh repo view <login>/<login> --json name,visibility,isEmpty`. If it already has content, plan with the user how to keep or replace it. Never overwrite silently.
2. Create it:
   ```
   gh repo create <login>/<login> --public --source . --remote origin --description "Kittikarn's Event Horizon profile"
   ```
3. Push: `git push -u origin main`. A permission prompt appears.
4. Topics: `gh repo edit <login>/<login> --add-topic github-profile,svg-animation,space`

## Automation (P2–P3)
- Run a workflow: `gh workflow run stats.yml`.
- Inspect runs: `gh run list --workflow stats.yml -L 3`, then `gh run view <id> --log-failed`.
- Create the game label: `gh label create blackhole --color FFB547 --description "Feed the Black Hole"`.
- Declare least-privilege `permissions:` in each workflow file. Leave the repo default read-only.

## Site repo (P4, inside `site/`)
1. Set up the repo:
   ```
   git init -b main
   gh repo create <login>/<login>.github.io --public --source . --remote origin
   ```
2. Enable Pages from Actions:
   ```
   gh api -X POST repos/<login>/<login>.github.io/pages -f build_type=workflow
   ```
   If you get HTTP 409, Pages already exists. Use `gh api -X PUT repos/<login>/<login>.github.io/pages -f build_type=workflow`.
3. Deploy with the official actions configure-pages, upload-pages-artifact and deploy-pages. Check their latest majors first.

## Profile sidebar (P5, through /ship sidebar)
1. Read the current values:
   ```
   gh api user --jq '{name,bio,blog,location,twitter_username,hireable}'
   gh api user/social_accounts
   ```
2. Show the user a diff of current vs proposed values, and apply only after their yes.
3. Apply the changes:
   - Profile fields (`bio` is limited to 160 characters):
     ```
     gh api -X PATCH user -f name="…" -f bio="…" -f blog="https://<login>.github.io" -f location="…" -F hireable=true
     ```
   - Social accounts (at most 4): `gh api -X POST user/social_accounts -f "account_urls[]=https://…"`
   - Status, via GraphQL:
     ```
     gh api graphql -f query='mutation($m:String!,$e:String!){changeUserStatus(input:{message:$m,emoji:$e}){status{message emoji}}}' -f m="…" -f e=":milky_way:"
     ```

## Manual steps (no API; give the user exact clicks)
- Avatar: github.com/settings/profile → Profile picture → Edit → Upload.
- Pins: on the profile page → Customize your pins → choose up to 6.
- Repo social preview: repo Settings → General → Social preview.
- Fewer game notifications: on the profile repo, Watch → Custom → turn off Issues.

## Never
- `--force` pushes
- deleting repos
- printing tokens (`gh auth token` is denied)
- creating PATs on the user's behalf
