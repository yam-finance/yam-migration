#!/usr/bin/env bash
set -e

oops() {
    echo "$0:" "$@" >&2
    exit 1
}

[[ "$ETH_RPC_URL" ]] || oops "Please set a mainnet ETH_RPC_URL envar (such as http://localhost:8545)"

export DAPP_SRC=./contracts
export DAPP_SOLC_VERSION=0.6.12
export SOLC_FLAGS="--optimize --optimize-runs 50000"

dapp build

export ETH_RPC_URL=http://192.168.1.142:8545

block=$(seth block latest)

export DAPP_TEST_TIMESTAMP=$(seth --field timestamp <<< "$block")
export DAPP_TEST_NUMBER=$(seth --field number <<< "$block")

while IFS="" read -r address || [ -n "$address" ]
do
    export DAPP_TEST_ADDRESS="$address"
    printf 'Running test for address %s\n' "$address"
    LANG=C.UTF-8 hevm dapp-test --rpc="$ETH_RPC_URL" 
done < addresses.txt
