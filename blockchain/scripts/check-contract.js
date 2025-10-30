const hre = require("hardhat");

async function main() {
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  console.log("🔍 Checking contract state on 3-node Geth network...");
  console.log("Contract:", contractAddress);
  console.log("");

  const SensorLedger = await hre.ethers.getContractFactory("SensorLedger");
  const contract = SensorLedger.attach(contractAddress);

  // Get total records
  const totalRecords = await contract.getTotalRecords();
  console.log("📊 Total Records:", totalRecords.toString());

  if (totalRecords > 0) {
    console.log("\n📋 Recent Records:");
    for (let i = 0; i < totalRecords && i < 5; i++) {
      const record = await contract.getRecord(i);
      console.log(`\nRecord #${i}:`);
      console.log("  Truck ID:", record.truckId);
      console.log("  Event Type:", record.eventType);
      console.log("  Weight:", record.weight.toString(), "kg");
      console.log("  Estate ID:", record.estateId);
      console.log("  Timestamp:", new Date(Number(record.timestamp) * 1000).toISOString());
      console.log("  Block:", record.blockNumber.toString());
    }
  }

  // Get current block
  const blockNumber = await hre.ethers.provider.getBlockNumber();
  console.log("\n⛓️  Current block number:", blockNumber);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
