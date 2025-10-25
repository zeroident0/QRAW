# 🚀 ClassPass Deployment Guide

## Free Hosting Options (No Credit Card Required)

### Option 1: Render (Recommended)
**Best for**: Full-stack apps with backend
- ✅ No credit card required
- ✅ 512 MB RAM, 0.1 CPU
- ✅ Auto-deployment from GitHub
- ✅ Free HTTPS & custom domains
- ⚠️ Apps sleep after 15 minutes of inactivity

### Option 2: Cyclic
**Best for**: Always-on applications
- ✅ No credit card required
- ✅ 512 MB RAM, 1 vCPU
- ✅ No sleep mode (always running)
- ✅ Unlimited requests

### Option 3: Vercel + Cyclic
**Best for**: Maximum performance
- Frontend on Vercel (React)
- Backend on Cyclic (Node.js)

## 🚀 Deploy to Render (Step-by-Step)

### Prerequisites
- GitHub account
- Render account (free)

### Step 1: Prepare Your Repository
1. Push your code to GitHub
2. Make sure all files are committed

### Step 2: Deploy to Render
1. Go to [render.com](https://render.com)
2. Sign up with GitHub (no credit card required)
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure settings:
   - **Name**: `classpass-attendance`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: `Free`

### Step 3: Environment Variables
Add these in Render dashboard:
- `NODE_ENV` = `production`
- `PORT` = `10000`

### Step 4: Deploy
1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Your app will be live at: `https://your-app-name.onrender.com`

## 🔧 Alternative: Deploy to Cyclic

### Step 1: Prepare for Cyclic
1. Go to [cyclic.sh](https://cyclic.sh)
2. Sign up with GitHub
3. Connect your repository

### Step 2: Configure
- **Framework**: Node.js
- **Start Command**: `node server.js`
- **Build Command**: `npm install`

### Step 3: Deploy
1. Click "Deploy Now"
2. Your app will be live at: `https://your-app-name.cyclic.app`

## 🌐 Deploy Frontend to Vercel (Optional)

### Step 1: Prepare Frontend
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Import your repository

### Step 2: Configure
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Step 3: Environment Variables
- `VITE_SERVER_URL` = `https://your-backend-url.onrender.com`

## 📋 Pre-Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] All dependencies in package.json
- [ ] Environment variables configured
- [ ] Build command works locally
- [ ] Server serves static files correctly

## 🐛 Troubleshooting

### Common Issues:
1. **Build Fails**: Check package.json scripts
2. **App Won't Start**: Verify start command
3. **Static Files Not Loading**: Check express.static path
4. **Socket.IO Issues**: Ensure CORS is configured

### Debug Commands
```bash
# Test locally
npm run build
npm start

# Check if server serves static files
curl http://localhost:3001
```

## 🔒 Security Notes

- Free tiers have resource limitations
- Apps may sleep after inactivity
- Consider upgrading for production use
- Always use HTTPS in production

## 📞 Support

If you encounter issues:
1. Check Render/Cyclic logs
2. Verify environment variables
3. Test locally first
4. Check GitHub repository permissions

---

**Happy Deploying! 🎉**