import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, CheckCircle, Shield } from 'lucide-react';
import branding from '../config/branding';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('Creating your account...');
    setLoading(true);
    try {
      await register({ name, email, password, role: 'USER' });
      setStatus('Registration successful. Redirecting to the dashboard.');
      setTimeout(() => navigate('/'), 700);
    } catch (err) {
      setStatus('');
      setError(err.message || 'Registration failed. Please verify your details.');
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
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{branding.ui.registerTitle}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
            {branding.ui.registerDescription}
          </p>
        </div>

        <div className="card animate-slide-in">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Create account</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Fill in your details to get started.</p>
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
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Full name</label>
              <input
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="John Doe"
              />
            </div>
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
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full min-h-[44px]">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            <span>Already have an account? </span>
            <Link to="/login" className="link-hover text-primary-600 dark:text-primary-400">Sign in</Link>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
          <p>{branding.copyright.full}</p>
          <p className="mt-1">{branding.copyright.attribution}</p>
        </div>
      </div>
    </div>
  );
}
