# 🔑 Get Your Supabase Credentials

## Step-by-Step Guide

### 1. Go to Supabase
- Visit: https://supabase.com
- Click "Start your project"

### 2. Sign Up
- Click "Sign up with GitHub"
- No credit card required!

### 3. Create Project
- Click "New Project"
- Name: `classpass-attendance`
- Database Password: (choose strong password)
- Region: (choose closest to you)
- Click "Create new project"

### 4. Wait for Setup
- Takes 2-3 minutes
- You'll see a progress bar

### 5. Get Credentials
- Go to: Settings → API (left sidebar)
- Copy these two values:

```
Project URL: https://your-project-ref.supabase.co
anon public: your-anon-key
```

### 6. Create .env File
- Copy `env-example.txt` to `.env`
- Replace the values:

```env
VITE_SUPABASE_URL=https://your-actual-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key
```

### 7. Setup Database
- Go to: SQL Editor (left sidebar)
- Copy contents of `supabase-schema.sql`
- Paste and click "Run"

### 8. Test Your App
```bash
npm run dev
```

## 🎯 What You'll Get

Your credentials will look like:
- **URL**: `https://abcdefghijklmnop.supabase.co`
- **Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNDU2Nzg5MCwiZXhwIjoxOTUwMTQzODkwfQ.example-signature`

## 🚨 Important Notes

- **Save your database password** - you'll need it later
- **Keep your API key secure** - don't share it publicly
- **The URL is unique** to your project
- **Free tier** has generous limits

## ✅ Success Indicators

- Project shows "Active" status
- You can see the database tables
- Your app connects without errors
- Real-time features work

## 🆘 Need Help?

- Check Supabase documentation
- Verify your .env file format
- Make sure database schema ran successfully
- Test connection in browser console
