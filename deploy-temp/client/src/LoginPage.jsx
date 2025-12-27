import { useState } from "react";
import { api } from './apiClient';

function LoginPage({ setAuthUser }) {
  // SIMPLIFIED LOGIN - Just enter email to login (no password needed for testing)
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  // This runs when user submits the login form
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    try {
      // Fetch users via centralized API client
      const result = await api.get('/api/users');
      const user = result.data.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        setError("User not found. Please check your email.");
        return;
      }

      // Set authenticated user
      setAuthUser({
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email
      });

    } catch (err) {
      setError("Login failed. Please try again.");
      console.error(err);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>🔐 Login to MERN App</h2>

        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '20px',
            border: '1px solid #f5c6cb'
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
              Email Address:
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button 
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Login
          </button>
        </form>

        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#e7f3ff',
          borderRadius: '4px',
          fontSize: '14px',
          color: '#004085'
        }}>
          <strong>ℹ️ Test Mode:</strong> Enter any email from your user list to login.
          <br/>
          Example: <code>ab@example.com</code>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
