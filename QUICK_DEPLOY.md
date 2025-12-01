# Quick Deployment Guide - EduHub

## 🚀 Fastest Way to Deploy (15 minutes)

### Step 1: Deploy Backend to Railway (5 min)

1. Go to [railway.app](https://railway.app) and sign up
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository
4. Railway will detect it's a Django app
5. Add a **PostgreSQL** database:
   - Click **"New"** → **"Database"** → **"PostgreSQL"**
6. In your backend service, go to **Variables** and add:
   ```
   SECRET_KEY=generate-a-random-secret-key-here
   DEBUG=False
   DATABASE_URL=postgresql://... (Railway auto-provides this)
   ALLOWED_HOSTS=your-app.railway.app
   ```
7. Railway will auto-deploy! Get your backend URL (e.g., `https://eduhub-production.railway.app`)

### Step 2: Deploy Frontend to Netlify (5 min)

1. Go to [netlify.com](https://netlify.com) and sign up
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your GitHub repository
4. Configure:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Add environment variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-backend-url.railway.app/api`
6. Click **"Deploy site"**!

### Step 3: Update CORS (2 min)

1. Go back to Railway backend
2. Add to Variables:
   ```
   CORS_ALLOWED_ORIGINS=https://your-app.netlify.app
   ```
3. Redeploy backend

### Step 4: Create Admin User (3 min)

1. In Railway, click on your backend service
2. Click **"Deployments"** → **"View Logs"**
3. Click **"Shell"** tab
4. Run:
   ```bash
   python manage.py createsuperuser
   ```
5. Enter username, email, and password

## ✅ Done!

Your app is now live at:
- Frontend: `https://your-app.netlify.app`
- Backend API: `https://your-backend.railway.app/api`

## 📝 Important Notes

1. **Free Tier Limits**:
   - Netlify: 100GB bandwidth/month (usually enough)
   - Railway: $5/month after free trial (or use Render free tier)

2. **Alternative Free Backend**: Use [Render.com](https://render.com) instead of Railway for a free tier

3. **Custom Domain**: Both Netlify and Railway support custom domains

4. **Environment Variables**: Never commit `.env` files to GitHub!

## 🆘 Troubleshooting

**Frontend can't connect to backend?**
- Check `VITE_API_URL` in Netlify environment variables
- Verify CORS settings in Railway
- Make sure backend URL doesn't have trailing slash

**Database errors?**
- Check `DATABASE_URL` is set correctly
- Run migrations: `python manage.py migrate`

**Static files not loading?**
- Run: `python manage.py collectstatic --noinput`

Need more details? See `DEPLOYMENT.md` for comprehensive guide.

