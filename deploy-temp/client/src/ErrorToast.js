import React from 'react';
import { useError } from './ErrorContext';

const ErrorToast = () => {
  const { errors, removeError } = useError();

  if (errors.length === 0) return null;

  return (
    <div className="error-toast-container">
      {errors.map(error => (
        <div
          key={error.id}
          className={`error-toast ${error.type}`}
          onClick={() => removeError(error.id)}
        >
          {error.message}
          <button className="error-close">×</button>
        </div>
      ))}
    </div>
  );
};

export default ErrorToast;