#!/bin/bash

# Runs the parity node
ABI="$(cat ./target/json/SmartContract.json)"
CONTRACT="$(xxd -p -c 100000000 ./target/pwasm_contract.wasm)"

cat > ./src/js/deploy/resources.mjs <<-EOF
export const ABI = $ABI;
export const CODE_HEX = '0x$CONTRACT';
EOF
