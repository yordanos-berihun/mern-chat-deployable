// Simple input sanitization without external dependencies
const sanitizeInput = (req, res, next) => {
  // Simple HTML escape function
  const escapeHtml = (text) => {
    if (typeof text !== 'string') return text;
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  };

  // Recursively sanitize object properties
  const sanitizeObject = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        // Trim whitespace and escape HTML
        obj[key] = escapeHtml(obj[key].trim());
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };

  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    sanitizeObject(req.query);
  }

  next();
};

// Validate message content
const validateMessage = (req, res, next) => {
  const { content } = req.body;
  
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ message: 'Message content is required' });
  }
  
  if (content.length > 1000) {
    return res.status(400).json({ message: 'Message too long (max 1000 characters)' });
  }
  
  next();
};

module.exports = {
  sanitizeInput,
  validateMessage
};