#!/usr/bin/env bash
set -euo pipefail

yarn run cdk deploy "*" --require-approval never
