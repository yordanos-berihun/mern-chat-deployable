# Quick Setup Guide

## Email Configuration (For Registration)

1. **Get Gmail App Password:**
   - Go to Google Account → Security
   - Enable 2-Step Verification
   - Generate App Password (select "Mail" and "Other")
   - Copy the 16-character password

2. **Update .env file:**
   ```
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   ```

## Start Application

1. **Backend:**
   ```bash
   cd backend
   npm start
   ```

2. **Frontend:**
   ```bash
   cd client
   npm start
   ```

## Test with Demo Users

Login instantly with:
- alice@demo.com / demo123
- bob@demo.com / demo123
- charlie@demo.com / demo123

## Register New User

1. Click "Register"
2. Fill form and submit
3. Check email for verification link
4. Click link to verify
5. Login with credentials

## Current Status

✅ Real-time messaging
✅ File sharing
✅ Reactions & replies
✅ Typing indicators
✅ Read receipts
✅ Email verification
✅ Password reset
✅ MongoDB Atlas connected

## Known Issues

- Email service needs Gmail credentials in .env
- Restart backend after .env changes
