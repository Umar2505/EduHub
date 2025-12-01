# 🚀 Render Deployment Guide

## Project Structure
```
EduHub/
├── backend/          # Django API
│   └── Dockerfile
└── frontend/        # React Frontend
    └── Dockerfile
```

## Backend Service Configuration

### Service Settings:
- **Name**: `eduhub-backend` (or any name you prefer)
- **Environment**: `Docker`
- **Region**: Choose closest to your users
- **Branch**: `main` (or your default branch)
- **Root Directory**: `backend`
- **Dockerfile Path**: `Dockerfile` (leave default, Render finds it automatically)

### Build & Deploy:
- **Build Command**: (Leave empty - Docker handles it)
- **Start Command**: (Leave empty - Docker CMD handles it)

### Environment Variables:
```bash
SECRET_KEY=your-random-secret-key-here
DEBUG=False
DATABASE_URL=postgresql://... (auto-provided by Render PostgreSQL)
ALLOWED_HOSTS=eduhub-backend.onrender.com
CORS_ALLOWED_ORIGINS=https://your-frontend-url.netlify.app
TIMEZONE=Asia/Tashkent
```

### Database:
- Add PostgreSQL database (Render can add it automatically)
- Database URL will be provided as `DATABASE_URL` environment variable

---

## Frontend Service Configuration

### Service Settings:
- **Name**: `eduhub-frontend` (or any name you prefer)
- **Environment**: `Docker`
- **Region**: Choose closest to your users
- **Branch**: `main` (or your default branch)
- **Root Directory**: `frontend`
- **Dockerfile Path**: `Dockerfile` (leave default)

### Build & Deploy:
- **Build Command**: (Leave empty - Docker handles it)
- **Start Command**: (Leave empty - Docker CMD handles it)

### Environment Variables:
```bash
VITE_API_URL=https://your-backend.onrender.com/api
```

---

## Step-by-Step Deployment

### 1. Deploy Backend

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `eduhub-backend`
   - **Root Directory**: `backend`
   - **Dockerfile Path**: `Dockerfile`
   - **Environment**: `Docker`
5. Click **"Add Database"** → **"PostgreSQL"**
6. Add environment variables (see above)
7. Click **"Create Web Service"**

### 2. Deploy Frontend

1. Click **"New +"** → **"Web Service"**
2. Connect the same GitHub repository
3. Configure:
   - **Name**: `eduhub-frontend`
   - **Root Directory**: `frontend`
   - **Dockerfile Path**: `Dockerfile`
   - **Environment**: `Docker`
4. Add environment variables (see above)
5. Click **"Create Web Service"**

### 3. Update CORS

After backend deploys, update `CORS_ALLOWED_ORIGINS` with your frontend URL:
```
CORS_ALLOWED_ORIGINS=https://eduhub-frontend.onrender.com
```

### 4. Run Migrations

1. Go to backend service → **"Shell"**
2. Run:
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```

---

## Important Notes

### Root Directory:
- **Backend**: `backend` - This tells Render to run commands from the `backend/` folder
- **Frontend**: `frontend` - This tells Render to run commands from the `frontend/` folder

### Dockerfile Path:
- Leave as default `Dockerfile` 
- Render automatically looks for `Dockerfile` in the Root Directory
- So for backend: `backend/Dockerfile`
- For frontend: `frontend/Dockerfile`

### Auto-Deploy:
- Render watches the Root Directory for changes
- Changes outside Root Directory won't trigger auto-deploy
- This is perfect for monorepos!

---

## Troubleshooting

### Build Fails:
- Check Root Directory is correct
- Verify Dockerfile exists in that directory
- Check build logs for specific errors

### Database Connection Error:
- Ensure `DATABASE_URL` is set (auto-provided by Render)
- Check database is running
- Verify migrations ran successfully

### CORS Errors:
- Update `CORS_ALLOWED_ORIGINS` with exact frontend URL
- Include protocol (`https://`)
- No trailing slash

### Static Files Not Loading:
- Backend uses WhiteNoise (already configured)
- Frontend assets are served by Vite

---

## Cost

- **Free Tier**: 
  - 750 hours/month free
  - Services spin down after 15 min inactivity
  - PostgreSQL: 90 days free trial
- **Paid**: $7/month per service (always on)

---

## Alternative: Frontend on Netlify

If you prefer, deploy frontend to Netlify (free, always on):

1. Go to [Netlify](https://netlify.com)
2. Connect GitHub repo
3. Settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
   - **Environment variable**: `VITE_API_URL=https://your-backend.onrender.com/api`

This gives you:
- ✅ Always-on frontend (free)
- ✅ Better performance
- ✅ Free SSL
- ✅ Custom domains

