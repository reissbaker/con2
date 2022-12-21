#!/bin/bash

set -exuo pipefail

node_modules/.bin/ohm generateBundles --withTypes ./grammar/ohm-grammar.ohm
mkdir -p ./build/grammar
cp ./grammar/ohm-grammar.ohm-bundle.js ./build/grammar/ohm-grammar.ohm-bundle.js
