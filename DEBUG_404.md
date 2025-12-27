# 🔍 404 ERROR - COMPLETE FIX

## Check Browser Console

Press F12 → Console tab → Find the exact 404 URL

Example errors:
```
❌ http://localhost:3000/uploads/file.jpg (Wrong - frontend port)
❌ http://localhost:4000/undefined (Wrong - undefined URL)
❌ http://localhost:4000/null (Wrong - null URL)
✅ http://localhost:4000/uploads/file.jpg (Correct)
```

## Common Causes & Fixes

### 1. No Database Records
**Symptom**: Files in `uploads/` but 404 errors
**Cause**: Messages not in database
**Fix**: Upload NEW files

### 2. Wrong URL in Database
**Symptom**: URL is `undefined` or `null`
**Cause**: Upload route didn't save URL properly
**Fix**: Check upload route returns correct URL

### 3. CORS Issue
**Symptom**: CORS error before 404
**Cause**: Backend not allowing requests
**Fix**: Check backend CORS settings

### 4. Backend Not Running
**Symptom**: Connection refused
**Cause**: Backend server stopped
**Fix**: `cd backend && npm start`

## Quick Test

### Test 1: Backend Serves Files
```bash
curl http://localhost:4000/uploads/1766745797263-gfb479jx9.jpg -I
```
Should return: `HTTP/1.1 200 OK`

### Test 2: Check Database
```bash
cd backend
node check-files.js
```
Should show messages with attachment URLs

### Test 3: Upload New File
1. Open chat
2. Click 📎
3. Select file
4. Send
5. Check console for URL

## Debug Steps

1. **Open Browser Console** (F12)
2. **Find 404 URL** - Copy exact URL
3. **Test URL directly** - Paste in browser
4. **Check pattern**:
   - Has `http://localhost:4000`? ✅
   - Has `/uploads/`? ✅
   - Has filename? ✅
   - Returns 404? → File doesn't exist

## Solution

Since old files have no database records:

**Option A: Upload New Files**
```bash
# Just upload new files - they will work
```

**Option B: Clean Start**
```bash
# Delete old orphaned files
del backend\uploads\*

# Upload fresh files
```

## Verify Fix

After uploading new file:
```bash
# Check database
cd backend
node check-files.js

# Should show:
# ID: 67xxxxx
# Type: image
# URL: /uploads/filename.jpg
# Filename: original.jpg
```

Then file will display in UI! ✅
