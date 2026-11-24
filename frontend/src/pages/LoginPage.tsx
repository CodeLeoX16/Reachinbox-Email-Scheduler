import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { loginSuccess } = useAuth();
  const [email, setEmail] = useState('oliver.brown@domain.io');
  const [password, setPassword] = useState('••••••••••••');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleOAuth = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError('');
      try {
        const { data } = await authApi.loginWithGoogle({
          accessToken: tokenResponse.access_token,
        });
        loginSuccess(data.token, data.user);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Google login failed');
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('Google OAuth popup closed or failed'),
  });

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await authApi.loginDemo();
      loginSuccess(data.token, data.user);
    } catch {
      setError('Unable to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-[310px] p-7 shadow-[0_8px_30px_rgba(15,23,42,0.12)] bg-white">
        <h1 className="text-lg font-semibold text-center text-gray-800 mb-5">Login</h1>

        {/* Real Google OAuth Button */}
        <button
          type="button"
          onClick={() => handleGoogleOAuth()}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg bg-brand-mint hover:bg-brand-mintBorder/60 text-gray-800 text-xs font-medium transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
            />
          </svg>
          Login with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="h-px bg-gray-100 flex-1" />
          <span className="text-[11px] text-gray-400">or sign up through email</span>
          <div className="h-px bg-gray-100 flex-1" />
        </div>

        {/* Form */}
        <form onSubmit={handleDemoSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email ID"
            className="w-full px-3.5 py-2.5 text-xs bg-gray-100/80 rounded-lg outline-none focus:bg-white focus:ring-1 focus:ring-brand-green"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-3.5 py-2.5 text-xs bg-gray-100/80 rounded-lg outline-none focus:bg-white focus:ring-1 focus:ring-brand-green"
          />

          {error && <p className="text-xs text-red-600 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-brand-green hover:bg-brand-greenHover text-white text-xs font-semibold transition-colors mt-2"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};