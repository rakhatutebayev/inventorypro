#!/bin/bash

echo "🚀 Starting Frontend..."

cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "🌐 Starting Vite dev server..."
npm run dev


