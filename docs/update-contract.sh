#!/bin/bash

# FarmSync - Update Smart Contract Workflow
# This script compiles, deploys, and updates ABI automatically

set -e  # Exit on error

echo "🚀 FarmSync - Smart Contract Update Workflow"
echo "=============================================="
echo ""

# Step 1: Compile contract
echo "📦 Step 1: Compiling smart contract..."
cd blockchain
npx hardhat compile
echo "✅ Compilation successful!"
echo ""

# Step 2: Deploy contract
echo "🌐 Step 2: Deploying to localhost network..."
DEPLOY_OUTPUT=$(npx hardhat run scripts/deploy.js --network localhost)
echo "$DEPLOY_OUTPUT"

# Extract contract address
CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep "Contract deployed to:" | awk '{print $4}')
echo ""
echo "📝 Contract Address: $CONTRACT_ADDRESS"
echo ""

# Step 3: Update ABI
echo "🔄 Step 3: Updating ABI in middleware..."
node scripts/updateABI.js
echo ""

# Step 4: Update .env
echo "⚙️  Step 4: Updating CONTRACT_ADDRESS in middleware/.env..."
cd ../middleware
sed -i "s/^CONTRACT_ADDRESS=.*/CONTRACT_ADDRESS=$CONTRACT_ADDRESS/" .env
echo "✅ .env updated with new contract address"
echo ""

# Done
echo "✨ All done! Next steps:"
echo "   1. Restart middleware: cd middleware && npm start"
echo "   2. Test with manual publisher: cd mqtt && npm run manual"
echo ""
