const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying SensorLedger contract...");

  const SensorLedger = await hre.ethers.getContractFactory("SensorLedger");
  const sensorLedger = await SensorLedger.deploy();

  await sensorLedger.waitForDeployment();

  const contractAddress = await sensorLedger.getAddress();

  console.log("✅ SensorLedger deployed to:", contractAddress);
  console.log("\n📝 Save this address to your .env file:");
  console.log(`CONTRACT_ADDRESS=${contractAddress}`);
  
  // Wait for a few block confirmations
  console.log("\n⏳ Waiting for block confirmations...");
  await sensorLedger.deploymentTransaction().wait(3);
  
  console.log("✅ Deployment confirmed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
