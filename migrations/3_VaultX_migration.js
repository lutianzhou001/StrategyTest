const VaultX = artifacts.require("VaultX");
const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const INITIAL_STRATEGY = '0x1399483E3fb66DB8F7932B83856cAB6DDBD70f12'

module.exports = function (deployer) {
  deployer.deploy(VaultX, WETH_ADDRESS, INITIAL_STRATEGY);
};