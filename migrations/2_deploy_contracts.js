const LEGACY_REP_CONTRACT_ADDRESS = require('../lib/constants').LEGACY_REP_CONTRACT_ADDRESS

const RepToken = artifacts.require('RepToken')
const LegacyRepToken = artifacts.require('LegacyRepToken')

async function deploy(deployer) {
  if (process.env.EXPECTED_NETWORK_ID === '1' || process.env.EXPECTED_NETWORK_ID === '4') {
    await deployer.deploy(RepToken, LEGACY_REP_CONTRACT_ADDRESS)
  } else {
    await deployer.deploy(LegacyRepToken)
    const legacy = await LegacyRepToken.deployed()
    await deployer.deploy(RepToken, legacy.address)
  }
}

module.exports = function (deployer) {
  deploy(deployer).catch(console.error)
}
