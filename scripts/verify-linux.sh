#!/usr/bin/env bash
# Run from a disposable checkout, as a non-root user. Never use a live release.
set -euo pipefail
umask 077
cd "$(dirname "$0")/.."
if [[ $(id -u) -eq 0 ]]; then
  echo 'Run verification as a non-root user.' >&2
  exit 1
fi
if [[ $(uname -s) != Linux || $(uname -m) != x86_64 ]]; then
  echo 'This verification script supports Linux x64 only.' >&2
  exit 1
fi
for file in .env .env.local .env.production .env.production.local; do
  if [[ -e $file ]]; then
    echo 'Refusing checkout with runtime environment files.' >&2
    exit 1
  fi
done
for tool in curl tar sha256sum unzip; do command -v "$tool" >/dev/null; done
version=$(tr -d '\r\n' < .nvmrc)
version=${version#v}
[[ $version =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]
runtime=$(mktemp -d "${TMPDIR:-/tmp}/chia-node-XXXXXXXX")
trap 'rm -rf -- "$runtime"' EXIT
archive="node-v${version}-linux-x64.tar.xz"
curl --fail --silent --show-error --location "https://nodejs.org/dist/v${version}/${archive}" -o "$runtime/$archive"
curl --fail --silent --show-error --location "https://nodejs.org/dist/v${version}/SHASUMS256.txt" -o "$runtime/SHASUMS256.txt"
(cd "$runtime"; grep "  ${archive}$" SHASUMS256.txt | sha256sum --check --strict)
tar -xJf "$runtime/$archive" -C "$runtime"
export PATH="$runtime/node-v${version}-linux-x64/bin:$PATH"
export NEXT_TELEMETRY_DISABLED=1
printf 'Release: '; git rev-parse HEAD
node --version
npm --version
npm ci
npm run setup:backend
npm audit --audit-level=high
npm run lint
npm test
if [[ -n ${REDIS_TEST_BINARY:-} ]]; then
  npm run test:redis
else
  echo 'Real Redis integration not run: supply REDIS_TEST_BINARY to enable it.'
fi
npm run build:check
echo 'Linux verification passed. Synthetic build only; do not deploy this output.'
