import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/authContext.jsx';

export const Register = () => {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    const result = await register(fullName, email, phone, password, confirmPassword);

    setLoading(false);
    if (result.success) {
      setSuccess(result.message);
      // Clear form
      setFullName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setConfirmPassword('');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div>
          <div className="flex justify-center text-pink-600 font-extrabold text-3xl tracking-tight">
            Salon Shyani
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900">
            Create customer account
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Or{' '}
            <Link to="/login" className="font-semibold text-pink-600 hover:text-pink-500">
              sign in to your existing account
            </Link>
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-100 flex items-start space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5 flex-shrink-0 text-red-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="rounded-lg bg-emerald-50 p-6 border border-emerald-100 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Registration Complete</h3>
            <p className="text-sm text-slate-600">
              {success || 'A verification link has been sent to your email. Please check your inbox and click the link to activate your account.'}
            </p>
            <div className="pt-4">
              <Link
                to="/login"
                className="inline-flex rounded-md bg-pink-700 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-600 transition"
              >
                Go to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="full-name" className="block text-sm font-medium text-slate-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="full-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm focus:border-pink-500 focus:outline-none focus:ring-pink-500 sm:text-sm"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-slate-700">
                Email address <span className="text-red-500">*</span>
              </label>
              <input
                id="email-address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm focus:border-pink-500 focus:outline-none focus:ring-pink-500 sm:text-sm"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label htmlFor="phone-number" className="block text-sm font-medium text-slate-700">
                Phone Number (Optional)
              </label>
              <input
                id="phone-number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm focus:border-pink-500 focus:outline-none focus:ring-pink-500 sm:text-sm"
                placeholder="+94 77 123 4567"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm focus:border-pink-500 focus:outline-none focus:ring-pink-500 sm:text-sm"
                placeholder="Min. 6 characters"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm focus:border-pink-500 focus:outline-none focus:ring-pink-500 sm:text-sm"
                placeholder="Confirm password"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-md bg-pink-700 px-4 py-2 text-sm font-bold text-white hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 transition"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  'Sign Up'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
export default Register;
