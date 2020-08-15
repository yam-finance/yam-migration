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
