#!/usr/bin/env bash
set -Eeuo pipefail

REPO="${YESNAS_WEB_REPO:-i-dj/yesnas}"
VERSION="${YESNAS_WEB_VERSION:-latest}"
INSTALL_DIR="${YESNAS_WEB_INSTALL_DIR:-/opt/yesnas-web}"
CONFIG_DIR="${YESNAS_WEB_CONFIG_DIR:-/etc/yesnas-web}"
SERVICE_NAME="${YESNAS_WEB_SERVICE_NAME:-yesnas-web}"
PORT="${YESNAS_WEB_PORT:-23000}"
HOST="${YESNAS_WEB_HOST:-0.0.0.0}"
STEP=0
TOTAL_STEPS=9

log() { printf '\033[1;32m[YesNAS Web]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[YesNAS Web][WARN]\033[0m %s\n' "$*" >&2; }
fail() { printf '\033[1;31m[YesNAS Web][ERROR]\033[0m %s\n' "$*" >&2; exit 1; }
step() { STEP=$((STEP + 1)); printf '\n\033[1;34m[%02d/%02d]\033[0m %s\n' "$STEP" "$TOTAL_STEPS" "$*"; }
run_root() { if [[ "$EUID" -eq 0 ]]; then "$@"; else sudo "$@"; fi; }
run_as_user() { if [[ "$EUID" -eq 0 ]]; then runuser -u "$1" -- "${@:2}"; else sudo -u "$1" -- "${@:2}"; fi; }
require_command() { command -v "$1" >/dev/null 2>&1 || fail "Missing command: $1"; }

install_pnpm() {
  local pnpm_arch
  case "$(uname -m)" in
    x86_64|amd64) pnpm_arch="x64" ;;
    aarch64|arm64) pnpm_arch="arm64" ;;
    *) fail "Unsupported architecture for pnpm: $(uname -m)" ;;
  esac
  local tmp_pnpm
  tmp_pnpm="$(mktemp)"
  curl -fL --retry 3 --retry-delay 2 \
    -o "$tmp_pnpm" \
    "https://github.com/pnpm/pnpm/releases/latest/download/pnpm-linux-$pnpm_arch"
  run_root install -m 0755 "$tmp_pnpm" /usr/local/bin/pnpm
  rm -f "$tmp_pnpm"
}

resolve_release_urls() {
  local api_url
  if [[ "$VERSION" == "latest" ]]; then
    api_url="https://api.github.com/repos/$REPO/releases/latest"
  else
    api_url="https://api.github.com/repos/$REPO/releases/tags/$VERSION"
  fi
  curl -fsSL --retry 3 "$api_url" | python3 -c '
import json, sys
release = json.load(sys.stdin)
assets = release.get("assets", [])
archives = [a for a in assets if a.get("name", "").endswith(".tar.gz") and not a.get("name", "").endswith(".sha256")]
preferred = [a for a in archives if a.get("name", "").startswith("yesnas-")]
if not (preferred or archives):
    raise SystemExit("Release does not contain a .tar.gz asset")
archive = (preferred or archives)[0]
checksum_name = archive["name"] + ".sha256"
checksum = next((a for a in assets if a.get("name") == checksum_name), None)
print(archive["browser_download_url"])
print(checksum["browser_download_url"] if checksum else "")
'
}

prompt_value() {
  local prompt="$1" default="$2" value=""
  if [[ "${YESNAS_NONINTERACTIVE:-0}" == "1" ]]; then
    printf '%s\n' "$default"
    return
  fi
  if [[ -r /dev/tty ]]; then
    read -r -p "${prompt} [${default}]: " value </dev/tty || true
  else
    warn "No interactive terminal detected; using default for ${prompt}: ${default}"
  fi
  printf '%s\n' "${value:-$default}"
}

main() {
  step "Check system environment"
  require_command curl
  require_command tar
  require_command sha256sum
  if ! command -v apt-get >/dev/null 2>&1; then fail "Only Debian/Ubuntu systems with apt-get are supported."; fi
  if [[ "$EUID" -ne 0 ]]; then require_command sudo; sudo -v; fi

  local detected_user="${SUDO_USER:-$(id -un)}"
  [[ "$detected_user" == "root" ]] && detected_user="www-data"
  local install_user install_group
  install_user="$(prompt_value "Enter the Linux user that will run YesNAS Web" "${YESNAS_WEB_USER:-$detected_user}")"
  id "$install_user" >/dev/null 2>&1 || fail "User '$install_user' does not exist."
  install_group="$(id -gn "$install_user")"

  step "Install runtime dependencies"
  export DEBIAN_FRONTEND=noninteractive
  run_root apt-get update
  run_root apt-get install -y ca-certificates curl tar gzip nodejs python3 util-linux
  local node_major
  node_major="$(node -p 'Number(process.versions.node.split(".")[0])' 2>/dev/null || echo 0)"
  [[ "$node_major" -ge 20 ]] || fail "Node.js 20 or newer is required. Install a current Node.js LTS release and rerun this script."
  if ! command -v pnpm >/dev/null 2>&1; then install_pnpm; fi

  step "Create application directories"
  run_root mkdir -p "$INSTALL_DIR" "$CONFIG_DIR"
  run_root chown -R "$install_user:$install_group" "$INSTALL_DIR"

  step "Download release"
  local tmp_dir archive archive_url checksum_url asset_name
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
    local expected_sha
    expected_sha="$(awk '{print $1; exit}' "$archive.sha256")"
    printf '%s  %s\n' "$expected_sha" "$archive" | sha256sum -c -
  else
    warn "Checksum file was not found; verification was skipped."
  fi

  step "Install application files"
  run_root rm -rf "$INSTALL_DIR.next"
  mkdir -p "$tmp_dir/package"
  tar -xzf "$archive" -C "$tmp_dir/package"
  if [[ ! -f "$tmp_dir/package/server.js" && ! -f "$tmp_dir/package/package.json" ]]; then
    fail "Release package must contain server.js or package.json."
  fi
  run_root mkdir -p "$INSTALL_DIR.next"
  run_root cp -a "$tmp_dir/package/." "$INSTALL_DIR.next/"
  run_root chown -R "$install_user:$install_group" "$INSTALL_DIR.next"
  if [[ ! -f "$INSTALL_DIR.next/server.js" ]]; then
    [[ -d "$INSTALL_DIR.next/.next" ]] || fail "Release package does not contain a production .next build."
    run_as_user "$install_user" pnpm --dir "$INSTALL_DIR.next" install --prod --frozen-lockfile
  fi
  if [[ -d "$INSTALL_DIR" ]]; then run_root rm -rf "$INSTALL_DIR.previous"; run_root mv "$INSTALL_DIR" "$INSTALL_DIR.previous"; fi
  run_root mv "$INSTALL_DIR.next" "$INSTALL_DIR"

  step "Create environment configuration"
  cat <<EOF | run_root tee "$CONFIG_DIR/yesnas-web.env" >/dev/null
NODE_ENV=production
HOSTNAME=$HOST
PORT=$PORT
EOF
  run_root chmod 0640 "$CONFIG_DIR/yesnas-web.env"
  run_root chown "root:$install_group" "$CONFIG_DIR/yesnas-web.env"

  step "Create systemd service"
  local node_path
  node_path="$(command -v node)"
  local exec_start="$node_path $INSTALL_DIR/server.js"
  if [[ ! -f "$INSTALL_DIR/server.js" ]]; then
    exec_start="$node_path $INSTALL_DIR/node_modules/next/dist/bin/next start"
  fi
  cat <<EOF | run_root tee "/etc/systemd/system/$SERVICE_NAME.service" >/dev/null
[Unit]
Description=YesNAS Web
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$install_user
Group=$install_group
WorkingDirectory=$INSTALL_DIR
EnvironmentFile=$CONFIG_DIR/yesnas-web.env
ExecStart=$exec_start
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF
  run_root systemctl daemon-reload
  run_root systemctl enable "$SERVICE_NAME" >/dev/null

  step "Start service"
  run_root systemctl restart "$SERVICE_NAME"
  sleep 2
  if ! run_root systemctl is-active --quiet "$SERVICE_NAME"; then
    run_root systemctl status "$SERVICE_NAME" --no-pager || true
    fail "YesNAS Web failed to start."
  fi

  step "Installation completed"
  local ip_addr
  ip_addr="$(hostname -I 2>/dev/null | awk '{print $1}')"
  log "Open: http://${ip_addr:-localhost}:$PORT"
  log "Install directory: $INSTALL_DIR"
  log "Config directory: $CONFIG_DIR"
  log "Default username: admin"
  log "Default password: admin"
  warn "Change the default password immediately after your first sign-in."
  log "Status: systemctl status $SERVICE_NAME"
  log "Logs: journalctl -u $SERVICE_NAME -f"
}

main "$@"
