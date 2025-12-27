# Feature #11: Cloud Storage (AWS S3)

## Implementation Summary
Replaced local file storage with AWS S3 for scalable, production-ready file uploads.

## Backend Changes

### New Files

#### 1. `utils/s3.js` - S3 Upload Utility
- **uploadToS3(buffer, fileName, mimeType)** - Upload file to S3
- **deleteFromS3(fileKey)** - Delete file from S3
- Uses AWS SDK v3 (@aws-sdk/client-s3)
- Generates unique file keys with timestamp + random hash
- Returns public URL and file key

#### 2. `routes/upload.js` - File Upload Route
- **POST /api/upload** - Upload file to S3
- Uses multer with memory storage (no local disk)
- 10MB file size limit
- Auto-detects message type (image/video/audio/file)
- Creates message with S3 URL

### Updated Files

#### `package.json`
- Added dependency: `@aws-sdk/client-s3: ^3.400.0`

#### `server.js`
- Added route: `app.use('/api/upload', require('./routes/upload'))`

#### `.env.example`
- Added AWS configuration variables:
  - `AWS_REGION` - AWS region (default: us-east-1)
  - `AWS_ACCESS_KEY_ID` - AWS access key
  - `AWS_SECRET_ACCESS_KEY` - AWS secret key
  - `AWS_S3_BUCKET` - S3 bucket name

## Features

### S3 Integration
- ✅ Direct upload to AWS S3
- ✅ No local file storage needed
- ✅ Public-read ACL for easy access
- ✅ Unique file naming (timestamp + hash)
- ✅ Content-Type preservation
- ✅ File metadata tracking

### File Handling
- ✅ Memory-based upload (multer.memoryStorage)
- ✅ 10MB size limit
- ✅ Auto message type detection
- ✅ Supports: images, videos, audio, files
- ✅ Original filename preservation

### Security
- ✅ Environment variable credentials
- ✅ File size validation
- ✅ MIME type validation
- ✅ Unique file keys prevent collisions

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Create AWS S3 Bucket
1. Go to AWS Console → S3
2. Create new bucket (e.g., `mern-chat-uploads`)
3. Enable public access for uploaded files
4. Set bucket policy for public-read

### 3. Get AWS Credentials
1. Go to AWS Console → IAM
2. Create new user with S3 permissions
3. Generate access key and secret key
4. Copy credentials

### 4. Configure Environment Variables
Create `.env` file:
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-here
AWS_SECRET_ACCESS_KEY=your-secret-key-here
AWS_S3_BUCKET=mern-chat-uploads
```

### 5. Update Frontend (Optional)
Frontend already uses `/api/upload` endpoint - no changes needed if using existing upload logic.

## Usage

### Upload File
```javascript
const formData = new FormData();
formData.append('file', fileObject);
formData.append('senderId', userId);
formData.append('room', roomId);

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData
});
```

### Response Format
```json
{
  "success": true,
  "data": {
    "_id": "msg_1234567890",
    "content": "image.jpg",
    "sender": { "_id": "user123", "name": "John" },
    "room": "room456",
    "messageType": "image",
    "attachment": {
      "url": "https://bucket.s3.amazonaws.com/file-key",
      "key": "1234567890-abc123-image.jpg",
      "filename": "image.jpg",
      "type": "image/jpeg",
      "size": 123456
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Technical Details

### File Key Generation
```javascript
const fileKey = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}-${fileName}`;
// Example: 1704067200000-a1b2c3d4e5f6g7h8-photo.jpg
```

### S3 Upload Command
```javascript
new PutObjectCommand({
  Bucket: BUCKET_NAME,
  Key: fileKey,
  Body: fileBuffer,
  ContentType: mimeType,
  ACL: 'public-read'
});
```

### Public URL Format
```
https://{bucket-name}.s3.amazonaws.com/{file-key}
```

## Benefits

### Scalability
- ✅ No server disk space needed
- ✅ Unlimited storage capacity
- ✅ Global CDN distribution
- ✅ High availability (99.99%)

### Performance
- ✅ Fast upload/download speeds
- ✅ No server bandwidth usage
- ✅ Parallel uploads supported
- ✅ Automatic compression options

### Cost
- ✅ Pay only for storage used
- ✅ Free tier: 5GB storage, 20K GET requests
- ✅ Low cost: ~$0.023/GB/month
- ✅ No server infrastructure costs

### Reliability
- ✅ 99.999999999% durability
- ✅ Automatic backups
- ✅ Version control available
- ✅ Cross-region replication

## AWS S3 Bucket Policy Example

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::mern-chat-uploads/*"
    }
  ]
}
```

## IAM User Permissions

Minimum required permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::mern-chat-uploads/*"
    }
  ]
}
```

## Migration from Local Storage

### Before (Local)
- Files stored in `backend/uploads/`
- Server disk space required
- Manual backup needed
- Limited scalability

### After (S3)
- Files stored in AWS S3
- No server disk usage
- Automatic backups
- Unlimited scalability

## Troubleshooting

### Error: "Missing credentials"
- Check `.env` file has AWS credentials
- Verify credentials are correct
- Ensure IAM user has S3 permissions

### Error: "Access Denied"
- Check bucket policy allows public-read
- Verify IAM user has PutObject permission
- Ensure bucket name matches .env

### Error: "Bucket not found"
- Verify bucket exists in AWS Console
- Check bucket name spelling
- Ensure region matches

## Cost Estimation

### Example Usage
- 1000 users
- 10 files/user/month = 10,000 files
- Average file size: 2MB
- Total storage: 20GB

### Monthly Cost
- Storage: 20GB × $0.023 = $0.46
- PUT requests: 10,000 × $0.005/1000 = $0.05
- GET requests: 50,000 × $0.0004/1000 = $0.02
- **Total: ~$0.53/month**

## Progress Update
**11 of 12 features complete (92%)**

Remaining feature:
- Voice/Video Calls
