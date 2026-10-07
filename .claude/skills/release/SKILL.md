---
name: release
description: Prepare a pull request for release (version bump and CHANGELOG entry) and diagnose releases. Use when preparing a PR for merge, or when asked "did it release?", "the release failed", or about the Release readiness check or the Release workflow. Repo/CI side only; for the server use deploy-server.
---

# Release (repo and CI side)

Merging to `master` publishes `v<package.json version>` automatically if that
tag does not exist yet. Read `docs/deployment/releases.md` for the full story.
For anything on the server box, use the `deploy-server` skill instead.

## Preparing a PR

1. Pick the next version, strictly greater than master's `version` (semver).
2. Bump it so the lockfile follows:
   `npm version --no-git-tag-version <x.y.z>` (updates `package.json` and
   `package-lock.json`).
3. Add `## [x.y.z] - YYYY-MM-DD` to `CHANGELOG.md` (Keep a Changelog format,
   exactly one heading per version). Its body becomes the release notes.
4. Check locally, same as CI does:
   ```bash
   node scripts/release/releaseInfo.mjs version
   git show origin/master:package.json > /tmp/base.json
   node scripts/release/releaseInfo.mjs check-bump --base /tmp/base.json
   node scripts/release/releaseInfo.mjs check-changelog
   ```

## Did it release?

Use the GitHub tools (not `gh`, which may be unavailable): list workflow runs
for `release.yml` and `release-readiness.yml`, read job logs for failures,
and list releases / tags to see whether `v<version>` exists. A run that ends
with "already released, nothing to do" is the normal no-op.

## Common failures

| Symptom | Fix |
|---|---|
| plan: `RELEASE_SIGNING_KEY` secret is empty | The owner adds the secret (`docs/deployment/server-setup.md`, step 1). Then re-run (below) |
| plan: `deploy/allowed_signers` still a placeholder | The owner's public key goes in via a PR (same step); then re-run |
| publish: signature does not verify against `deploy/allowed_signers` | Secret and committed public key are not a pair; the owner fixes one of them (key rotation, step 9) |
| readiness: version not greater / lockfile mismatch | Re-run `npm version --no-git-tag-version <higher>` |
| readiness: CHANGELOG heading missing or duplicated | Fix the `## [x.y.z] - YYYY-MM-DD` heading |
| build or checks fail | Fix the code in a new PR (bumping again); do not touch the tag |
| a leftover draft release | The publish job deletes stale drafts itself; just re-run |

## Re-running

Actions → **Release** → Run workflow on `master` (`workflow_dispatch`). Safe:
an existing tag makes it a no-op.

## Hard rules

- **Never** retag, delete, edit or `--clobber` a published release or tag.
  A bad release is fixed by shipping a new version.
- Never print, request, log or commit the signing private key. Only the public
  key (`deploy/allowed_signers`) lives in the repo.
- Don't weaken the workflow's `permissions` (only `publish` has
  `contents: write`) or unpin actions from commit SHAs.
