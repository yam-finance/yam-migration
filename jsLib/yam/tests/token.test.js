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
    let startTime = await yam.contracts.yamV2migration.methods.startTime().call();
    let timeNow = yam.toBigN((await yam.web3.eth.getBlock('latest'))["timestamp"]);
    let waitTime = yam.toBigN(startTime).minus(timeNow);
    if (waitTime > 0) {
      await yam.testing.increaseTime(waitTime);
    }
    await yam.contracts.yamV2migration.methods.migrate().send({from: yam_deployer});
  });

  beforeEach(async () => {
    await yam.testing.resetEVM("0x2");

  });

  describe("expected fail", () => {
    test("cant transfer from a 0 balance", async () => {
      await yam.testing.expectThrow(yam.contracts.yamV2.methods.transfer(user, "100").send({from: yam_deployer}), "ERC20: transfer amount exceeds balance");
    });
    test("cant transferFrom without allowance", async () => {
      await yam.testing.expectThrow(yam.contracts.yamV2.methods.transferFrom(user, new_user, "100").send({from: yam_deployer}), "ERC20: transfer amount exceeds allowance");
    });
    test("!minter", async () => {
      await yam.testing.expectThrow(yam.contracts.yamV2.methods.mint(user, "100").send({from: yam_deployer}), "!minter");
    });
  });

  describe("non-failing", () => {
    test("name", async () => {
      let name = await yam.contracts.yamV2.methods.name().call();
      expect(name).toBe("YAMv2");
    });
    test("symbol", async () => {
      let symbol = await yam.contracts.yamV2.methods.symbol().call();
      expect(symbol).toBe("YAMv2");
    });
    test("decimals", async () => {
      let decimals = await yam.contracts.yamV2.methods.decimals().call();
      expect(decimals).toBe("24");
    });
    test("totalSupply", async () => {
      let ts = await yam.contracts.yamV2.methods.totalSupply().call();
      expect(ts).toBe("0");
    });
    test("transfer to self doesnt inflate", async () => {
      let bal0 = await yam.contracts.yamV2.methods.balanceOf(yam_deployer).call();
      await yam.contracts.yamV2.methods.transfer(yam_deployer, "100").send({from: yam_deployer});
      let bal1 = await yam.contracts.yamV2.methods.balanceOf(yam_deployer).call();
      expect(bal0).toBe(bal1);
    });
    test("transferFrom works", async () => {
      let bal00 = await yam.contracts.yamV2.methods.balanceOf(yam_deployer).call();
      let bal01 = await yam.contracts.yamV2.methods.balanceOf(new_user).call();
      await yam.contracts.yamV2.methods.approve(new_user, "100").send({from: user});
      await yam.contracts.yamV2.methods.transferFrom(yam_deployer, new_user, "100").send({from: new_user});
      let bal10 = await yam.contracts.yamV2.methods.balanceOf(yam_deployer).call();
      let bal11 = await yam.contracts.yamV2.methods.balanceOf(new_user).call();
      expect((yam.toBigN(bal01).plus(yam.toBigN(100))).toString()).toBe(bal11);
      expect((yam.toBigN(bal00).minus(yam.toBigN(100))).toString()).toBe(bal10);
    });
    test("approve", async () => {
      await yam.contracts.yamV2.methods.approve(new_user, "100").send({from: yam_deployer});
      let allowance = await yam.contracts.yamV2.methods.allowance(yam_deployer, new_user).call();
      expect(allowance).toBe("100")
    });
    test("increaseAllowance", async () => {
      await yam.contracts.yamV2.methods.increaseAllowance(new_user, "100").send({from: yam_deployer});
      let allowance = await yam.contracts.yamV2.methods.allowance(yam_deployer, new_user).call();
      expect(allowance).toBe("100")
    });
    test("decreaseAllowance", async () => {
      await yam.contracts.yamV2.methods.increaseAllowance(new_user, "100").send({from: yam_deployer});
      let allowance = await yam.contracts.yamV2.methods.allowance(yam_deployer, new_user).call();
      expect(allowance).toBe("100")
      await yam.contracts.yamV2.methods.decreaseAllowance(new_user, "100").send({from: yam_deployer});
      allowance = await yam.contracts.yamV2.methods.allowance(yam_deployer, new_user).call();
      expect(allowance).toBe("0")
    });
    test("decreaseAllowance from 0", async () => {
      await yam.contracts.yamV2.methods.decreaseAllowance(new_user, "100").send({from: yam_deployer});
      let allowance = await yam.contracts.yamV2.methods.allowance(yam_deployer, new_user).call();
      expect(allowance).toBe("0")
    });
  })

})
