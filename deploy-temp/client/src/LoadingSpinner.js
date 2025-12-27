import React from 'react';

const LoadingSpinner = ({ size = 'medium', text = 'Loading...' }) => (
  <div className={`loading-spinner ${size}`}>
    <div className="spinner"></div>
    <span>{text}</span>
  </div>
);

export default LoadingSpinner;