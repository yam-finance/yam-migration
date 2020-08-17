# YAM migration


## Tests

Using node @ 10.16.0:
```
$ nvm use 10.16.0
$ npm install
```

Running tests:
```
$ sh ./scripts/startBlockchain.sh
```

In another terminal:
```
$ truffle migrate --network test
$ cd jsLib
$ jest token
$ jest migration
```
## Dapp-test

Install Nix and dapptools:
```
$ curl -L https://nixos.org/nix/install > nix.sh
$ nix-env -iA dapp hevm -f https://github.com/dapphub/dapptools/tarball/master -v
```

Running tests:
```
$ export ETH_RPC_URL=http://localhost:8545 # mainnet node
$ ./scripts/dapp-test.sh
```

Will run 7 different tests for each user address present in the delegators list
