import {
  Yam
} from "../index.js";
import * as Types from "../lib/types.js";
import {
  addressMap
} from "../lib/constants.js";
import {
  decimalToString,
  stringToDecimal
} from "../lib/Helpers.js"


export const yam = new Yam(
  "http://localhost:8545/",
  // "http://127.0.0.1:9545/",
  "1001",
  true, {
    defaultAccount: "",
    defaultConfirmations: 1,
    autoGasMultiplier: 1.5,
    testing: false,
    defaultGas: "6000000",
    defaultGasPrice: "1000000000000",
    accounts: [],
    ethereumNodeTimeout: 10000
  }
)
const oneEther = 10 ** 18;

describe("token_tests", () => {
  let snapshotId;
  let user;
  let new_user;
  let yam_deployer = "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84";
  beforeAll(async () => {
    const accounts = await yam.web3.eth.getAccounts();
    yam.addAccount(accounts[0]);
    user = accounts[0];
    new_user = accounts[1];
    snapshotId = await yam.testing.snapshot();
  });

  beforeEach(async () => {
    await yam.testing.resetEVM("0x2");

    // fast forward to startTime
    let startTime = await yam.contracts.yamV2migration.methods.startTime().call();
    let timeNow = yam.toBigN((await yam.web3.eth.getBlock('latest'))["timestamp"]);
    let waitTime = yam.toBigN(startTime).minus(timeNow);
    if (waitTime > 0) {
      await yam.testing.increaseTime(waitTime);
    }
  });

  describe("expected fail", () => {
    test("user 0 balance", async () => {
      await yam.testing.expectThrow(await yam.contracts.yamV2migration.methods.migrate().send({from: new_user}), "No yams");
    });
    test("before start", async () => {
      await yam.testing.resetEVM("0x2");

      await yam.testing.expectThrow(await yam.contracts.yamV2migration.methods.migrate().send({from: new_user}), "!started");
    });
    test("after end", async () => {
      let startTime = await yam.contracts.yamV2migration.methods.startTime().call();
      let migrationDuration = await yam.contracts.yamV2migration.methods.migrationDuration().call();

      let timeNow = yam.toBigN((await yam.web3.eth.getBlock('latest'))["timestamp"]);

      let waitTime = yam.toBigN(startTime).plus(yam.toBigN(migrationDuration)).minus(timeNow);
      if (waitTime > 0) {
        await yam.testing.increaseTime(waitTime);
      }
      await yam.testing.expectThrow(await yam.contracts.yamV2migration.methods.migrate().send({from: new_user}), "migration ended");
    });
  });

  describe("non-failing", () => {
    test("zeros balance", async () => {
      await yam.contracts.yamV2migration.methods.migrate().send({from: yam_deployer});
      let yam_bal = yam.toBigN(await yam.contracts.yam.methods.balanceOf().call()).toNumber();
      expect(yam_bal).toBe(0);
    });
    test("new balance equal to old balance", async () => {
      let yam_bal = yam.toBigN(await yam.contracts.yam.methods.balanceOfUnderlying().call());
      await yam.contracts.yamV2migration.methods.migrate().send({from: yam_deployer});
      let yamV2_bal = yam.toBigN(await yam.contracts.yamV2.methods.balanceOf().call()).toNumber();
      expect(yam_bal).toBe(yamV2_bal);
    });
  });
});
