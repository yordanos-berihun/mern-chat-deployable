import React, { useState, useEffect } from 'react';
import { API_BASE } from './apiClient';

function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Test API connection
    fetch(`${API_BASE}/`)
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(err => setMessage('Failed to connect to server'));
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>MERN Chat App</h1>
      <p>Server Status: {message}</p>
      <div style={{ 
        border: '1px solid #ccc', 
        padding: '20px', 
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h3>Step 1: Basic Setup Complete ✅</h3>
        <p>Express server and React app are connected!</p>
      </div>
    </div>
  );
}

export default App;