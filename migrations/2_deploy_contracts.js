// ============ Contracts ============

// Token & migration
const YAMv2 = artifacts.require("YAMv2");
const YAMv2Migration = artifacts.require("YAMv2Migration");

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([
    deployToken(deployer, network),
  ]);
};

module.exports = migration;

// ============ Deploy Functions ============


async function deployToken(deployer, network) {
  await deployer.deploy(YAMv2Migration);
  await deployer.deploy(YAMv2,
    "YAMv2",
    "YAMv2",
    YAMv2Migration.address
  );
  migrationContract = await YAMv2Migration.deployed();
  await migrationContract.setV2Address(YAMv2.address);
}
