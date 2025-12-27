import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { ChatProvider } from './ChatContext';
import { ErrorProvider } from './ErrorContext';
import { ThemeProvider } from './ThemeContext';
import AuthForm from './AuthForm';
import ResetPassword from './ResetPassword';
import VerifyEmail from './VerifyEmail';
import EnhancedChatApp from './EnhancedChatApp';
import ErrorToast from './ErrorToast';

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <>
      <ErrorToast />
      {user ? <EnhancedChatApp /> : <AuthForm />}
    </>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ErrorProvider>
          <AuthProvider>
            <ChatProvider>
              <Routes>
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/verify-email/:token" element={<VerifyEmail />} />
                <Route path="/*" element={<AppContent />} />
              </Routes>
            </ChatProvider>
          </AuthProvider>
        </ErrorProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;