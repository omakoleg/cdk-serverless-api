#!/usr/bin/env bash
set -euo pipefail

rm -Rf ./cdk.out
rm -f {bin,lib,test}/*.js

rm -f src/lambda-*/*.js
rm -f src/lambda-*/tests/*.js
rm -f src/shared/**/*.js
rm -f test/cdk/*.js
rm -f test/src/*.js
rm -f test/**/*.js
rm -f test/**/**/*.js
