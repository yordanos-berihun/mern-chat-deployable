import React, { createContext, useContext, useState, useCallback } from 'react';

const ErrorContext = createContext();

export const ErrorProvider = ({ children }) => {
  const [errors, setErrors] = useState([]);

  const addError = useCallback((error, type = 'error') => {
    const errorObj = {
      id: Date.now(),
      message: typeof error === 'string' ? error : error.message,
      type,
      timestamp: new Date().toISOString()
    };
    
    setErrors(prev => [...prev, errorObj]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeError(errorObj.id);
    }, 5000);
    
    return errorObj.id;
  }, []);

  const removeError = useCallback((id) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return (
    <ErrorContext.Provider value={{ errors, addError, removeError, clearErrors }}>
      {children}
    </ErrorContext.Provider>
  );
};

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within ErrorProvider');
  }
  return context;
};