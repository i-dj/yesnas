#!/usr/bin/env bash
set -Eeuo pipefail

REPO="${YESNAS_WEB_REPO:-i-dj/yesnas-web}"
VERSION="${YESNAS_WEB_VERSION:-latest}"
INSTALL_DIR="${YESNAS_WEB_INSTALL_DIR:-/opt/yesnas-web}"
SERVICE_NAME="${YESNAS_WEB_SERVICE_NAME:-yesnas-web}"
STEP=0
TOTAL_STEPS=6

log() { printf '\033[1;32m[YesNAS Web]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[YesNAS Web][WARN]\033[0m %s\n' "$*" >&2; }
fail() { printf '\033[1;31m[YesNAS Web][ERROR]\033[0m %s\n' "$*" >&2; exit 1; }
step() { STEP=$((STEP + 1)); printf '\n\033[1;34m[%02d/%02d]\033[0m %s\n' "$STEP" "$TOTAL_STEPS" "$*"; }
run_root() { if [[ "$EUID" -eq 0 ]]; then "$@"; else sudo "$@"; fi; }
resolve_release_urls() {
  local api_url
  if [[ "$VERSION" == "latest" ]]; then api_url="https://api.github.com/repos/$REPO/releases/latest"; else api_url="https://api.github.com/repos/$REPO/releases/tags/$VERSION"; fi
  curl -fsSL --retry 3 "$api_url" | python3 -c '
import json, sys
release = json.load(sys.stdin)
assets = release.get("assets", [])
archives = [a for a in assets if a.get("name", "").endswith(".tar.gz") and not a.get("name", "").endswith(".sha256")]
preferred = [a for a in archives if a.get("name", "").startswith("yesnas-web")]
if not (preferred or archives): raise SystemExit("Release does not contain a .tar.gz asset")
archive = (preferred or archives)[0]
checksum = next((a for a in assets if a.get("name") == archive["name"] + ".sha256"), None)
print(archive["browser_download_url"])
print(checksum["browser_download_url"] if checksum else "")
'
}

main() {
  step "Check installation"
  [[ -d "$INSTALL_DIR" ]] || fail "Install directory not found: $INSTALL_DIR"
  command -v curl >/dev/null && command -v tar >/dev/null && command -v sha256sum >/dev/null && command -v python3 >/dev/null || fail "curl, tar, sha256sum and python3 are required."
  if [[ "$EUID" -ne 0 ]]; then command -v sudo >/dev/null || fail "sudo is required."; sudo -v; fi

  step "Download release"
  local tmp_dir archive expected_sha archive_url checksum_url asset_name
  tmp_dir="$(mktemp -d)"
  trap 'rm -rf "${tmp_dir:-}"' EXIT
  mapfile -t release_urls < <(resolve_release_urls)
  archive_url="${release_urls[0]:-}"
  checksum_url="${release_urls[1]:-}"
  [[ -n "$archive_url" ]] || fail "No release archive was found."
  asset_name="${archive_url##*/}"
  archive="$tmp_dir/$asset_name"
  log "Downloading: $asset_name"
  curl -fL --retry 3 --retry-delay 2 -o "$archive" "$archive_url"
  if [[ -n "$checksum_url" ]] && curl -fL --retry 3 --retry-delay 2 -o "$archive.sha256" "$checksum_url"; then
    expected_sha="$(awk '{print $1; exit}' "$archive.sha256")"
    printf '%s  %s\n' "$expected_sha" "$archive" | sha256sum -c -
  else
    warn "Checksum file was not found; verification was skipped."
  fi

  step "Prepare upgraded files"
  mkdir -p "$tmp_dir/package"
  tar -xzf "$archive" -C "$tmp_dir/package"
  [[ -f "$tmp_dir/package/server.js" ]] || fail "Release package does not contain server.js."
  local service_file="/etc/systemd/system/$SERVICE_NAME.service" install_user install_group
  install_user="$(awk -F= '/^User=/{print $2; exit}' "$service_file")"
  install_group="$(awk -F= '/^Group=/{print $2; exit}' "$service_file")"
  install_user="${install_user:-root}"
  install_group="${install_group:-root}"
  run_root rm -rf "$INSTALL_DIR.next"
  run_root mkdir -p "$INSTALL_DIR.next"
  run_root cp -a "$tmp_dir/package/." "$INSTALL_DIR.next/"
  run_root chown -R "$install_user:$install_group" "$INSTALL_DIR.next"

  step "Stop service and switch release"
  run_root systemctl stop "$SERVICE_NAME"
  run_root rm -rf "$INSTALL_DIR.previous"
  run_root mv "$INSTALL_DIR" "$INSTALL_DIR.previous"
  run_root mv "$INSTALL_DIR.next" "$INSTALL_DIR"

  step "Start upgraded service"
  if ! run_root systemctl restart "$SERVICE_NAME" || ! sleep 2 || ! run_root systemctl is-active --quiet "$SERVICE_NAME"; then
    warn "Upgrade failed; restoring previous release."
    run_root systemctl stop "$SERVICE_NAME" || true
    run_root rm -rf "$INSTALL_DIR"
    run_root mv "$INSTALL_DIR.previous" "$INSTALL_DIR"
    run_root systemctl restart "$SERVICE_NAME" || true
    fail "Upgrade failed and the previous release was restored."
  fi

  step "Upgrade completed"
  log "Backup: $INSTALL_DIR.previous"
  log "Status: systemctl status $SERVICE_NAME"
  log "Logs: journalctl -u $SERVICE_NAME -f"
}

main "$@"
