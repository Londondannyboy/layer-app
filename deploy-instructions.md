# Deploy Layer App Instructions

## Step 1: Push to GitHub

1. Go to https://github.com/new
2. Create a new repository called "layer-app"
3. Make it Public
4. DON'T initialize with README (we already have one)
5. Click "Create repository"
6. Then run these commands:

```bash
git remote add origin https://github.com/YOUR_USERNAME/layer-app.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Vercel

Run this command and follow the prompts:

```bash
npx vercel --yes
```

This will:
- Link to your GitHub repo
- Deploy automatically
- Give you a public URL

## Step 3: Configure Vercel Environment Variables

After deployment, go to your Vercel dashboard and add these environment variables:
- EXPO_PUBLIC_SUPABASE_URL = https://amnayqupnmyvghjxbuvf.supabase.co
- EXPO_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbmF5cXVwbm15dmdoanhidXZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcyOTM2NDAsImV4cCI6MjA1Mjg2OTY0MH0.LrFUzC_9pELiksaJJYT4ZA_ht7wRxiH