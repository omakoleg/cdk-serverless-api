#!/usr/bin/env bash
set -euo pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

$DIR/clean.sh

yarn install --frozen-lockfile
yarn build
yarn format
yarn test
