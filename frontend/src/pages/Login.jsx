import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, CheckCircle, Shield } from 'lucide-react';
import branding from '../config/branding';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('Signing in...');
    setLoading(true);
    try {
      const userData = await login(email, password);
      setStatus('Welcome back — redirecting to your dashboard.');
      const role = userData.role;
      const redirectPath = role === 'ADMIN' ? '/admin' : role === 'SUPERVISOR' ? '/supervisor' : role === 'OFFICIAL' ? '/official' : '/';
      setTimeout(() => navigate(redirectPath), 650);
    } catch (err) {
      setStatus('');
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <div className="w-full max-w-lg sm:max-w-xl">
        <div className="mb-10 text-center px-2 sm:px-0">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-900 text-white shadow-lg shadow-slate-200/40 dark:bg-slate-800 dark:shadow-slate-900/40">
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{branding.ui.loginTitle}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
            {branding.ui.loginDescription}
          </p>
        </div>

        <div className="card animate-slide-in">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Sign in</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Enter your credentials to access the system.</p>
            </div>
          </div>

          {(error || status) && (
            <div role="alert" className={`status-panel ${error ? 'status-panel-error' : 'status-panel-success'} animate-fade-in`}>
              {error ? (
                <>
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span>{status}</span>
                </>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Email</label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Password</label>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full min-h-[44px]">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            <span>Don't have an account? </span>
            <Link to="/register" className="link-hover text-primary-600 dark:text-primary-400">Create one</Link>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
          <p>{branding.copyright.full}</p>
          <p className="mt-1">{branding.copyright.attribution}</p>
        </div>

        <div className="demo-card mt-6 sm:mt-8">
          <p className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">Demo account credentials</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 flex flex-col">
              <div className="flex items-start justify-between">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Admin</p>
                <button
                  type="button"
                  onClick={() => { setEmail('admin@example.com'); setPassword('admin123'); setError(''); setStatus(''); }}
                  className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors px-2 py-1 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20"
                >
                  Use
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">admin@example.com</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">admin123</p>
            </div>
            <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 flex flex-col">
              <div className="flex items-start justify-between">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Supervisor</p>
                <button
                  type="button"
                  onClick={() => { setEmail('supervisor@example.com'); setPassword('supervisor123'); setError(''); setStatus(''); }}
                  className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors px-2 py-1 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20"
                >
                  Use
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">supervisor@example.com</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">supervisor123</p>
            </div>
            <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 flex flex-col">
              <div className="flex items-start justify-between">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Official</p>
                <button
                  type="button"
                  onClick={() => { setEmail('official@example.com'); setPassword('official123'); setError(''); setStatus(''); }}
                  className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors px-2 py-1 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20"
                >
                  Use
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">official@example.com</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">official123</p>
            </div>
            <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 flex flex-col">
              <div className="flex items-start justify-between">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">User</p>
                <button
                  type="button"
                  onClick={() => { setEmail('user@example.com'); setPassword('user123'); setError(''); setStatus(''); }}
                  className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors px-2 py-1 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20"
                >
                  Use
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">user@example.com</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">user123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
