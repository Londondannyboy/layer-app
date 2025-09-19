# Vercel Setup Instructions for Layer App

## Environment Variables to Add in Vercel

When importing the project, you MUST add these environment variables in Vercel's dashboard:

### Variable 1:
**Name:** `EXPO_PUBLIC_SUPABASE_URL`
**Value:** 
```
https://amnayqupnmyvghjxbuvf.supabase.co
```

### Variable 2:
**Name:** `EXPO_PUBLIC_SUPABASE_ANON_KEY`
**Value:** 
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbmF5cXVwbm15dmdoanhidXZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcyOTM2NDAsImV4cCI6MjA1Mjg2OTY0MH0.LrFUzC_9pELiksaJJYT4ZA_ht7wRxiH
```

## Step-by-Step Instructions:

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select **Londondannyboy/layer-app**
4. **IMPORTANT:** Before clicking "Deploy", click "Environment Variables"
5. Add both variables above (copy and paste exactly)
6. Click "Deploy"

## If You Get Errors:

The error "supabase_url not found" means the environment variables aren't set. You need to:
1. Go to Project Settings → Environment Variables
2. Add both variables
3. Redeploy

## Quick Deploy Command (Alternative):

If you want to deploy from command line with variables already set:
```bash
cd ~/layer-app
npx vercel --prod
```

When prompted for environment variables, paste the values above.