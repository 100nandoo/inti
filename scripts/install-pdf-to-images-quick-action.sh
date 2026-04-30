#!/bin/zsh

set -euo pipefail

script_path=${0:A}
repo_root=${script_path:h:h}
source_bin="${repo_root}/inti"
workflow_source="${repo_root}/extras/macos/Inti PDF to Images.workflow"
workflow_target_dir="${HOME}/Library/Services"
workflow_target="${workflow_target_dir}/Inti PDF to Images.workflow"
local_bin_dir="${HOME}/.local/bin"
local_bin_link="${local_bin_dir}/inti"

if [[ ! -x "${source_bin}" ]]; then
  echo "error: ${source_bin} does not exist or is not executable" >&2
  echo "build it first with: go build -o inti ." >&2
  exit 1
fi

if [[ ! -d "${workflow_source}" ]]; then
  echo "error: missing workflow bundle at ${workflow_source}" >&2
  exit 1
fi

mkdir -p "${local_bin_dir}"
ln -sf "${source_bin}" "${local_bin_link}"

resolved_path="$(readlink "${local_bin_link}" 2>/dev/null || true)"
if [[ "${resolved_path}" != "${source_bin}" ]]; then
  echo "error: failed to create symlink at ${local_bin_link}" >&2
  exit 1
fi

mkdir -p "${workflow_target_dir}"
rm -rf "${workflow_target}"
cp -R "${workflow_source}" "${workflow_target_dir}/"

if [[ ! -d "${workflow_target}" ]]; then
  echo "error: failed to install workflow at ${workflow_target}" >&2
  exit 1
fi

cat <<EOF
installed Inti PDF to Images:
  workflow: ${workflow_target}
  binary:   ${local_bin_link} -> ${source_bin}

next:
  1. Ensure \$HOME/.local/bin is on your PATH.
  2. Open a new shell or run: source ~/.zshrc && hash -r
  3. In Finder, right-click a PDF and use Quick Actions -> Inti PDF to Images.
  4. If Finder does not show it yet, run: killall Finder
EOF
