require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    localhost: {
      url: "http://localhost:8545",
      chainId: 31337
    },
    geth_private: {
      url: "http://127.0.0.1:8545",  // VM-A RPC (localhost simulation)
      chainId: 12345,
      accounts: [
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",  // Estate
        "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",  // Mill 1
        "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"   // Mill 2
      ],
      timeout: 120000,
      gasPrice: 20000000000,
      gas: 8000000
    }
  }
};
