# 📦 Install File Upload Dependencies

## Backend Dependencies

Run this command in the MERN root directory:

```bash
npm install multer
```

**What is Multer?**
- Node.js middleware for handling `multipart/form-data`
- Used for uploading files
- Handles file storage, naming, and validation
- Most popular file upload library for Express

## Why These Dependencies?

### **multer**
- **Purpose**: Handle file uploads in Express
- **Features**: 
  - File storage (disk/memory)
  - File filtering (by type, size)
  - Multiple file uploads
  - Custom filename generation
- **Security**: Built-in validation and limits

## No Frontend Dependencies Needed!

The frontend uses:
- **FormData**: Built into browsers
- **XMLHttpRequest**: Built into browsers  
- **FileReader**: Built into browsers

All file upload functionality uses native browser APIs!

## Installation Commands

```bash
# Navigate to project root
cd "C:\Users\tg computer\Desktop\New folder\MERN"

# Install multer
npm install multer

# Restart server after installation
node server.js
```

## Verify Installation

After installing, your package.json should include:
```json
{
  "dependencies": {
    "multer": "^1.4.5-lts.1"
  }
}
```

## Ready to Test!

Once installed:
1. Restart your backend server
2. Go to Profile page
3. Click camera icon on avatar
4. Upload a profile picture!