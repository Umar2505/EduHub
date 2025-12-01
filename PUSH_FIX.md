# Fix for GitHub Push Timeout Error

## Problem
GitHub push was failing with HTTP 408 timeout error due to a 287MB video file (`test.mov`) in the repository.

## Solution Applied

1. **Removed media files from git tracking:**
   ```bash
   git rm -r --cached backend/media/
   ```

2. **Updated .gitignore** to exclude:
   - `backend/media/`
   - Video file formats (`.mov`, `.mp4`, `.avi`, etc.)

3. **Increased git buffer size:**
   ```bash
   git config http.postBuffer 524288000  # 500MB
   git config http.lowSpeedLimit 0
   git config http.lowSpeedTime 0
   ```

## Next Steps

The large file is still in git history. To completely remove it:

### Option 1: Push in smaller chunks (Recommended)
```bash
git push origin main --verbose
```

If it still times out, try:
```bash
git push origin main --no-verify
```

### Option 2: Remove from history (if push still fails)
```bash
# Install git-filter-repo (recommended) or use git filter-branch
git filter-repo --path backend/media/resources/test.mov --invert-paths

# Or use BFG Repo-Cleaner
# Download from: https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --delete-files test.mov
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### Option 3: Force push (if you're the only contributor)
```bash
# WARNING: This rewrites history. Only use if you're sure!
git push origin main --force
```

## Prevention

- Media files should never be committed to git
- Use `.gitignore` to exclude all media directories
- Use Git LFS for large files if needed
- Keep repository size under 1GB for better performance

