import { ethers } from "ethers";

const providerA = new ethers.JsonRpcProvider("http://localhost:8545");
const providerB = new ethers.JsonRpcProvider("http://localhost:8546");

async function compareBlocks(n) {
  const blockA = await providerA.getBlock(n);
  const blockB = await providerB.getBlock(n);

  console.log(`🔍 Comparing Block ${n}`);
  console.log("VM-A:", blockA.hash);
  console.log("VM-B:", blockB.hash);

  if (blockA.hash === blockB.hash) {
    console.log("✅ Blocks match — ledger consistent");
  } else {
    console.log("❌ MISMATCH detected — possible tampering or reorg");
  }
}

for (let i = 0; i < 5; i++) {
  compareBlocks(i).catch(console.error);
}
