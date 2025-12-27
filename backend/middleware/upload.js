// MERN Stack - File Upload Middleware
// Handles file uploads with validation and storage

const multer = require('multer'); // File upload library
const path = require('path');     // Node.js path utilities
const fs = require('fs');         // File system operations

// STEP 1: CREATE UPLOADS DIRECTORY
// Ensure uploads folder exists, create if not
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  // fs.mkdirSync creates directory
  // recursive: true creates parent directories if needed
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory:', uploadsDir);
}

// STEP 2: CONFIGURE STORAGE
// Define where and how files are stored
const storage = multer.diskStorage({
  // DESTINATION: Where to save files
  destination: function (req, file, cb) {
    // cb = callback function
    // null = no error, uploadsDir = save location
    cb(null, uploadsDir);
  },
  
  // FILENAME: What to name the saved file
  filename: function (req, file, cb) {
    // CREATE UNIQUE FILENAME
    // Format: timestamp-randomnumber-originalname.ext
    // Example: 1640995200000-123456-avatar.jpg
    
    const timestamp = Date.now();                    // Current time in milliseconds
    const randomNum = Math.round(Math.random() * 1E9); // Random number 0-999999999
    const extension = path.extname(file.originalname); // Get file extension (.jpg, .png, etc.)
    const baseName = path.basename(file.originalname, extension); // Filename without extension
    
    // Combine all parts for unique filename
    const uniqueName = `${timestamp}-${randomNum}-${baseName}${extension}`;
    
    console.log('📄 Saving file as:', uniqueName);
    cb(null, uniqueName);
  }
});

// STEP 3: FILE FILTER - Security validation
// Determine which files to accept/reject
const fileFilter = (req, file, cb) => {
  console.log('🔍 Checking file:', file.originalname, 'Type:', file.mimetype);
  
  // ALLOWED FILE TYPES
  const allowedTypes = [
    'image/jpeg',    // .jpg, .jpeg
    'image/png',     // .png
    'image/gif',     // .gif
    'image/webp',    // .webp (modern format)
    'application/pdf', // .pdf documents
    'text/plain',    // .txt files
    'application/msword', // .doc files
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx files
  ];
  
  // CHECK IF FILE TYPE IS ALLOWED
  if (allowedTypes.includes(file.mimetype)) {
    console.log('✅ File type accepted:', file.mimetype);
    cb(null, true); // Accept file
  } else {
    console.log('❌ File type rejected:', file.mimetype);
    // Reject file with error message
    cb(new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
};

// STEP 4: CREATE MULTER INSTANCE
// Configure multer with our settings
const upload = multer({
  storage: storage,        // Use our storage configuration
  fileFilter: fileFilter, // Use our file filter
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit (5 * 1024KB * 1024bytes)
    files: 5,                   // Maximum 5 files at once
  }
});

// STEP 5: MIDDLEWARE FUNCTIONS
// Different upload configurations for different use cases

// SINGLE FILE UPLOAD - For profile pictures
const uploadSingle = (fieldName) => {
  return (req, res, next) => {
    // upload.single() expects one file with specified field name
    const singleUpload = upload.single(fieldName);
    
    singleUpload(req, res, (err) => {
      if (err) {
        console.error('❌ Upload error:', err.message);
        
        // HANDLE DIFFERENT ERROR TYPES
        if (err instanceof multer.MulterError) {
          // Multer-specific errors
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              error: 'File too large. Maximum size is 5MB.'
            });
          }
          if (err.code ==='LIMIT_FILE_COUNT') {
            return res.status(400).json({
              success: false,
              error: 'Too many files. Maximum is 5 files.'
            });
          }
        }
        
        // Generic error response
        return res.status(400).json({
          success: false,
          error: err.message || 'File upload failed'
        });
      }
      
      // SUCCESS - File uploaded successfully
      if (req.file) {
        console.log('✅ File uploaded successfully:', req.file.filename);
        
        // ADD FILE INFO TO REQUEST OBJECT
        // This makes file info available in route handlers
        req.uploadedFile = {
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
          path: req.file.path,
          // CREATE PUBLIC URL for frontend
          url: `/uploads/${req.file.filename}`
        };
      }
      
      next(); // Continue to route handler
    });
  };
};

// MULTIPLE FILES UPLOAD - For document attachments
const uploadMultiple = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    // upload.array() expects multiple files with specified field name
    const multipleUpload = upload.array(fieldName, maxCount);
    
    multipleUpload(req, res, (err) => {
      if (err) {
        console.error('❌ Multiple upload error:', err.message);
        return res.status(400).json({
          success: false,
          error: err.message || 'File upload failed'
        });
      }
      
      // SUCCESS - Files uploaded
      if (req.files && req.files.length > 0) {
        console.log(`✅ ${req.files.length} files uploaded successfully`);
        
        // PROCESS ALL UPLOADED FILES
        req.uploadedFiles = req.files.map(file => ({
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          path: file.path,
          url: `/uploads/${file.filename}`
        }));
      }
      
      next();
    });
  };
};

// UTILITY FUNCTION - Delete file from disk
const deleteFile = (filename) => {
  const filePath = path.join(uploadsDir, filename);
  
  // CHECK IF FILE EXISTS
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath); // Delete file synchronously
      console.log('🗑️ File deleted:', filename);
      return true;
    } catch (error) {
      console.error('❌ Error deleting file:', error.message);
      return false;
    }
  } else {
    console.log('⚠️ File not found for deletion:', filename);
    return false;
  }
};

// UTILITY FUNCTION - Get file info
const getFileInfo = (filename) => {
  const filePath = path.join(uploadsDir, filename);
  
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath); // Get file statistics
    return {
      filename,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      url: `/uploads/${filename}`
    };
  }
  
  return null;
};

// EXPORT MIDDLEWARE FUNCTIONS
module.exports = {
  uploadSingle,    // For single file uploads (profile pictures)
  uploadMultiple,  // For multiple file uploads (documents)
  deleteFile,      // Delete file utility
  getFileInfo,     // Get file information utility
  uploadsDir       // Uploads directory path
};