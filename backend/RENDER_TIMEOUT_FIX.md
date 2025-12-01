# 🔧 Render Backend Timeout Fix

## Issues Fixed

### 1. **Development Server in Production**
- **Problem**: Dockerfile was using `runserver` (development server)
- **Fix**: Changed to use `gunicorn` (production WSGI server)

### 2. **Missing Database Wait**
- **Problem**: Server started before database was ready
- **Fix**: Added database connection check in `start.sh`

### 3. **Missing Migrations**
- **Problem**: Migrations weren't running automatically
- **Fix**: Added migration step in startup script

### 4. **Static Files Not Collected**
- **Problem**: Static files not collected during build
- **Fix**: Added static file collection in startup script

### 5. **Port Configuration**
- **Problem**: Hardcoded port instead of using Render's PORT env var
- **Fix**: Updated to use `${PORT:-8000}` (defaults to 8000 if not set)

## Files Changed

1. **`Dockerfile`** - Now uses gunicorn and startup script
2. **`start.sh`** - New startup script that:
   - Waits for database
   - Runs migrations
   - Collects static files
   - Starts gunicorn with proper settings

## Render Configuration

### Environment Variables (Required):
```bash
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=your-backend.onrender.com
DATABASE_URL=postgresql://... (auto-provided by Render)
CORS_ALLOWED_ORIGINS=https://your-frontend-url.netlify.app
TIMEZONE=Asia/Tashkent
PORT=8000 (auto-set by Render, don't set manually)
```

### Service Settings:
- **Root Directory**: `backend`
- **Dockerfile Path**: `Dockerfile`
- **Environment**: `Docker`
- **Health Check Path**: `/` (or `/api/`)

## Build Process

The new build process:
1. Builds Docker image
2. On container start:
   - Waits for database (up to 60 seconds)
   - Runs migrations
   - Collects static files
   - Starts gunicorn server

## Gunicorn Configuration

- **Workers**: 2 (good for small-medium traffic)
- **Timeout**: 120 seconds
- **Keep-alive**: 5 seconds
- **Max requests**: 1000 (restarts workers after this)
- **Logging**: To stdout/stderr (visible in Render logs)

## Troubleshooting

### Still Timing Out?

1. **Check Build Logs**:
   - Look for errors during Docker build
   - Check if dependencies install correctly
   - Verify migrations run successfully

2. **Check Runtime Logs**:
   - Look for database connection errors
   - Check if gunicorn starts successfully
   - Verify port is correct

3. **Database Issues**:
   - Ensure `DATABASE_URL` is set
   - Check database is running
   - Verify database credentials

4. **Increase Timeout** (if needed):
   - In Render dashboard → Service Settings
   - Increase "Health Check Timeout"
   - Default is usually 10 seconds, try 30-60 seconds

5. **Check Health Check Path**:
   - Set to `/` or `/api/`
   - Should return 200 OK
   - Not 404 or 500

### Common Errors

**"Application failed to respond"**
- Server isn't starting
- Check logs for gunicorn errors
- Verify PORT environment variable

**"Database connection failed"**
- DATABASE_URL not set
- Database not created/linked
- Wrong credentials

**"Migration failed"**
- Database schema issues
- Run migrations manually in Shell

**"Static files error"**
- Usually non-critical
- Check STATIC_ROOT in settings.py
- WhiteNoise should handle this

## Manual Testing

1. **Test Locally with Docker**:
   ```bash
   docker build -t eduhub-backend ./backend
   docker run -p 8000:8000 -e DATABASE_URL=your-db-url eduhub-backend
   ```

2. **Test in Render Shell**:
   - Go to Render → Your Service → Shell
   - Run: `python manage.py check`
   - Run: `python manage.py migrate`
   - Test: `curl http://localhost:8000/`

## Next Steps

1. **Commit and Push**:
   ```bash
   git add backend/Dockerfile backend/start.sh
   git commit -m "Fix Render deployment: use gunicorn and proper startup"
   git push origin main
   ```

2. **Monitor Deployment**:
   - Watch Render logs during deployment
   - Check for any errors
   - Verify health check passes

3. **Test Endpoints**:
   - `https://your-backend.onrender.com/` - Should show API info
   - `https://your-backend.onrender.com/api/` - Should show DRF interface
   - `https://your-backend.onrender.com/admin/` - Admin panel

## Performance Tips

- **Upgrade Plan**: Starter plan ($7/month) keeps service always on
- **Database**: Use Starter plan for always-on database
- **Workers**: Increase workers if you get more traffic:
  ```bash
  --workers 4  # Instead of 2
  ```

## Summary

The timeout was likely caused by:
1. Using development server (`runserver`) instead of production server (`gunicorn`)
2. Server starting before database was ready
3. Missing migrations causing startup delays

All of these are now fixed! 🎉

