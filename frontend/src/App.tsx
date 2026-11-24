import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { Loader } from './components/common/Loader';

const MainRouter: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader label="Initializing workspace..." />
      </div>
    );
  }

  return user ? <DashboardPage /> : <LoginPage />;
};

export const App: React.FC = () => {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'placeholder_client_id';

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <MainRouter />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
};

export default App;