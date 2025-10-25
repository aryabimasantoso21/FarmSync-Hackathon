import { ethers } from "ethers";
const provider = new ethers.JsonRpcProvider("http://localhost:8545");

async function inspectBlock(n) {
  const block = await provider.getBlock(n, true);
  console.log(JSON.stringify(block, null, 2));
}

inspectBlock(process.argv[2] || 0);
