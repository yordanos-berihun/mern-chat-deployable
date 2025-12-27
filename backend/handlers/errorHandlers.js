const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  const isDev = process.env.NODE_ENV === 'development';
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: 'Validation error', details: isDev ? err.message : 'Invalid input' });
  }
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID' });
  if (err.code === 11000) return res.status(400).json({ message: 'Duplicate entry' });
  
  res.status(500).json({ message: 'Server error', details: isDev ? err.message : 'Something went wrong' });
};

const notFoundHandler = (req, res) => res.status(404).json({ message: 'Route not found' });

module.exports = { errorHandler, notFoundHandler };
