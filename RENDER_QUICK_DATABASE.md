# 🗄️ Quick Database Setup on Render

## Method 1: Auto-Add During Service Creation (Easiest) ⭐

When creating your Backend Service:

1. **Fill in service settings** (name, repo, root directory, etc.)
2. **Scroll down** to find **"Add Database"** section
3. **Click "Add PostgreSQL"**
4. **Render automatically:**
   - ✅ Creates the database
   - ✅ Adds `DATABASE_URL` environment variable
   - ✅ Links them together
5. **Click "Create Web Service"**

**That's it!** The database is connected automatically.

---

## Method 2: Create Database First, Then Link

### Step 1: Create Database

1. Go to https://dashboard.render.com
2. Click **"New +"** (top right)
3. Select **"PostgreSQL"**
4. Configure:
   - **Name**: `eduhub-db`
   - **Database**: `eduhub` (or leave default)
   - **Region**: Same as your backend service
   - **Plan**: Free (90 days) or Starter ($7/month)
5. Click **"Create Database"**

### Step 2: Link to Backend Service

**Option A: Auto-Link (Recommended)**
1. Go to your **Backend Service**
2. Click **"Environment"** tab
3. Scroll to **"Add Database"** section
4. Click **"Link Existing Database"**
5. Select `eduhub-db`
6. Render automatically adds `DATABASE_URL`

**Option B: Manual Link**
1. Go to your **Database Service** (`eduhub-db`)
2. Find **"Internal Database URL"**
3. Copy the URL (looks like: `postgresql://user:pass@host:5432/db`)
4. Go to your **Backend Service** → **"Environment"** tab
5. Click **"Add Environment Variable"**
6. Key: `DATABASE_URL`
7. Value: Paste the URL you copied
8. Click **"Save Changes"**

---

## After Database is Connected

1. **Go to Backend Service** → **"Shell"** tab
2. **Run migrations:**
   ```bash
   python manage.py migrate
   ```
3. **Create superuser:**
   ```bash
   python manage.py createsuperuser
   ```

---

## Verify It's Working

1. Check **Backend Service Logs**
   - Should see: "System check identified no issues"
   - No database connection errors

2. Check **Environment Variables**
   - Go to Backend Service → Environment tab
   - Should see `DATABASE_URL` listed

3. Test in Shell:
   ```bash
   python manage.py dbshell
   # Should connect successfully
   ```

---

## Troubleshooting

### "Could not translate host name 'db'"
- **Problem**: `DATABASE_URL` not set
- **Fix**: Make sure database is linked or `DATABASE_URL` is added manually

### Database not showing in "Add Database" section
- **Problem**: Database might be in different region
- **Fix**: Create database in same region as backend service

### "Database does not exist"
- **Problem**: Wrong database name in URL
- **Fix**: Check database name matches in `DATABASE_URL`

---

## Cost

- **Free**: 90 days free trial, then $7/month
- **Starter**: $7/month (always on, recommended for production)
- **Standard**: $20/month (better performance)

---

## Summary

**Easiest way**: When creating backend service, click "Add PostgreSQL" in the "Add Database" section. Render does everything automatically! 🎉

