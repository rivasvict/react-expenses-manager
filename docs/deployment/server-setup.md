# One-time setup

Everything you do once, in order. Each step ends with how to check it worked.
The box needs **systemd** (a hard requirement) and runs any distribution that
has it.

## 1. Generate the signing key (on your own machine, not the server)

CI signs every release with a private key; the box trusts the matching public
key. Make the pair on your laptop:

```bash
ssh-keygen -t ed25519 -N "" -C expenses-manager-release -f expenses-manager-release
```

1. Add the **private** file's contents as the repository secret
   `RELEASE_SIGNING_KEY` (Settings → Secrets and variables → Actions → New
   repository secret). Never paste it anywhere else, and never share it.
2. Keep an offline backup of the private key (a password manager is fine), or
   accept that losing it means rotating the key (step 9).
3. Put the **public** key into `deploy/allowed_signers` through a PR, replacing
   the placeholder line:
   ```
   expenses-manager-release namespaces="expenses-manager-release" <contents of expenses-manager-release.pub>
   ```
4. Delete the private key file from disk if you backed it up elsewhere.

*Verify:* the `plan` job of the Release workflow no longer complains about the
secret or the placeholder, and the `publish` job's "Verify the signature"
step passes.

## 2. Make "Release readiness" a required check

On a public repository, or a paid plan: Settings → Rules → Rulesets (or
Branches → branch protection) on `master` → require the status check
**Release readiness** jobs (`version-and-changelog`, `script-tests`,
`package-dry-run`) to pass before merging.

On GitHub Free a **private** repository cannot use rulesets or branch
protection. The check still reports on PRs but cannot block a merge; the
release workflow re-validates, so a bad merge fails loudly and never publishes.

*Verify:* a PR without a version bump shows the check failing and the merge
button blocked.

## 3. Server prerequisites

- **systemd** (`ps -p 1 -o comm=` prints `systemd`).
- **Tailscale** up (`sudo tailscale up`) with **HTTPS certificates** enabled in
  the tailnet admin console (DNS → HTTPS Certificates); see
  [tailscale-sync.md](tailscale-sync.md), step 2.
- Packages: `curl`, `jq`, `tar`, `gzip`, `openssh-client` (OpenSSH 8.1 or newer),
  `util-linux` (for `flock`).

  ```bash
  sudo apt install curl jq tar gzip openssh-client util-linux          # Debian, Ubuntu, Mint
  sudo dnf install curl jq tar gzip openssh-clients util-linux         # Fedora, RHEL
  sudo pacman -S curl jq tar gzip openssh util-linux                   # Arch
  ```

*Verify:* `jq --version && ssh-keygen -Y 2>&1 | head -1 && tailscale status`
all run without "command not found".

## 4. If the repository is private

The box needs a read-only token to download releases.

1. GitHub → Settings → Developer settings → Fine-grained personal access
   tokens → generate one for **only this repository**, permission **Contents:
   read-only**, with an expiry.
2. Save it on the box as `/etc/expenses-manager/github-token` (`0600`, root),
   or pass the file to the installer with `--github-token-file`.
3. Put a calendar reminder at the expiry date. When the token expires the
   deployer says so (HTTP 401) and points back here; renew it and overwrite the
   file.

*Verify:* step 6 downloads the release without a 401 or 404.

## 5. Run the installer once

From your existing clone on the box (it is the bootstrap trust anchor, and Claude
Code's `deploy-server` skill only loads inside a clone, so keep it):

```bash
git pull
sudo TOKEN_SECRET=… ENCRYPTION_KEY=… ./deploy/install-expenses-manager.sh
```

- **Secrets:** use the values your current deployment already uses (wherever
  you keep them today). **Never generate new ones for an existing install**:
  rotating `TOKEN_SECRET` logs everyone out and rotating `ENCRYPTION_KEY` makes
  stored invitations unreadable. Only on a brand-new install with no data does
  the installer offer to generate them, after asking.
- **What it creates:** the `expenses-manager` system user; `/opt/expenses-manager`
  (releases, Node runtimes, the deployer); `/etc/expenses-manager` (env,
  config, trusted key, optional token, all root-only); `/var/lib/expenses-manager`
  (data and backups); the systemd unit (**not enabled**); and the
  `deploy-expenses-manager` command in `/usr/local/bin`.
- **Data migration:** if `server/.data` exists in the clone (from the legacy
  `deploy.sh`) and the new data directory is empty, it stops the legacy
  deployment and **copies** the data across. The old copy stays; delete it when
  you are happy. It never overwrites existing data.
- Safe to re-run: it keeps your env and config, and refreshes the deployer,
  unit, link and trusted key (and says so).

*Verify:* it ends with "Installed" and `ls -l /usr/local/bin/deploy-expenses-manager`
shows the link.

## 6. First deploy

```bash
sudo deploy-expenses-manager latest
sudo deploy-expenses-manager status
```

*Verify:* `status` shows `current` = the version, `service active`, `health ok`,
and the app URL loads on your phone.

## 7. Optional: start on boot

```bash
sudo systemctl enable expenses-manager
```

This contradicts the offline-by-default design (the box would serve as soon as
it boots, though `tailscale serve` config also persists). Skip unless you want
it.

## 8. Optional: Cockpit as a dashboard

Install your distribution's `cockpit` package. It is socket-activated, so it
runs only while you have it open. Keep it off the open network: either bind
`cockpit.socket` to the Tailscale IP (a `ListenStream` drop-in) or firewall port
9090 to `tailscale0`. Then `expenses-manager.service` appears under Services with
start, stop and logs.

## 9. Rotating the signing key

1. Generate a new key pair (step 1).
2. Update the `RELEASE_SIGNING_KEY` secret to the new private key.
3. In a PR, add the new public key to `deploy/allowed_signers` **and keep the old
   line** until every box has the new one. The release workflow verifies with
   the committed file, so it accepts either.
4. On the box: `git pull`, then re-run `sudo ./deploy/install-expenses-manager.sh`
   to refresh `/etc/expenses-manager/allowed_signers`.
5. Once the box has it, a later PR can drop the old line.
