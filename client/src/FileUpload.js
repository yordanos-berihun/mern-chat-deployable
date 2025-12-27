// MERN Stack Frontend - File Upload Component
// Handles file selection, preview, and upload with progress tracking

import React, { useState, useRef } from 'react';
import { API_BASE } from './apiClient';

const FileUpload = ({ 
  onUploadSuccess,    // Callback when upload succeeds
  onUploadError,      // Callback when upload fails
  acceptedTypes = "image/*", // What file types to accept
  multiple = false,   // Allow multiple files?
  maxSize = 5,       // Max file size in MB
  userId             // User ID for avatar uploads
}) => {
  // STATE MANAGEMENT
  const [selectedFiles, setSelectedFiles] = useState([]); // Files selected by user
  const [uploading, setUploading] = useState(false);      // Upload in progress?
  const [uploadProgress, setUploadProgress] = useState(0); // Upload progress %
  const [error, setError] = useState('');                 // Error message
  const [preview, setPreview] = useState(null);          // Image preview URL
  
  // REF for file input element
  const fileInputRef = useRef(null);
  
  // API_BASE imported from apiClient - endpoints below use '/api'

  // FUNCTION: Handle file selection
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files); // Convert FileList to Array
    setError(''); // Clear previous errors
    
    console.log('📁 Files selected:', files.length);
    
    // VALIDATE FILES
    const validFiles = [];
    
    for (const file of files) {
      console.log(`🔍 Validating file: ${file.name} (${file.size} bytes, ${file.type})`);
      
      // CHECK FILE SIZE (convert MB to bytes)
      const maxSizeBytes = maxSize * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        setError(`File "${file.name}" is too large. Maximum size is ${maxSize}MB.`);
        continue; // Skip this file
      }
      
      // CHECK FILE TYPE (basic validation)
      if (acceptedTypes !== "*/*" && !file.type.match(acceptedTypes.replace('*', '.*'))) {
        setError(`File "${file.name}" type not allowed. Accepted types: ${acceptedTypes}`);
        continue; // Skip this file
      }
      
      validFiles.push(file);
      console.log(`✅ File validated: ${file.name}`);
    }
    
    if (validFiles.length === 0) {
      return; // No valid files
    }
    
    // STORE SELECTED FILES
    setSelectedFiles(validFiles);
    
    // CREATE PREVIEW for images
    if (validFiles.length > 0 && validFiles[0].type.startsWith('image/')) {
      const reader = new FileReader(); // Browser API to read files
      
      reader.onload = (e) => {
        setPreview(e.target.result); // Set preview to data URL
        console.log('🖼️ Image preview created');
      };
      
      reader.readAsDataURL(validFiles[0]); // Read file as data URL
    } else {
      setPreview(null); // Clear preview for non-images
    }
  };

  // FUNCTION: Upload files to server
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select files to upload');
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    setError('');
    
    try {
      // CREATE FORM DATA - Required for file uploads
      const formData = new FormData();
      
      // DETERMINE UPLOAD TYPE AND ENDPOINT
      let endpoint;
      let fieldName;
      
      if (acceptedTypes.includes('image') && !multiple) {
        // AVATAR UPLOAD - Single image
        endpoint = `${API_BASE}/api/upload/avatar`;
        fieldName = 'avatar';
        formData.append('userId', userId); // Add user ID for avatar
        console.log('📸 Preparing avatar upload');
      } else {
        // MULTIPLE FILES UPLOAD
        endpoint = `${API_BASE}/api/upload/files`;
        fieldName = 'files';
        console.log('📁 Preparing multiple files upload');
      }
      
      // ADD FILES TO FORM DATA
      selectedFiles.forEach((file, index) => {
        if (multiple) {
          formData.append(fieldName, file); // Multiple files with same field name
        } else {
          formData.append(fieldName, file); // Single file
        }
        console.log(`📎 Added file ${index + 1}: ${file.name}`);
      });
      
      // CREATE XMLHttpRequest for progress tracking
      // fetch() doesn't support upload progress, so we use XMLHttpRequest
      const xhr = new XMLHttpRequest();
      
      // TRACK UPLOAD PROGRESS
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
          console.log(`📊 Upload progress: ${progress}%`);
        }
      });
      
      // HANDLE UPLOAD COMPLETION
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // SUCCESS
          const response = JSON.parse(xhr.responseText);
          console.log('✅ Upload successful:', response);
          
          // CALL SUCCESS CALLBACK
          if (onUploadSuccess) {
            onUploadSuccess(response.data);
          }
          
          // RESET COMPONENT STATE
          setSelectedFiles([]);
          setPreview(null);
          setUploadProgress(0);
          
          // CLEAR FILE INPUT
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          
        } else {
          // ERROR RESPONSE
          const errorResponse = JSON.parse(xhr.responseText);
          throw new Error(errorResponse.error || 'Upload failed');
        }
      });
      
      // HANDLE UPLOAD ERROR
      xhr.addEventListener('error', () => {
        throw new Error('Network error during upload');
      });
      
      // START UPLOAD
      xhr.open('POST', endpoint);
      xhr.send(formData);
      
    } catch (err) {
      console.error('❌ Upload error:', err);
      setError(err.message || 'Upload failed');
      
      // CALL ERROR CALLBACK
      if (onUploadError) {
        onUploadError(err);
      }
    } finally {
      setUploading(false);
    }
  };

  // FUNCTION: Clear selected files
  const handleClear = () => {
    setSelectedFiles([]);
    setPreview(null);
    setError('');
    setUploadProgress(0);
    
    // CLEAR FILE INPUT
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    console.log('🧹 Cleared file selection');
  };

  // RENDER COMPONENT
  return (
    <div style={{
      border: '2px dashed #ddd',
      borderRadius: '8px',
      padding: '20px',
      textAlign: 'center',
      backgroundColor: '#f9f9f9'
    }}>
      {/* FILE INPUT */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        multiple={multiple}
        onChange={handleFileSelect}
        style={{ display: 'none' }} // Hide default input
        id="file-upload-input"
      />
      
      {/* UPLOAD AREA */}
      <label 
        htmlFor="file-upload-input"
        style={{
          display: 'block',
          cursor: 'pointer',
          padding: '20px',
          border: '2px dashed #007bff',
          borderRadius: '8px',
          backgroundColor: 'white',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#f0f8ff';
          e.target.style.borderColor = '#0056b3';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'white';
          e.target.style.borderColor = '#007bff';
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '10px' }}>📁</div>
        <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>
          Click to select {multiple ? 'files' : 'file'}
        </div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          or drag and drop {multiple ? 'files' : 'file'} here
        </div>
        <div style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
          Max size: {maxSize}MB • Types: {acceptedTypes}
        </div>
      </label>

      {/* ERROR MESSAGE */}
      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '10px',
          borderRadius: '4px',
          marginTop: '15px',
          fontSize: '14px'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* SELECTED FILES INFO */}
      {selectedFiles.length > 0 && (
        <div style={{ marginTop: '15px' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>Selected Files:</h4>
          {selectedFiles.map((file, index) => (
            <div key={index} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px',
              backgroundColor: 'white',
              borderRadius: '4px',
              marginBottom: '5px',
              fontSize: '14px'
            }}>
              <span>📄 {file.name}</span>
              <span style={{ color: '#666' }}>
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
          ))}
        </div>
      )}

      {/* IMAGE PREVIEW */}
      {preview && (
        <div style={{ marginTop: '15px' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>Preview:</h4>
          <img
            src={preview}
            alt="Preview"
            style={{
              maxWidth: '200px',
              maxHeight: '200px',
              borderRadius: '8px',
              border: '1px solid #ddd'
            }}
          />
        </div>
      )}

      {/* UPLOAD PROGRESS */}
      {uploading && (
        <div style={{ marginTop: '15px' }}>
          <div style={{ marginBottom: '10px' }}>
            Uploading... {uploadProgress}%
          </div>
          <div style={{
            width: '100%',
            height: '20px',
            backgroundColor: '#e9ecef',
            borderRadius: '10px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${uploadProgress}%`,
              height: '100%',
              backgroundColor: '#007bff',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      )}

      {/* ACTION BUTTONS */}
      {selectedFiles.length > 0 && !uploading && (
        <div style={{ marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={handleUpload}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📤 Upload {selectedFiles.length} {selectedFiles.length === 1 ? 'File' : 'Files'}
          </button>
          <button
            onClick={handleClear}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🗑️ Clear
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;