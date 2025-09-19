#!/bin/bash

echo "🚀 Layer App - GitHub Push Setup"
echo "================================"
echo ""
echo "Please enter your GitHub username:"
read GITHUB_USERNAME

echo ""
echo "Setting up remote repository..."
git remote add origin https://github.com/$GITHUB_USERNAME/layer-app.git

echo "Setting main as default branch..."
git branch -M main

echo ""
echo "Pushing to GitHub..."
git push -u origin main

echo ""
echo "✅ Done! Your Layer app is now on GitHub at:"
echo "https://github.com/$GITHUB_USERNAME/layer-app"
echo ""
echo "Next steps:"
echo "1. Go to https://vercel.com/new"
echo "2. Import your GitHub repository"
echo "3. Add the environment variables from .env"
echo "4. Deploy!"