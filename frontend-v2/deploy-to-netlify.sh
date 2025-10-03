#!/bin/bash

echo "🚀 NETLIFY DEPLOYMENT SCRIPT"
echo "==========================="
echo ""

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI not found. Please install it first:"
    echo "   npm install -g netlify-cli"
    exit 1
fi

echo "✅ Netlify CLI found"
echo ""

# Check if dist folder exists
if [ ! -d "dist" ]; then
    echo "❌ dist folder not found. Building first..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ Build failed"
        exit 1
    fi
fi

echo "✅ Build files ready"
echo ""

# Check if site is linked
if ! netlify status &> /dev/null; then
    echo "🔗 Linking to Netlify site..."
    echo "Please select your team and site when prompted:"
    netlify link
    if [ $? -ne 0 ]; then
        echo "❌ Failed to link site"
        exit 1
    fi
fi

echo "✅ Site linked"
echo ""

# Deploy to production
echo "🚀 Deploying to production..."
netlify deploy --prod --dir=dist

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 DEPLOYMENT SUCCESSFUL!"
    echo "========================="
    echo "Your site is now live on Netlify!"
    echo ""
    echo "To get the URL, run: netlify open"
else
    echo "❌ Deployment failed"
    exit 1
fi
