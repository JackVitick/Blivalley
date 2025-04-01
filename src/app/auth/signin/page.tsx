'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Mail, Github, ChevronRight } from 'lucide-react';

export default function SignIn() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<'social' | 'email'>('social');
  const [emailForm, setEmailForm] = useState({
    email: '',
    password: '',
    name: '',
    isLogin: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailForm({
      ...emailForm,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    if (emailForm.isLogin) {
      // Handle login
      const result = await signIn('credentials', {
        redirect: false,
        email: emailForm.email,
        password: emailForm.password,
      });
      
      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      } else {
        router.push('/dashboard');
      }
    } else {
      // Handle registration
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: emailForm.name,
            email: emailForm.email,
            password: emailForm.password,
          }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Registration failed');
        }
        
        // After registration, log in automatically
        const result = await signIn('credentials', {
          redirect: false,
          email: emailForm.email,
          password: emailForm.password,
        });
        
        if (result?.error) {
          setError(result.error);
          setIsLoading(false);
        } else {
          router.push('/dashboard');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setIsLoading(false);
      }
    }
  };

  const toggleAuthType = () => {
    setEmailForm({
      ...emailForm,
      isLogin: !emailForm.isLogin
    });
    setError(null);
  };
  
  const handleSocialSignIn = async (provider: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await signIn(provider, { callbackUrl: '/dashboard' });
    } catch (err) {
      setError('Authentication failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        {/* Logo Header */}
        <div className="pt-8 px-8 pb-6 text-center">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-2xl font-bold">B</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Blivalley</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Maintain momentum on what matters</p>
        </div>
        
        {/* Auth Content */}
        <div className="px-8 pb-8">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-800 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          {authMode === 'social' ? (
            /* Social Auth Options */
            <div className="space-y-3">
              <button 
                onClick={() => handleSocialSignIn('google')}
                disabled={isLoading}
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 flex items-center justify-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
              
              <button 
                onClick={() => handleSocialSignIn('github')}
                disabled={isLoading}
                className="w-full bg-gray-800 dark:bg-gray-700 text-white flex items-center justify-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                <Github className="h-5 w-5" />
                <span>Continue with GitHub</span>
              </button>
              
              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-gray-200 dark:border-gray-700 w-full absolute"></div>
                <div className="bg-white dark:bg-gray-800 px-3 z-10 text-sm text-gray-500 dark:text-gray-400">or</div>
              </div>
              
              <button 
                onClick={() => setAuthMode('email')}
                disabled={isLoading}
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 flex items-center justify-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                <Mail className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <span>Continue with email</span>
              </button>
              
              <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
                <p>By continuing, you agree to Blivalley's <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</a>.</p>
              </div>
            </div>
          ) : (
            /* Email Auth Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                {emailForm.isLogin ? 'Sign in to your account' : 'Create your account'}
              </h2>
              
              {!emailForm.isLogin && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required={!emailForm.isLogin}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Your name"
                    value={emailForm.name}
                    onChange={handleInputChange}
                  />
                </div>
              )}
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="you@example.com"
                  value={emailForm.email}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="••••••••"
                  value={emailForm.password}
                  onChange={handleInputChange}
                />
              </div>
              
              {emailForm.isLogin && (
                <div className="text-right">
                  <a href="#" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                    Forgot password?
                  </a>
                </div>
              )}
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <>
                    <span>{emailForm.isLogin ? 'Sign in' : 'Create account'}</span>
                    <ChevronRight className="h-5 w-5" />
                  </>
                )}
              </button>
              
              <div className="text-center mt-4">
                <button 
                  type="button"
                  onClick={toggleAuthType}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  {emailForm.isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>
              
              <button
                type="button"
                onClick={() => setAuthMode('social')}
                className="w-full text-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mt-4"
              >
                ← Back to all sign in options
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}