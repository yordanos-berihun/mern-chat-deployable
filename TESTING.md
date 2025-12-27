# Testing Guide - New Features

## 🧪 How to Test Each Feature

### 1. Online/Offline Status

**Setup:**
1. Start backend: `cd backend && npm start`
2. Start frontend: `cd client && npm start`
3. Open app in 2 different browsers (Chrome + Firefox)

**Test Steps:**
1. Login as User A in Browser 1
2. Login as User B in Browser 2
3. ✅ **Expected**: Green dot appears next to User B in Browser 1's user list
4. ✅ **Expected**: Green dot appears next to User A in Browser 2's user list
5. Close Browser 2
6. ✅ **Expected**: Green dot disappears in Browser 1 after ~2 seconds

**Success Criteria:**
- Green pulsing dots appear next to online users
- Dots disappear when users disconnect
- Status updates in real-time

---

### 2. Typing Indicators

**Setup:**
1. Open app in 2 browsers
2. Login as different users
3. Start a private chat between them

**Test Steps:**
1. In Browser 1, click on User B to open chat
2. In Browser 2, click on User A to open chat
3. In Browser 1, start typing in the message input
4. ✅ **Expected**: Browser 2 shows "User A is typing..." below messages
5. Stop typing for 1 second
6. ✅ **Expected**: Typing indicator disappears in Browser 2

**Success Criteria:**
- Typing indicator appears within 1 second of typing
- Indicator shows correct username
- Indicator disappears 1 second after stopping
- Indicator only shows in active chat room

---

### 3. Unread Message Counts

**Setup:**
1. Open app in 2 browsers
2. Create 2 different chat rooms (or private chats)

**Test Steps:**
1. In Browser 1, open Chat Room A
2. In Browser 2, send 3 messages to Chat Room A
3. ✅ **Expected**: Red badge with "3" appears on Chat Room A in Browser 1
4. In Browser 1, click Chat Room A
5. ✅ **Expected**: Badge disappears
6. Switch to Chat Room B
7. Send message to Chat Room A from Browser 2
8. ✅ **Expected**: Badge reappears with "1"

**Success Criteria:**
- Badge shows correct count
- Badge is red and clearly visible
- Count resets when opening room
- Count persists when switching between rooms

---

### 4. Browser Notifications

**Setup:**
1. Open app in Chrome
2. Allow notifications when prompted
3. Open app in another tab or browser

**Test Steps:**
1. In Tab 1, login and open a chat
2. Switch to Tab 2 (or minimize browser)
3. From another device/browser, send a message to that chat
4. ✅ **Expected**: Desktop notification appears with:
   - Sender's name
   - Message preview (first 50 chars)
   - App icon

**Success Criteria:**
- Notification appears when tab is inactive
- Notification shows sender name and message
- No notification when tab is active
- Clicking notification focuses the tab

**Troubleshooting:**
- If no notification: Check browser permissions
- Chrome: Settings → Privacy → Site Settings → Notifications
- Allow notifications for localhost:3000

---

### 5. Read Receipts (Backend)

**Setup:**
1. Install MongoDB Compass or use mongo shell
2. Connect to your database

**Test Steps:**
1. Send a message in the app
2. Open MongoDB Compass
3. Navigate to `messages` collection
4. Find the message you sent
5. ✅ **Expected**: Message has `readBy: []` field
6. Open the chat in another browser
7. Refresh MongoDB Compass
8. ✅ **Expected**: `readBy` array now contains the reader's userId

**Success Criteria:**
- readBy field exists on all new messages
- Array populates when message is viewed
- Each user ID appears only once
- Works for both private and group chats

---

### 6. JWT Authentication

**Setup:**
1. Use Postman or curl
2. Backend running on localhost:4000

**Test Register:**
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "user": {
    "id": "...",
    "name": "Test User",
    "email": "test@example.com"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

**Test Login:**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Test Refresh Token:**
```bash
curl -X POST http://localhost:4000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

**Success Criteria:**
- Register returns both tokens
- Login returns both tokens
- Refresh returns new tokens
- Access token expires in 15 minutes
- Refresh token expires in 7 days

---

### 7. Rate Limiting

**Setup:**
1. Use Postman or a script
2. Backend running

**Test Steps:**
```bash
# Run this 101 times quickly
for i in {1..101}; do
  curl http://localhost:4000/api/users
  echo "Request $i"
done
```

**Expected:**
- First 100 requests: Success (200 OK)
- Request 101: Error (429 Too Many Requests)
- Response: `{"error": "Too many requests from this IP"}`
- After 15 minutes: Limit resets

**Success Criteria:**
- Rate limit triggers at 100 requests
- Error message is clear
- Limit resets after window expires
- Only affects /api/* routes

---

### 8. Security Headers (Helmet)

**Setup:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Load the app

**Test Steps:**
1. Click on any API request
2. View Response Headers
3. ✅ **Expected Headers:**
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: SAMEORIGIN`
   - `X-XSS-Protection: 0`
   - `Strict-Transport-Security` (if HTTPS)

**Success Criteria:**
- Security headers present on all responses
- No console warnings about headers
- CSP not blocking resources

---

## 🔍 Integration Testing

### Full User Flow Test

**Scenario:** Two users having a conversation

1. **User A** registers and logs in
2. **User B** registers and logs in
3. ✅ Both see each other online (green dots)
4. **User A** clicks on User B to start chat
5. **User A** starts typing
6. ✅ User B sees typing indicator
7. **User A** sends message
8. ✅ User B receives message instantly
9. ✅ User B's browser shows notification (if tab inactive)
10. **User B** opens the chat
11. ✅ Unread badge disappears
12. ✅ Message marked as read in database
13. **User B** replies
14. ✅ User A receives reply
15. **User A** adds reaction 👍
16. ✅ User B sees reaction appear
17. **User B** closes browser
18. ✅ User A sees User B go offline

---

## 🐛 Common Issues & Solutions

### Issue: Green dots not appearing
**Solution:**
- Check socket connection in browser console
- Verify backend socket handlers are running
- Check CORS settings

### Issue: Typing indicator not showing
**Solution:**
- Ensure both users are in the same room
- Check socket events in Network tab
- Verify debounce timeout is working

### Issue: Notifications not appearing
**Solution:**
- Check browser notification permissions
- Ensure tab is actually inactive
- Test in Chrome (best support)

### Issue: Unread count not updating
**Solution:**
- Check if messages are being received
- Verify room IDs match
- Check state updates in React DevTools

### Issue: Rate limit too strict
**Solution:**
- Adjust in server.js: `max: 100` to higher value
- Or increase `windowMs` for longer window

---

## 📊 Performance Testing

### Load Test: Multiple Users

**Setup:**
1. Install `artillery`: `npm install -g artillery`
2. Create test file: `load-test.yml`

```yaml
config:
  target: 'http://localhost:4000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Send messages"
    flow:
      - post:
          url: "/api/messages"
          json:
            senderId: "test123"
            room: "general"
            content: "Test message"
```

3. Run: `artillery run load-test.yml`

**Expected:**
- Server handles 10 requests/second
- Response time < 200ms
- No errors or timeouts

---

## ✅ Feature Checklist

Before deploying, verify:

- [ ] Online status works in multiple browsers
- [ ] Typing indicators appear and disappear correctly
- [ ] Unread counts are accurate
- [ ] Browser notifications work (with permission)
- [ ] Read receipts save to database
- [ ] JWT tokens generate correctly
- [ ] Refresh token endpoint works
- [ ] Rate limiting triggers at 100 requests
- [ ] Security headers present
- [ ] No console errors
- [ ] Socket connections stable
- [ ] Messages send/receive instantly
- [ ] File uploads work
- [ ] Reactions work
- [ ] Search works
- [ ] Group chats work

---

## 🎯 Success Metrics

**Performance:**
- Message delivery: < 100ms
- Typing indicator delay: < 500ms
- Online status update: < 2s
- API response time: < 200ms

**Reliability:**
- Socket reconnection: Automatic
- Message delivery: 100%
- Notification delivery: 95%+
- Uptime: 99%+

**Security:**
- No XSS vulnerabilities
- No SQL injection possible
- Rate limiting active
- Tokens expire correctly
- Passwords hashed (never plain text)

---

## 📝 Test Report Template

```
Date: ___________
Tester: ___________

Feature: Online Status
Status: ✅ Pass / ❌ Fail
Notes: ___________

Feature: Typing Indicators
Status: ✅ Pass / ❌ Fail
Notes: ___________

Feature: Unread Counts
Status: ✅ Pass / ❌ Fail
Notes: ___________

Feature: Notifications
Status: ✅ Pass / ❌ Fail
Notes: ___________

Feature: Read Receipts
Status: ✅ Pass / ❌ Fail
Notes: ___________

Feature: JWT Auth
Status: ✅ Pass / ❌ Fail
Notes: ___________

Feature: Rate Limiting
Status: ✅ Pass / ❌ Fail
Notes: ___________

Feature: Security Headers
Status: ✅ Pass / ❌ Fail
Notes: ___________

Overall: ✅ Ready / ❌ Needs Work
```

---

Happy Testing! 🚀
