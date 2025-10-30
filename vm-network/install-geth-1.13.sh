#!/bin/bash

# Install Geth 1.13.15 - Last version with full Clique PoA support without Beacon client

echo "=========================================="
echo "  Installing Geth 1.13.15 for Clique PoA"
echo "=========================================="

# Check if already installed
CURRENT_VERSION=$(geth version 2>/dev/null | grep "Version:" | awk '{print $2}')
if [ "$CURRENT_VERSION" == "1.13.15-stable" ]; then
    echo "✓ Geth 1.13.15 already installed"
    exit 0
fi

echo "Current Geth version: $CURRENT_VERSION"
echo "Downloading Geth 1.13.15..."

# Download Geth 1.13.15
cd /tmp
wget -q https://gethstore.blob.core.windows.net/builds/geth-linux-amd64-1.13.15-c5ba367e.tar.gz

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to download Geth 1.13.15"
    exit 1
fi

echo "Extracting..."
tar -xzf geth-linux-amd64-1.13.15-c5ba367e.tar.gz

echo "Installing to /usr/local/bin..."
sudo mv geth-linux-amd64-1.13.15-c5ba367e/geth /usr/local/bin/geth-1.13
sudo chmod +x /usr/local/bin/geth-1.13

# Create symlink
sudo ln -sf /usr/local/bin/geth-1.13 /usr/local/bin/geth

echo "Cleaning up..."
rm -rf geth-linux-amd64-1.13.15-c5ba367e*

# Verify installation
NEW_VERSION=$(geth version 2>/dev/null | grep "Version:" | awk '{print $2}')
echo ""
echo "=========================================="
echo "✓ Geth installed successfully!"
echo "Version: $NEW_VERSION"
echo "Path: $(which geth)"
echo "=========================================="
