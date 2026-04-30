#!/bin/zsh

set -euo pipefail

script_path=${0:A}
script_dir=${script_path:h}
repo_root_candidate=${script_dir:h:h:h:h:h}

show_alert() {
  /usr/bin/osascript - "$1" "$2" <<'APPLESCRIPT'
on run argv
	display alert (item 1 of argv) message (item 2 of argv) as critical buttons {"OK"} default button "OK"
end run
APPLESCRIPT
}

resolve_inti_bin() {
  if [[ -n "${INTI_BIN:-}" && -x "${INTI_BIN}" ]]; then
    echo "${INTI_BIN}"
    return 0
  fi

  local local_bin="${HOME}/.local/bin/inti"
  if [[ -x "${local_bin}" ]]; then
    echo "${local_bin}"
    return 0
  fi

  local usr_local_bin="/usr/local/bin/inti"
  if [[ -x "${usr_local_bin}" ]]; then
    echo "${usr_local_bin}"
    return 0
  fi

  local homebrew_bin="/opt/homebrew/bin/inti"
  if [[ -x "${homebrew_bin}" ]]; then
    echo "${homebrew_bin}"
    return 0
  fi

  if command -v inti >/dev/null 2>&1; then
    command -v inti
    return 0
  fi

  local repo_bin="${repo_root_candidate}/inti"
  if [[ -x "${repo_bin}" ]]; then
    echo "${repo_bin}"
    return 0
  fi

  return 1
}

run_inti_pdf() {
  local pdf_path="$1"
  local output_dir="${pdf_path:r}"

  if inti_bin="$(resolve_inti_bin)"; then
    "${inti_bin}" pdf "${pdf_path}" --output "${output_dir}"
    return
  fi

  if [[ -f "${repo_root_candidate}/go.mod" ]] && command -v go >/dev/null 2>&1; then
    (
      cd "${repo_root_candidate}"
      go run . pdf "${pdf_path}" --output "${output_dir}"
    )
    return
  fi

  show_alert "Inti PDF to Images failed" "Install the inti binary on your PATH, set INTI_BIN, or run the Quick Action from a built repo checkout."
  exit 1
}

if [[ "$#" -eq 0 ]]; then
  show_alert "Inti PDF to Images failed" "No PDF files were provided to the Quick Action."
  exit 1
fi

for pdf_path in "$@"; do
  if [[ ! -f "${pdf_path}" ]]; then
    show_alert "Inti PDF to Images failed" "Selected file does not exist:\n${pdf_path}"
    exit 1
  fi

  if [[ "${pdf_path:e:l}" != "pdf" ]]; then
    show_alert "Inti PDF to Images failed" "Quick Action only accepts PDF files:\n${pdf_path}"
    exit 1
  fi

  if ! run_inti_pdf "${pdf_path}"; then
    show_alert "Inti PDF to Images failed" "Conversion failed for:\n${pdf_path}"
    exit 1
  fi
done
