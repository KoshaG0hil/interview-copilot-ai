#!/bin/bash
echo "========================================================"
echo "  Launching Interview Copilot AI (Stealth HUD & Hub)"
echo "========================================================"
echo ""

if [ ! -d "node_modules" ]; then
    echo "[INFO] Installing dependencies..."
    npm install
fi

if [ ! -f "dist-electron/main.js" ]; then
    echo "[INFO] Compiling desktop app..."
    npm run build
fi

echo "[INFO] Starting application..."
npm run electron:dev
