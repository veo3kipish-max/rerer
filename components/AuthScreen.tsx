

import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { userService } from '../services/databaseService';

interface AuthScreenProps {
  onLogin: (user: UserProfile) => void;
}

// Telegram Login Widget callback
declare global {
  interface Window {
    onTelegramAuth?: (user: any) => void;
    google?: any;
    Telegram?: any;
  }
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTelegramButton, setShowTelegramButton] = useState(false);

  // Google Client ID - замените на ваш реальный Client ID из Google Cloud Console
  const rawClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
  const GOOGLE_CLIENT_ID = rawClientId.trim();

  // Telegram Bot Username - замените на ваш реальный бот
  const TELEGRAM_BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'YOUR_BOT_USERNAME';

  // Helper to sync user with database
  const syncUserWithDatabase = async (
    provider: 'google' | 'telegram' | 'guest',
    authId: string,
    name: string,
    email?: string,
    avatarUrl?: string
  ) => {
    try {
      const dbUser = await userService.getOrCreateUser(provider, authId, name, email, avatarUrl);
      if (dbUser) {
        onLogin({
          id: authId,
          name: dbUser.name,
          provider,
          avatarUrl: dbUser.avatar_url,
          dbUserId: dbUser.id,
          credits: dbUser.credits,
          subscriptionTier: dbUser.subscription_tier
        });
      } else {
        // Fallback if database fails
        console.error('Failed to get or create DB user');
        if (provider !== 'guest') {
          alert('Внимание: Не удалось подключиться к базе данных. Ваш прогресс и покупки не будут сохранены. Попробуйте обновить страницу.');
        }
        onLogin({ id: authId, name, provider, avatarUrl });
      }
    } catch (error) {
      console.error('Error syncing user:', error);
      if (provider !== 'guest') {
        alert('Внимание: Ошибка синхронизации с базой данных. Ваш прогресс и покупки не будут сохранены.');
      }
      // Fallback if database fails
      onLogin({ id: authId, name, provider, avatarUrl });
    }
  };

  // Google auth callback
  const handleGoogleCallback = async (response: any) => {
    setIsLoading(null);

    try {
      // Decode JWT token to get user info
      const payload = JSON.parse(atob(response.credential.split('.')[1]));

      await syncUserWithDatabase(
        'google',
        `g_${payload.sub}`,
        payload.name,
        payload.email,
        payload.picture
      );
    } catch (err) {
      console.error('Google login error:', err);
      setError('Ошибка входа через Google. Попробуйте снова.');
      setIsLoading(null);
    }
  };

  // Initialize Google OAuth
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
        });
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Initialize Telegram Login Widget & WebApp
  useEffect(() => {
    (async () => {
      console.log('[Auth] Initializing Telegram auth...');
      console.log('[Auth] Telegram object:', window.Telegram);

      // 1. Check for Telegram Web App (TWA)
      const initTelegramWebApp = async () => {
        if (window.Telegram?.WebApp) {
          console.log('[Auth] Telegram WebApp detected');
          console.log('[Auth] initDataUnsafe:', window.Telegram.WebApp.initDataUnsafe);

          // Initialize Telegram WebApp
          window.Telegram.WebApp.ready();
          window.Telegram.WebApp.expand();

          const twaUser = window.Telegram.WebApp.initDataUnsafe?.user;
          if (twaUser) {
            console.log('[Auth] Auto-login with Telegram user:', twaUser);
            await syncUserWithDatabase(
              'telegram',
              `tg_webapp_${twaUser.id}`,
              `${twaUser.first_name}${twaUser.last_name ? ' ' + twaUser.last_name : ''}`,
              undefined,
              twaUser.photo_url
            );
            return true;
          } else {
            console.log('[Auth] No user data in Telegram WebApp');
          }
        }
        return false;
      };

      // Try immediately
      if (initTelegramWebApp()) return;

      // Also try after a short delay (SDK might still be loading)
      setTimeout(() => {
        if (initTelegramWebApp()) return;
      }, 500);

      // 2. Check URL parameters for auth data (from redirect)
      const urlParams = new URLSearchParams(window.location.search);
      const tgId = urlParams.get('tg_id');
      const tgName = urlParams.get('tg_name');
      const tgPhoto = urlParams.get('tg_photo');

      if (tgId && tgName) {
        await syncUserWithDatabase(
          'telegram',
          `tg_url_${tgId}`,
          decodeURIComponent(tgName),
          undefined,
          tgPhoto ? decodeURIComponent(tgPhoto) : undefined
        );
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
        return;
      }

      // 3. Standard Widget Setup
      // Set up global callback for Telegram
      window.onTelegramAuth = async (user: any) => {
        setIsLoading(null);
        await syncUserWithDatabase(
          'telegram',
          `tg_${user.id}`,
          `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`,
          undefined,
          user.photo_url
        );
      };

      // Inject Script
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.async = true;
      script.setAttribute('data-telegram-login', TELEGRAM_BOT_USERNAME);
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      script.setAttribute('data-request-access', 'write');

      const telegramContainer = document.getElementById('telegram-login-container');
      if (telegramContainer && TELEGRAM_BOT_USERNAME !== 'YOUR_BOT_USERNAME') {
        // Clear previous to avoid duplicates
        telegramContainer.innerHTML = '';
        telegramContainer.appendChild(script);

        // Show fallback button after 3 seconds if widget doesn't load
        setTimeout(() => {
          if (telegramContainer.children.length === 0 || telegramContainer.querySelector('iframe') === null) {
            setShowTelegramButton(true);
          }
        }, 3000);
      } else {
        setShowTelegramButton(true);
      }

      return () => {
        // Cleanup script is tricky with Telegram widget as it replaces the container content
        // We rely on container clearing on re-mount
      };
    })(); // Close and call async IIFE
  }, []);

  // Render Google Button
  useEffect(() => {
    // Function to attempt rendering
    const tryRenderButton = () => {
      if (window.google && GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID') {
        const btnContainer = document.getElementById("googleBtnContainer");
        if (btnContainer) {
          // Clear previous content just in case
          btnContainer.innerHTML = '';

          try {
            window.google.accounts.id.renderButton(
              btnContainer,
              { theme: "filled_black", size: "large", shape: "pill", width: "100%", text: "continue_with" }
            );
            console.log("Google button rendered successfully");
          } catch (e) {
            console.error("Error rendering Google button:", e);
          }
        }
        return true;
      }
      return false;
    };

    // Attempt immediately
    if (tryRenderButton()) return;

    // Retry every 500ms if not ready yet (script loading)
    const intervalId = setInterval(() => {
      if (tryRenderButton()) {
        clearInterval(intervalId);
      }
    }, 500);

    // Cleanup
    return () => clearInterval(intervalId);
  }, [isLoading, GOOGLE_CLIENT_ID]);

  const handleTelegramLogin = () => {
    setIsLoading('telegram');
    setError(null);

    if (TELEGRAM_BOT_USERNAME === 'YOUR_BOT_USERNAME') {
      // Fallback to demo mode if no bot configured
      setTimeout(() => {
        onLogin({
          id: 'tg_demo_' + Math.random().toString(36).substr(2, 9),
          name: 'Telegram User (Demo)',
          provider: 'telegram',
        });
        setIsLoading(null);
      }, 1000);
      return;
    }

    // The actual login happens via the Telegram widget button
    setIsLoading(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-purple-900/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-gemini-900/20 rounded-full blur-[120px] animate-pulse"></div>

      <div className="relative z-10 w-full max-w-md p-8 mx-4">
        {/* Logo / Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-gemini-500 to-purple-600 shadow-lg shadow-purple-900/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">AI Фотостудия</h1>
          <p className="text-slate-400">Войдите, чтобы создавать профессиональные фотосеты</p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl space-y-4">

          {/* Telegram Loading State */}
          {window.Telegram?.WebApp && (
            <div className="text-center py-2">
              <div className="inline-flex items-center gap-2 text-slate-400 text-sm">
                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Проверка авторизации Telegram...</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700/50 text-red-200 rounded-lg text-sm flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Google Button */}
          {/* Google Button Container */}
          <div className="w-full flex justify-center">
            <div id="googleBtnContainer" className="w-full"></div>
          </div>

          {/* Demo/Fallback Google Button (only shown if no Client ID) */}
          {GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID' && (
            <button
              onClick={() => {
                // Auto-demo login logic
                setIsLoading('google');
                setTimeout(() => {
                  onLogin({
                    id: 'g_demo_' + Math.random().toString(36).substr(2, 9),
                    name: 'Google User (Demo)',
                    provider: 'google',
                    avatarUrl: 'https://lh3.googleusercontent.com/a/default-user=s96-c'
                  });
                  setIsLoading(null);
                }, 1000);
              }}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all shadow-md"
            >
              <span>Войти через Google (Demo)</span>
            </button>
          )}

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-800 px-2 text-slate-500">или</span>
            </div>
          </div>

          {/* Telegram Login Options */}
          {/* Widget Container */}
          <div className="flex justify-center w-full min-h-[40px]">
            <div id="telegram-login-container" className="flex justify-center"></div>
          </div>

          {/* Alternative Telegram Button (if widget fails) */}
          {showTelegramButton && (
            <button
              onClick={() => {
                window.open(`https://t.me/${TELEGRAM_BOT_USERNAME}?start=webapp_auth`, '_blank');
              }}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#24A1DE] text-white font-semibold rounded-xl hover:bg-[#208FC5] transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 11.944 0Zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635Z" />
              </svg>
              <span>Войти через Telegram</span>
            </button>
          )}

          {/* Fallback Custom Button (Only for Demo/Dev mode) */}
          {TELEGRAM_BOT_USERNAME === 'YOUR_BOT_USERNAME' && (
            <button
              onClick={handleTelegramLogin}
              disabled={!!isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#24A1DE] text-white font-semibold rounded-xl hover:bg-[#208FC5] transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:scale-100 shadow-md"
            >
              {isLoading === 'telegram' ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 11.944 0Zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635Z" />
                </svg>
              )}
              <span>Войти через Telegram (Demo)</span>
            </button>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">
          Продолжая, вы соглашаетесь с условиями использования и политикой конфиденциальности.
        </p>
      </div>
    </div>
  );
};
