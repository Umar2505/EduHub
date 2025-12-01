# 🗄️ Setting Up PostgreSQL Database on Render

## Step-by-Step Guide

### Step 1: Create PostgreSQL Database on Render

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com
   - Log in to your account

2. **Create New PostgreSQL Database**
   - Click **"New +"** button (top right)
   - Select **"PostgreSQL"** from the dropdown

3. **Configure Database**
   - **Name**: `eduhub-db` (or any name you prefer)
   - **Database**: `eduhub` (or leave default)
   - **User**: (auto-generated, you can change it)
   - **Region**: Choose the same region as your backend service
   - **PostgreSQL Version**: Latest (15 or 16)
   - **Plan**: 
     - **Free**: 90 days free trial, then $7/month
     - **Starter**: $7/month (always on)
     - **Standard**: $20/month (better performance)

4. **Click "Create Database"**

### Step 2: Get Database Connection String

After the database is created:

1. **Go to your database service** (click on `eduhub-db`)
2. **Find "Internal Database URL"** or **"Connection String"**
   - It looks like: `postgresql://user:password@hostname:5432/dbname`
3. **Copy this URL** - you'll need it in the next step

### Step 3: Connect Database to Backend Service

1. **Go to your Backend Service** (the Django API service)
2. **Click on "Environment"** tab
3. **Add Environment Variable:**
   - **Key**: `DATABASE_URL`
   - **Value**: Paste the connection string you copied
   - Click **"Save Changes"**

### Step 4: Verify Connection

1. **Go to your Backend Service**
2. **Click on "Shell"** tab
3. **Run migrations:**
   ```bash
   python manage.py migrate
   ```
4. **Create superuser:**
   ```bash
   python manage.py createsuperuser
   ```

---

## Alternative: Let Render Auto-Connect

Render can automatically connect the database to your service:

1. **When creating your Backend Service:**
   - After selecting your repo and configuring it
   - Scroll down to **"Add Database"** section
   - Click **"Add PostgreSQL"**
   - Render will automatically:
     - Create the database
     - Add `DATABASE_URL` environment variable
     - Link them together

2. **Or link existing database:**
   - In your Backend Service settings
   - Go to **"Environment"** tab
   - Scroll to **"Add Database"** section
   - Select your existing database
   - Render will add `DATABASE_URL` automatically

---

## Environment Variables Summary

Your Backend Service should have these environment variables:

```bash
# Database (auto-provided by Render when you link the database)
DATABASE_URL=postgresql://user:password@hostname:5432/dbname

# Django Settings
SECRET_KEY=your-random-secret-key-here
DEBUG=False
ALLOWED_HOSTS=your-backend.onrender.com
CORS_ALLOWED_ORIGINS=https://your-frontend-url.netlify.app
TIMEZONE=Asia/Tashkent
```

---

## Important Notes

### Database URL Format
Render provides the database URL in this format:
```
postgresql://username:password@hostname:5432/database_name
```

The code will automatically parse this and connect to the database.

### Internal vs External Connection
- **Internal Database URL**: Use this for services on Render (faster, free)
- **External Database URL**: Use this if connecting from outside Render

For your backend service on Render, use the **Internal Database URL**.

### Database Persistence
- Render databases are persistent (data survives restarts)
- Free tier databases spin down after inactivity (like services)
- Paid databases are always on

---

## Troubleshooting

### "Could not translate host name 'db'"
- **Cause**: `DATABASE_URL` not set or incorrect
- **Fix**: Make sure `DATABASE_URL` environment variable is set in your backend service

### "Database does not exist"
- **Cause**: Database name mismatch
- **Fix**: Check the database name in `DATABASE_URL` matches your actual database

### "Connection refused"
- **Cause**: Using external URL when you should use internal
- **Fix**: Use the Internal Database URL for services on Render

### "Authentication failed"
- **Cause**: Wrong username/password
- **Fix**: Check the `DATABASE_URL` has correct credentials

---

## Quick Checklist

- [ ] Created PostgreSQL database on Render
- [ ] Copied Internal Database URL
- [ ] Added `DATABASE_URL` to backend service environment variables
- [ ] Saved environment variables
- [ ] Ran migrations: `python manage.py migrate`
- [ ] Created superuser: `python manage.py createsuperuser`
- [ ] Backend service restarted and connected successfully

---

## Cost Reference

- **Free Tier**: 90 days free, then $7/month per database
- **Starter**: $7/month (always on)
- **Standard**: $20/month (better performance)

For production, consider the Starter plan ($7/month) to keep the database always available.

