# Deployment Guide for EduHub

This guide will help you deploy EduHub to production so you can share it with others.

## Overview

EduHub consists of:
- **Frontend**: React app (deploy to Netlify/Vercel)
- **Backend**: Django REST API (deploy to Railway/Render)
- **Database**: PostgreSQL (included with backend hosting)

## Option 1: Quick Deploy with Railway (Recommended)

Railway can host both backend and database together.

### Step 1: Deploy Backend to Railway

1. **Sign up at [Railway.app](https://railway.app)**

2. **Create a New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo" (or upload your code)

3. **Add PostgreSQL Database**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will provide connection details

4. **Deploy Backend**
   - Click "New" → "GitHub Repo" → Select your repo
   - Select the `backend` folder
   - Railway will auto-detect Django

5. **Configure Environment Variables**
   Add these in Railway's Variables tab:
   ```
   SECRET_KEY=your-super-secret-key-here-generate-random-string
   DEBUG=False
   DATABASE_URL=postgresql://user:pass@host:port/dbname (Railway provides this)
   ALLOWED_HOSTS=your-backend-url.railway.app
   CORS_ALLOWED_ORIGINS=https://your-frontend.netlify.app
   ```

6. **Add Build Command**
   In Railway settings, add:
   ```
   pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --noinput
   ```

7. **Add Start Command**
   ```
   gunicorn eduhub.wsgi:application --bind 0.0.0.0:$PORT
   ```

8. **Get Your Backend URL**
   - Railway will provide a URL like: `https://your-app.railway.app`
   - Your API will be at: `https://your-app.railway.app/api`

### Step 2: Deploy Frontend to Netlify

1. **Sign up at [Netlify.com](https://netlify.com)**

2. **Build Your Frontend Locally First**
   ```bash
   cd frontend
   npm run build
   ```

3. **Deploy to Netlify**
   - Option A: Drag & Drop
     - Go to Netlify dashboard
     - Drag the `frontend/dist` folder to deploy
   
   - Option B: Git Integration (Recommended)
     - Connect your GitHub repo
     - Base directory: `frontend`
     - Build command: `npm run build`
     - Publish directory: `dist`

4. **Configure Environment Variables**
   In Netlify → Site settings → Environment variables:
   ```
   VITE_API_URL=https://your-backend-url.railway.app/api
   ```

5. **Get Your Frontend URL**
   - Netlify will provide: `https://your-app.netlify.app`

### Step 3: Update CORS Settings

In Railway backend environment variables, update:
```
CORS_ALLOWED_ORIGINS=https://your-app.netlify.app
```

## Option 2: Deploy with Render

### Backend on Render

1. **Sign up at [Render.com](https://render.com)**

2. **Create PostgreSQL Database**
   - New → PostgreSQL
   - Copy the Internal Database URL

3. **Create Web Service**
   - New → Web Service
   - Connect your GitHub repo
   - Settings:
     - **Build Command**: `pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --noinput`
     - **Start Command**: `gunicorn eduhub.wsgi:application --bind 0.0.0.0:$PORT`
     - **Environment**: Python 3

4. **Environment Variables**
   ```
   SECRET_KEY=your-secret-key
   DEBUG=False
   DATABASE_URL=postgresql://... (from Render PostgreSQL)
   ALLOWED_HOSTS=your-app.onrender.com
   CORS_ALLOWED_ORIGINS=https://your-app.netlify.app
   ```

### Frontend on Netlify

Same as Option 1, Step 2.

## Required Files for Deployment

### 1. Backend: `requirements.txt` (Update if needed)

Make sure it includes:
```
gunicorn
whitenoise
psycopg2-binary
```

### 2. Backend: `Procfile` (for Heroku/Railway)

Create `backend/Procfile`:
```
web: gunicorn eduhub.wsgi:application --bind 0.0.0.0:$PORT
```

### 3. Backend: `runtime.txt` (optional)

Create `backend/runtime.txt`:
```
python-3.11.0
```

### 4. Frontend: `netlify.toml`

Create `frontend/netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Post-Deployment Checklist

- [ ] Backend is accessible at `https://your-backend-url/api/`
- [ ] Frontend is accessible at `https://your-frontend-url.netlify.app`
- [ ] CORS is configured correctly
- [ ] Database migrations are run
- [ ] Static files are collected
- [ ] Environment variables are set
- [ ] Create a superuser account: `python manage.py createsuperuser`

## Creating Superuser on Production

1. **Railway**: Use Railway's CLI or one-off command
2. **Render**: Use Render Shell
3. **Or**: Add a management command to create superuser automatically

## Troubleshooting

### CORS Errors
- Make sure `CORS_ALLOWED_ORIGINS` includes your frontend URL
- Check that URLs don't have trailing slashes

### Database Connection
- Verify `DATABASE_URL` is correct
- Check that migrations ran successfully

### Static Files Not Loading
- Run `python manage.py collectstatic --noinput`
- Ensure `STATIC_ROOT` is set in settings

### Frontend Can't Connect to Backend
- Verify `VITE_API_URL` is set correctly
- Check that backend URL is accessible
- Ensure CORS is configured

## Security Notes

1. **Never commit `.env` files**
2. **Use strong `SECRET_KEY`** in production
3. **Set `DEBUG=False`** in production
4. **Use HTTPS** (both Netlify and Railway provide this)
5. **Keep dependencies updated**

## Cost Estimate

- **Netlify**: Free tier (100GB bandwidth)
- **Railway**: $5/month (after free trial)
- **Render**: Free tier available (with limitations)

## Need Help?

- Railway Docs: https://docs.railway.app
- Netlify Docs: https://docs.netlify.com
- Render Docs: https://render.com/docs

