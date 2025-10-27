#!/usr/bin/env node

/**
 * Update ABI in middleware after contract changes
 * Usage: node scripts/updateABI.js
 */

const fs = require('fs');
const path = require('path');

// Paths
const artifactPath = path.join(__dirname, '../artifacts/contracts/SensorLedger.sol/SensorLedger.json');
const middlewareIndexPath = path.join(__dirname, '../../middleware/index.js');

console.log('🔄 Updating ABI in middleware...\n');

try {
  // Read contract artifact
  console.log('📖 Reading contract artifact...');
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const abi = artifact.abi;
  
  console.log('✅ ABI loaded from:', artifactPath);
  console.log('   Functions count:', abi.filter(item => item.type === 'function').length);
  console.log('   Events count:', abi.filter(item => item.type === 'event').length);
  
  // Read middleware index.js
  console.log('\n📖 Reading middleware index.js...');
  let middlewareContent = fs.readFileSync(middlewareIndexPath, 'utf8');
  
  // Find and replace ABI
  const abiRegex = /const CONTRACT_ABI = \[[\s\S]*?\];/;
  const newAbiString = `const CONTRACT_ABI = ${JSON.stringify(abi, null, 2)};`;
  
  if (abiRegex.test(middlewareContent)) {
    middlewareContent = middlewareContent.replace(abiRegex, newAbiString);
    
    // Write back
    fs.writeFileSync(middlewareIndexPath, middlewareContent, 'utf8');
    
    console.log('✅ ABI updated in:', middlewareIndexPath);
    console.log('\n✨ Done! Please restart middleware:');
    console.log('   cd middleware && npm start');
  } else {
    console.error('❌ Could not find CONTRACT_ABI in middleware/index.js');
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
