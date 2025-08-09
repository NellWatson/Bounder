#!/bin/bash

echo "🚀 Setting up Slana Email Auto-CSV Server"
echo "========================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if installation was successful
if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 How to use:"
echo "1. Start the email server:"
echo "   npm start"
echo ""
echo "2. (Optional) Auto-commit to Git when emails are added:"
echo "   npm run watch"
echo ""
echo "3. Your website will now automatically save emails to subscribers.csv"
echo ""
echo "📁 Emails will be saved to: $(pwd)/subscribers.csv"
echo "🌐 Server will run on: http://localhost:3001"