"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Eye, EyeOff, User } from 'lucide-react';
import { Input } from '@/components/shadcnUI/Input';
import { Button } from '@/components/shadcnUI/Button';
import { useMithrilAuth } from './MithrilAuthContext';

interface MithrilLoginPageProps {
  redirectTo?: string;
}

type Tab = 'login' | 'register';

const MithrilLoginPage: React.FC<MithrilLoginPageProps> = ({ redirectTo = '/projects' }) => {
  const [tab, setTab] = useState<Tab>('login');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register state
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerDisplayName, setRegisterDisplayName] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { login, register } = useMithrilAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await login(loginEmail, loginPassword);
      if (result.success) {
        router.push(redirectTo);
      } else {
        setError(result.error || 'Login failed');
      }
    } catch {
      setError('An error occurred during login');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (registerPassword !== registerConfirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (registerPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await register(registerEmail, registerPassword, registerDisplayName);
      if (result.success) {
        router.push(redirectTo);
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch {
      setError('An error occurred during registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab);
    setError('');
  };

  const handleGoBack = () => {
    router.push('/');
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white dark:bg-[#211F21] rounded-xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#DB2777]/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-[#DB2777]" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Mithril</h1>
        </div>

        {/* Tabs */}
        <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 mb-6">
          <button
            type="button"
            onClick={() => handleTabChange('login')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              tab === 'login'
                ? 'bg-[#DB2777] text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('register')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              tab === 'register'
                ? 'bg-[#DB2777] text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Create Account
          </button>
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full h-12 pl-10 bg-gray-50 dark:bg-[#2a282a] border-gray-200 dark:border-gray-700"
                autoFocus
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type={showLoginPassword ? 'text' : 'password'}
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full h-12 pl-10 pr-10 bg-gray-50 dark:bg-[#2a282a] border-gray-200 dark:border-gray-700"
                required
              />
              <button
                type="button"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-[#DB2777] hover:bg-[#DB2777]/90 text-white font-medium disabled:opacity-50"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="email"
                placeholder="Email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                className="w-full h-12 pl-10 bg-gray-50 dark:bg-[#2a282a] border-gray-200 dark:border-gray-700"
                autoFocus
                required
              />
            </div>

            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Display name"
                value={registerDisplayName}
                onChange={(e) => setRegisterDisplayName(e.target.value)}
                className="w-full h-12 pl-10 bg-gray-50 dark:bg-[#2a282a] border-gray-200 dark:border-gray-700"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type={showRegisterPassword ? 'text' : 'password'}
                placeholder="Password (min. 8 characters)"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                className="w-full h-12 pl-10 pr-10 bg-gray-50 dark:bg-[#2a282a] border-gray-200 dark:border-gray-700"
                required
              />
              <button
                type="button"
                onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showRegisterPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type={showRegisterPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                value={registerConfirmPassword}
                onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                className="w-full h-12 pl-10 bg-gray-50 dark:bg-[#2a282a] border-gray-200 dark:border-gray-700"
                required
              />
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-[#DB2777] hover:bg-[#DB2777]/90 text-white font-medium disabled:opacity-50"
            >
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
        )}

        <button
          onClick={handleGoBack}
          className="w-full mt-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Go back to home
        </button>
      </div>
    </div>
  );
};

export default MithrilLoginPage;
