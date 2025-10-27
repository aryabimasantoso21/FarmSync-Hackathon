const hre = require("hardhat");
require('dotenv').config();

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  
  if (!contractAddress) {
    console.error("❌ CONTRACT_ADDRESS not set in .env file");
    process.exit(1);
  }

  console.log("🔍 Querying SensorLedger contract at:", contractAddress);
  console.log("");

  const SensorLedger = await hre.ethers.getContractAt("SensorLedger", contractAddress);
  
  // Get total records
  const totalRecords = await SensorLedger.getTotalRecords();
  console.log("📊 Total Records:", totalRecords.toString());
  console.log("");

  if (totalRecords === 0n) {
    console.log("ℹ️  No records found yet. Start the sensor publisher to add data.");
    return;
  }

  // Query all records
  for (let i = 1; i <= totalRecords; i++) {
    const record = await SensorLedger.getRecord(i);
    const isValid = await SensorLedger.verifyDataIntegrity(i);
    
    console.log(`📝 Record #${i}:`);
    console.log("   Sensor ID:", record[0]);
    console.log("   Weight:", record[1].toString(), "kg");
    console.log("   Quality:", record[2].toString());
    console.log("   Timestamp:", new Date(Number(record[3]) * 1000).toISOString());
    console.log("   Data Hash:", record[4]);
    console.log("   ✅ Integrity:", isValid ? "VALID" : "INVALID");
    console.log("");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Query failed:", error);
    process.exit(1);
  });
