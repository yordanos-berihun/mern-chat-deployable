// MERN Stack Backend - Error Handling Middleware
// Centralized error handling for consistent error responses

// Global error handling middleware - Catches all errors in the application
const errorHandler = (err, req, res, next) => {
  // Log error details for debugging (in production, use proper logging service)
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Default error response
  let error = {
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  // Handle specific error types
  
  // MongoDB Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    error.message = 'Validation Error';
    error.details = messages;
    return res.status(400).json(error);
  }

  // MongoDB Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error.message = `Duplicate ${field}`;
    error.details = `${field} already exists`;
    return res.status(409).json(error);
  }

  // MongoDB Cast Error (Invalid ObjectId)
  if (err.name === 'CastError') {
    error.message = 'Invalid ID format';
    error.details = 'The provided ID is not valid';
    return res.status(400).json(error);
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    return res.status(401).json(error);
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    return res.status(401).json(error);
  }

  // Default to 500 server error
  res.status(err.statusCode || 500).json(error);
};

// 404 Not Found middleware - Handles routes that don't exist
const notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

module.exports = { errorHandler, notFound };