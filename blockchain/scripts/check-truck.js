const hre = require("hardhat");

async function main() {
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const truckId = process.argv[2] || "TRK-00001";
  
  console.log("🔍 Checking truck status on blockchain...");
  console.log("Contract:", contractAddress);
  console.log("Truck ID:", truckId);
  console.log("");

  const SensorLedger = await hre.ethers.getContractFactory("SensorLedger");
  const contract = SensorLedger.attach(contractAddress);

  try {
    const shipment = await contract.getShipment(truckId);
    
    console.log("📦 Shipment Details:");
    console.log("  Truck ID:", shipment.truckId);
    console.log("  Estate ID:", shipment.estateId);
    console.log("  Seller:", shipment.seller);
    console.log("  Buyer:", shipment.buyer);
    console.log("  Departure Weight:", shipment.departureWeight.toString(), "kg");
    console.log("  Arrival Weight:", shipment.arrivalWeight.toString(), "kg");
    console.log("  Departed:", shipment.departed ? "✅ Yes" : "❌ No");
    console.log("  Arrived:", shipment.arrived ? "✅ Yes" : "❌ No");
    console.log("  Paid:", shipment.paid ? "✅ Yes" : "❌ No");
    console.log("");
    
    if (shipment.departed && !shipment.arrived) {
      console.log("⚠️  STATUS: Truck is in transit (TAP-1 done, waiting for TAP-2)");
      console.log("📍 Next action: Send TAP-2 arrival event");
    } else if (shipment.arrived && !shipment.paid) {
      console.log("⚠️  STATUS: Truck arrived, waiting for payment");
      console.log("💰 Next action: Payment will be processed automatically");
    } else if (shipment.paid) {
      console.log("✅ STATUS: Shipment completed and paid");
      console.log("♻️  Truck is now available for reuse");
    } else {
      console.log("🆕 STATUS: No shipment data (new truck)");
    }
    
  } catch (error) {
    if (error.message.includes("No shipment found")) {
      console.log("🆕 No shipment found for this truck ID");
      console.log("✅ Truck is available for first use");
    } else {
      console.error("❌ Error:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
