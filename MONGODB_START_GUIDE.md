# 🚀 MongoDB Setup & Start Guide

## Quick Start (Windows)

### Option 1: MongoDB as Windows Service (Recommended)
```bash
# Start MongoDB service
net start MongoDB

# Stop MongoDB service
net stop MongoDB

# Check status
sc query MongoDB
```

### Option 2: Manual Start
```bash
# Navigate to MongoDB bin folder
cd C:\Program Files\MongoDB\Server\7.0\bin

# Start MongoDB
mongod --dbpath "C:\data\db"
```

### Option 3: Using mongod command (if in PATH)
```bash
# Create data directory first
mkdir C:\data\db

# Start MongoDB
mongod
```

---

## Installation (If Not Installed)

### 1. Download MongoDB
- Visit: https://www.mongodb.com/try/download/community
- Select: Windows x64
- Download MSI installer

### 2. Install MongoDB
```bash
# Run installer
# Choose "Complete" installation
# Check "Install MongoDB as a Service"
# Check "Install MongoDB Compass" (GUI tool)
```

### 3. Add to PATH (Optional)
```bash
# Add to System Environment Variables:
C:\Program Files\MongoDB\Server\7.0\bin
```

---

## Verify MongoDB is Running

### Method 1: Check Service
```bash
# Windows Services
services.msc
# Look for "MongoDB Server"
```

### Method 2: Connect with mongosh
```bash
# Open new terminal
mongosh

# Should see:
# Current Mongosh Log ID: ...
# Connecting to: mongodb://127.0.0.1:27017
# Using MongoDB: 7.0.x
```

### Method 3: Check Port
```bash
# Check if MongoDB is listening on port 27017
netstat -an | findstr "27017"

# Should see:
# TCP    0.0.0.0:27017    0.0.0.0:0    LISTENING
```

---

## Common Issues & Fixes

### Issue 1: "mongod is not recognized"
**Fix:** Add MongoDB to PATH
```bash
# Add this to System Environment Variables > Path:
C:\Program Files\MongoDB\Server\7.0\bin
```

### Issue 2: "Data directory not found"
**Fix:** Create data directory
```bash
mkdir C:\data\db
```

### Issue 3: "Port 27017 already in use"
**Fix:** Stop existing MongoDB process
```bash
# Find process
netstat -ano | findstr "27017"

# Kill process (replace PID)
taskkill /PID <PID> /F

# Or restart service
net stop MongoDB
net start MongoDB
```

### Issue 4: "Access denied"
**Fix:** Run as Administrator
```bash
# Right-click Command Prompt
# Select "Run as administrator"
net start MongoDB
```

---

## For Your MERN App

### 1. Start MongoDB
```bash
net start MongoDB
```

### 2. Verify Connection
```bash
mongosh
# Type: show dbs
# Should list databases
```

### 3. Start Backend
```bash
cd backend
npm start
```

### 4. Check Backend Logs
```bash
# Should see:
# ✅ MongoDB connected
# 🚀 Server running on port 4000
```

---

## MongoDB Compass (GUI Tool)

### Connect to Local MongoDB
1. Open MongoDB Compass
2. Connection string: `mongodb://localhost:27017`
3. Click "Connect"
4. View databases: `mern-chat`, `test`, `admin`

---

## Quick Commands

```bash
# Start MongoDB
net start MongoDB

# Stop MongoDB
net stop MongoDB

# Connect to MongoDB shell
mongosh

# Show databases
show dbs

# Use your database
use mern-chat

# Show collections
show collections

# View users
db.users.find()

# View messages
db.messages.find()

# Exit mongosh
exit
```

---

## Environment Variables (.env)

```env
# Backend .env file
MONGODB_URI=mongodb://localhost:27017/mern-chat
PORT=4000
JWT_SECRET=your_secret_key
REFRESH_SECRET=your_refresh_key
```

---

## Troubleshooting Checklist

- [ ] MongoDB installed?
- [ ] MongoDB service running? (`net start MongoDB`)
- [ ] Port 27017 open? (`netstat -an | findstr "27017"`)
- [ ] Data directory exists? (`C:\data\db`)
- [ ] Backend .env has correct MONGODB_URI?
- [ ] Backend shows "✅ MongoDB connected"?

---

## Alternative: MongoDB Atlas (Cloud)

If local MongoDB issues persist, use cloud:

1. Visit: https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create free cluster (M0)
4. Get connection string
5. Update .env:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mern-chat
```

---

## Summary

**Simplest way to start MongoDB:**
```bash
net start MongoDB
```

**Verify it's running:**
```bash
mongosh
```

**Then start your app:**
```bash
cd backend
npm start
```

Done! 🎉
