# YAM migration


## Tests

Using node @ 12.0.0:
```
$ nvm use 12.0.0
$ npm install
```

Running tests:
```
$ sh ./scripts/startBlockchain.sh
```

In another terminal:
```
$ truffle migrate --network test
$ cd yam
$ jest token
$ jest migration
```
