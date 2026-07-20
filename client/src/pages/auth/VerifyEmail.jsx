import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api.js';

export const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const verifiedRef = useRef(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (verifiedRef.current) return;
      verifiedRef.current = true;

      if (!token) {
        setStatus('error');
        setMessage('Verification token is missing. Please click the link directly from your email.');
        return;
      }

      try {
        const res = await api.get(`/auth/verify-email?token=${token}`);
        if (res.data && res.data.success) {
          setStatus('success');
          setMessage(res.data.message || 'Email verified successfully!');
        }
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Email verification failed. The token may be expired or invalid.');
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <div className="flex justify-center text-pink-600 font-extrabold text-3xl tracking-tight">
          Salon Shyani
        </div>

        {status === 'verifying' && (
          <div className="space-y-4 py-6">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-pink-600 border-t-transparent"></div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Verifying Email...</h2>
            <p className="text-sm text-slate-500">Please wait while we verify your activation link.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4 py-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-8 w-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Email Verified!</h2>
            <p className="text-sm text-slate-600">
              {message || 'Your email address has been successfully verified. You can now sign in.'}
            </p>
            <div className="pt-4">
              <Link
                to="/login"
                className="inline-flex rounded-md bg-pink-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-pink-600 transition"
              >
                Sign In
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4 py-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-8 w-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Verification Failed</h2>
            <p className="text-sm text-slate-600">{message}</p>
            <div className="pt-4 space-y-2">
              <Link
                to="/login"
                className="inline-flex w-full justify-center rounded-md bg-pink-700 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-600 transition"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default VerifyEmail;
