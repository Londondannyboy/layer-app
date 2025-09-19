#!/bin/bash

# GitHub deployment status checker
echo "🔍 Checking Layer App Deployment Status..."
echo "========================================="

# Check GitHub Actions
echo -e "\n📊 GitHub Actions Status:"
curl -s -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/Londondannyboy/layer-app/actions/runs \
  | jq -r '.workflow_runs[0] | "Workflow: \(.name)\nStatus: \(.status)\nConclusion: \(.conclusion // "pending")"' 2>/dev/null || \
  echo "Unable to fetch GitHub Actions status"

# Check Vercel deployment  
echo -e "\n🚀 Vercel Deployment:"
echo "Check at: https://vercel.com/londondannyboys-projects/layer-app"

# Check if site is live
echo -e "\n🌐 Site Status:"
response=$(curl -s -o /dev/null -w "%{http_code}" https://layer-app.vercel.app)
if [ "$response" == "200" ]; then
  echo "✅ Site is LIVE at https://layer-app.vercel.app"
else
  echo "⏳ Site not accessible yet (HTTP $response)"
fi

echo -e "\n📝 Latest commits:"
git log --oneline -5