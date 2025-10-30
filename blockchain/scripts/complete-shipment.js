const hre = require("hardhat");

async function main() {
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const truckId = "TRK-00001";
  const pricePerKg = hre.ethers.parseEther("0.001"); // 0.001 ETH per kg
  
  // Use Mill 1 account (buyer) to release payment
  const mill1PrivateKey = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
  const provider = new hre.ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const mill1Wallet = new hre.ethers.Wallet(mill1PrivateKey, provider);
  
  console.log("💰 Manually releasing payment for completed shipment...");
  console.log("Contract:", contractAddress);
  console.log("Truck ID:", truckId);
  console.log("Paying from (Mill 1):", mill1Wallet.address);
  console.log("");

  const SensorLedger = await hre.ethers.getContractFactory("SensorLedger");
  const contract = SensorLedger.attach(contractAddress).connect(mill1Wallet);

  // Get shipment details
  const shipment = await contract.getShipment(truckId);
  
  console.log("📦 Shipment Details:");
  console.log("  Arrival Weight:", shipment.arrivalWeight.toString(), "kg");
  console.log("  Seller:", shipment.seller);
  console.log("  Buyer:", shipment.buyer);
  console.log("  Already Paid:", shipment.paid ? "Yes" : "No");
  console.log("");

  if (shipment.paid) {
    console.log("✅ Payment already completed!");
    return;
  }

  if (!shipment.arrived) {
    console.log("❌ Cannot pay - truck hasn't arrived yet!");
    return;
  }

  // Calculate payment
  const paymentAmount = shipment.arrivalWeight * pricePerKg;
  console.log("💸 Payment amount:", hre.ethers.formatEther(paymentAmount), "ETH");
  console.log("");

  // Release payment
  console.log("⏳ Sending payment transaction...");
  const tx = await contract.releasePayment(truckId, pricePerKg, {
    value: paymentAmount
  });
  
  console.log("Transaction hash:", tx.hash);
  console.log("Waiting for confirmation...");
  
  const receipt = await tx.wait();
  
  console.log("✅ Payment successful!");
  console.log("Block number:", receipt.blockNumber);
  console.log("");
  console.log("🎉 Shipment completed! TRK-00001 is now available for reuse ♻️");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error.message);
    process.exit(1);
  });
