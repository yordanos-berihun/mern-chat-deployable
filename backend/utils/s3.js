const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'mern-chat-uploads';

// Upload file to S3
const uploadToS3 = async (fileBuffer, fileName, mimeType) => {
  const fileKey = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}-${fileName}`;
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
    Body: fileBuffer,
    ContentType: mimeType,
    ACL: 'public-read'
  });

  await s3Client.send(command);
  
  return {
    url: `https://${BUCKET_NAME}.s3.amazonaws.com/${fileKey}`,
    key: fileKey
  };
};

// Delete file from S3 (optional)
const deleteFromS3 = async (fileKey) => {
  const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey
  });
  await s3Client.send(command);
};

module.exports = { uploadToS3, deleteFromS3 };
