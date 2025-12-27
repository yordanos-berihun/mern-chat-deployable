# 🚀 DEPLOYMENT GUIDE

## Deployment Options

1. **Render** (Easiest - Free tier available)
2. **Heroku** (Popular - Free tier limited)
3. **Railway** (Modern - Free tier available)
4. **AWS** (Production - Paid)
5. **DigitalOcean** (VPS - Paid)

---

## 🎯 Option 1: Render (RECOMMENDED FOR BEGINNERS)

### Prerequisites
- GitHub account
- Render account (free at render.com)
- MongoDB Atlas account (free at mongodb.com/cloud/atlas)

### Step 1: Setup MongoDB Atlas
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account → Create cluster (M0 Free tier)
3. Database Access → Add user (username + password)
4. Network Access → Add IP: `0.0.0.0/0` (allow all)
5. Connect → Get connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/mern-chat
   ```

### Step 2: Push Code to GitHub
```bash
cd MERN
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/mern-chat.git
git push -u origin main
```

### Step 3: Deploy Backend on Render
1. Go to https://render.com → New → Web Service
2. Connect GitHub repository
3. Configure:
   - **Name:** `mern-chat-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free

4. Add Environment Variables:
   ```
   PORT=4000
   MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/mern-chat
   JWT_SECRET=your_random_secret_key_here_min_32_chars
   REFRESH_SECRET=your_refresh_secret_key_here_min_32_chars
   NODE_ENV=production
   CLIENT_URL=https://your-frontend-url.onrender.com
   ```

5. Click "Create Web Service"
6. Copy your backend URL: `https://mern-chat-backend.onrender.com`

### Step 4: Deploy Frontend on Render
1. Render Dashboard → New → Static Site
2. Connect same GitHub repository
3. Configure:
   - **Name:** `mern-chat-frontend`
   - **Root Directory:** `client`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `build`

4. Add Environment Variable:
   ```
   REACT_APP_API_URL=https://mern-chat-backend.onrender.com
   ```

5. Click "Create Static Site"

### Step 5: Update Backend CORS
Edit `backend/server.js`:
```javascript
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://your-frontend-url.onrender.com' // Add your Render frontend URL
  ],
  credentials: true
};
```

Push changes:
```bash
git add .
git commit -m "Update CORS for production"
git push
```

---

## 🎯 Option 2: Heroku

### Prerequisites
- Heroku account
- Heroku CLI installed
- MongoDB Atlas setup (see Option 1, Step 1)

### Deploy Backend
```bash
cd backend
heroku login
heroku create mern-chat-backend

# Set environment variables
heroku config:set MONGODB_URI="mongodb+srv://..."
heroku config:set JWT_SECRET="your_secret"
heroku config:set REFRESH_SECRET="your_refresh_secret"
heroku config:set NODE_ENV="production"

# Deploy
git init
git add .
git commit -m "Deploy backend"
heroku git:remote -a mern-chat-backend
git push heroku main
```

### Deploy Frontend
```bash
cd ../client

# Update .env.production
echo "REACT_APP_API_URL=https://mern-chat-backend.herokuapp.com" > .env.production

heroku create mern-chat-frontend
heroku buildpacks:set mars/create-react-app

git init
git add .
git commit -m "Deploy frontend"
heroku git:remote -a mern-chat-frontend
git push heroku main
```

---

## 🎯 Option 3: Railway

### Prerequisites
- Railway account (railway.app)
- MongoDB Atlas setup

### Deploy via Railway CLI
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy Backend
cd backend
railway init
railway up
railway variables set MONGODB_URI="mongodb+srv://..."
railway variables set JWT_SECRET="your_secret"
railway variables set REFRESH_SECRET="your_refresh_secret"

# Deploy Frontend
cd ../client
railway init
railway up
railway variables set REACT_APP_API_URL="https://your-backend.railway.app"
```

---

## 🎯 Option 4: AWS (Production)

### Architecture
- **EC2:** Node.js backend
- **S3 + CloudFront:** React frontend
- **DocumentDB/MongoDB Atlas:** Database
- **Route53:** Domain management

### Backend on EC2
```bash
# SSH into EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone and setup
git clone https://github.com/YOUR_USERNAME/mern-chat.git
cd mern-chat/backend
npm install

# Create .env file
nano .env
# Add your environment variables

# Start with PM2
pm2 start server.js --name mern-chat-backend
pm2 startup
pm2 save

# Setup Nginx reverse proxy
sudo apt install nginx
sudo nano /etc/nginx/sites-available/default
```

Nginx config:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo systemctl restart nginx
```

### Frontend on S3
```bash
cd client
npm run build

# Install AWS CLI
aws configure

# Upload to S3
aws s3 sync build/ s3://your-bucket-name --acl public-read

# Setup CloudFront distribution for HTTPS
```

---

## 🎯 Option 5: DigitalOcean

### Using App Platform (Easiest)
1. Create DigitalOcean account
2. Apps → Create App → GitHub
3. Select repository
4. Configure components:
   - **Backend:** Node.js service (backend folder)
   - **Frontend:** Static site (client folder)
5. Add environment variables
6. Deploy

### Using Droplet (VPS)
```bash
# Create Ubuntu droplet
# SSH into droplet
ssh root@your-droplet-ip

# Install Node.js, MongoDB, Nginx
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs mongodb nginx

# Clone and setup (similar to AWS EC2 steps above)
```

---

## 🔒 Production Checklist

### Security
- [ ] Change all default secrets in .env
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Enable HTTPS/SSL certificates
- [ ] Update CORS origins to production URLs
- [ ] Set secure cookie flags
- [ ] Enable rate limiting
- [ ] Sanitize all inputs
- [ ] Keep dependencies updated

### Environment Variables
```env
# Backend .env
PORT=4000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<strong-random-secret>
REFRESH_SECRET=<strong-random-secret>
NODE_ENV=production
CLIENT_URL=https://your-frontend-url.com
MAX_FILE_SIZE=10485760
```

```env
# Frontend .env.production
REACT_APP_API_URL=https://your-backend-url.com
```

### Performance
- [ ] Enable gzip compression
- [ ] Implement caching strategies
- [ ] Optimize images and assets
- [ ] Use CDN for static files
- [ ] Enable database indexing
- [ ] Monitor server resources

### Monitoring
- [ ] Setup error logging (Sentry, LogRocket)
- [ ] Monitor uptime (UptimeRobot)
- [ ] Track performance (New Relic, DataDog)
- [ ] Setup alerts for downtime

---

## 🔧 Post-Deployment Configuration

### Update Socket.IO CORS
`backend/server.js`:
```javascript
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});
```

### Update API Base URL
`client/src/EnhancedChatApp.js`:
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';
```

### Enable HTTPS
For custom domains, use Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 🐛 Common Deployment Issues

### Issue: Socket.IO not connecting
**Solution:**
- Check CORS settings include production URL
- Verify WebSocket support on hosting platform
- Use polling fallback: `transports: ['websocket', 'polling']`

### Issue: Environment variables not loading
**Solution:**
- Verify variables are set in hosting dashboard
- Check variable names match exactly
- Restart services after adding variables

### Issue: MongoDB connection timeout
**Solution:**
- Whitelist hosting platform IPs in MongoDB Atlas
- Use `0.0.0.0/0` for testing (not recommended for production)
- Check connection string format

### Issue: File uploads failing
**Solution:**
- Check file size limits on hosting platform
- Use cloud storage (AWS S3, Cloudinary) for production
- Verify uploads directory permissions

---

## 📊 Cost Estimates

### Free Tier Options
- **Render:** Free (sleeps after 15 min inactivity)
- **Railway:** $5 credit/month
- **MongoDB Atlas:** 512MB free
- **Heroku:** Limited free tier

### Paid Options
- **AWS EC2 t2.micro:** ~$10/month
- **DigitalOcean Droplet:** $6-12/month
- **MongoDB Atlas M10:** ~$57/month
- **Domain:** ~$12/year

---

## 🎉 Deployment Complete!

Your app is now live! Share your URL:
- Frontend: `https://your-app.onrender.com`
- Backend API: `https://your-api.onrender.com`

### Next Steps
1. Test all features in production
2. Setup custom domain
3. Enable SSL/HTTPS
4. Configure monitoring
5. Setup automated backups
6. Create CI/CD pipeline

---

## 📚 Additional Resources

- [Render Docs](https://render.com/docs)
- [Heroku Node.js Guide](https://devcenter.heroku.com/articles/deploying-nodejs)
- [MongoDB Atlas Setup](https://docs.atlas.mongodb.com/getting-started/)
- [AWS Deployment Guide](https://aws.amazon.com/getting-started/hands-on/deploy-nodejs-web-app/)
- [Let's Encrypt SSL](https://letsencrypt.org/getting-started/)

---

**Need Help?** Open an issue on GitHub or check the troubleshooting section above.
