#!/usr/bin/env bash
set -Eeuo pipefail

INSTALL_DIR="${YESNAS_WEB_INSTALL_DIR:-/opt/yesnas-web}"
CONFIG_DIR="${YESNAS_WEB_CONFIG_DIR:-/etc/yesnas-web}"
SERVICE_NAME="${YESNAS_WEB_SERVICE_NAME:-yesnas-web}"
STEP=0
TOTAL_STEPS=5

log() { printf '\033[1;32m[YesNAS Web]\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31m[YesNAS Web][ERROR]\033[0m %s\n' "$*" >&2; exit 1; }
step() { STEP=$((STEP + 1)); printf '\n\033[1;34m[%02d/%02d]\033[0m %s\n' "$STEP" "$TOTAL_STEPS" "$*"; }
run_root() { if [[ "$EUID" -eq 0 ]]; then "$@"; else sudo "$@"; fi; }
confirm() { local value=""; [[ -r /dev/tty ]] && read -r -p "$1 " value </dev/tty || true; [[ "$value" == "$2" ]]; }

main() {
  step "Check system environment"
  if [[ "$EUID" -ne 0 ]]; then command -v sudo >/dev/null || fail "sudo is required."; sudo -v; fi
  if [[ "${YESNAS_NONINTERACTIVE:-0}" != "1" ]]; then
    confirm "This removes YesNAS Web and its configuration. Type YESNAS-WEB to continue:" "YESNAS-WEB" || fail "Uninstall cancelled."
  else
    log "Non-interactive uninstall enabled."
  fi

  step "Stop and disable service"
  run_root systemctl stop "$SERVICE_NAME" 2>/dev/null || true
  run_root systemctl disable "$SERVICE_NAME" >/dev/null 2>&1 || true

  step "Remove systemd service"
  run_root rm -f "/etc/systemd/system/$SERVICE_NAME.service"
  run_root systemctl daemon-reload
  run_root systemctl reset-failed >/dev/null 2>&1 || true

  step "Remove application files"
  run_root rm -rf "$INSTALL_DIR" "$INSTALL_DIR.previous" "$INSTALL_DIR.next" "$CONFIG_DIR"

  step "Uninstall completed"
  log "Removed service: $SERVICE_NAME"
  log "Removed install directory: $INSTALL_DIR"
  log "Node.js and shared system packages were kept."
}

main "$@"
