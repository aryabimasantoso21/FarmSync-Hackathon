const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying SensorLedger contract...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  const SensorLedger = await hre.ethers.getContractFactory("SensorLedger");
  
  console.log("Sending deployment transaction...");
  const sensorLedger = await SensorLedger.deploy();
  
  console.log("Transaction hash:", sensorLedger.deploymentTransaction().hash);
  console.log("Waiting for deployment (this may take time for first block)...");
  
  await sensorLedger.waitForDeployment();

  const contractAddress = await sensorLedger.getAddress();

  console.log("✅ SensorLedger deployed to:", contractAddress);
  console.log("\n📝 Save this address to your .env file:");
  console.log(`CONTRACT_ADDRESS=${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
