# How releases are produced

## Versions drive releases

Every merge to `master` can produce a release, and the version comes from one
place: `"version"` in `package.json`. The workflow `.github/workflows/release.yml`
reads it and looks for the tag `v<version>`:

- **Tag exists** → the run ends successfully as a no-op ("already released").
- **No tag** → it runs every check, builds, signs and publishes a GitHub
  Release. Publishing creates the tag on the exact commit that was built.

So every PR must bump the version (strictly greater than master's) and add a
CHANGELOG entry. Use `npm version --no-git-tag-version <x.y.z>` so
`package-lock.json` stays in sync, then add:

```
## [x.y.z] - YYYY-MM-DD
```

to `CHANGELOG.md` (Keep a Changelog format). That section's body becomes the
release notes.

## What "Release readiness" enforces

The PR check `.github/workflows/release-readiness.yml` fails when:

- the version is not strictly greater (semver) than master's, or
  `package-lock.json` disagrees with `package.json`;
- `CHANGELOG.md` has no `## [<version>] - YYYY-MM-DD` heading, or has it twice.

It also runs the script tests and `shellcheck`, and does a packaging dry run:
a full build, the packager, and a sign-and-verify with a throwaway key, so
problems in that machinery show up on the PR rather than after the merge.

On GitHub Free, a **private** repository cannot use branch protection or
rulesets, so the check reports but cannot block a merge. `release.yml`
re-validates the same things, so a bad merge fails loudly and never produces a
release. On a public repo or a paid plan, mark **Release readiness** as a
required check ([server-setup.md](server-setup.md), step 2).

## What `release.yml` does

Triggered by a push to `master`, or by hand ("Run workflow", see below).
Runs are serialized (`concurrency: release`).

1. **plan**: reads the version; exits as a no-op if the tag exists. Otherwise
   re-checks the CHANGELOG and lockfile, requires the version to be greater
   than the newest existing `v*` tag, and fails early, pointing at
   [server-setup.md](server-setup.md), if the `RELEASE_SIGNING_KEY` secret is
   empty or `deploy/allowed_signers` still holds the placeholder.
2. **checks**: lint, unit tests, integration tests, server tests (the same
   reusable workflows PRs run) plus the script tests.
3. **build**: `npm ci`, then `REACT_APP_SYNC_API_HOST=same-origin npm run build`
   and `npm run build:server`, then `scripts/release/package-release.sh`. The
   archive is reproducible (sorted entries, fixed timestamps, `gzip -n`).
4. **publish** (the only job with `contents: write`): signs `SHA256SUMS` with
   the secret key, then **verifies that signature against the committed
   `deploy/allowed_signers`**: if they disagree, no box could verify the
   release, so it fails there. It then creates a draft release with the three
   assets and publishes it, which is the moment the tag appears.

Assets: `expenses-manager-<version>.tar.gz`, `SHA256SUMS`, `SHA256SUMS.sig`.

## Fixing a bad release

**Ship a new version. Never delete, move or re-create a tag or release, and
never edit a published one.** Boxes and people may already have verified and
deployed it; rewriting history breaks that trust. Bump the patch version, fix
forward, merge. If a box is already running the bad version, roll it back with
`sudo deploy-expenses-manager rollback` while the fix is on its way
([operating.md](operating.md)).

## Retrying a failed run

If a run failed for a configuration reason (missing secret, placeholder key),
fix that, then Actions → **Release** → **Run workflow** on `master`. Re-running
is safe: a version that already has a tag is a no-op, and a draft release left
behind by a failed publish (drafts have no tag) is replaced.

## Where to look

- Runs: the repository's **Actions** tab (workflows *Release* and *Release
  readiness*); each successful run writes a summary with the deploy command.
- Releases: the repository's **Releases** page.
