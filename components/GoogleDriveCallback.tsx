import React, { useEffect, useState } from 'react';

export const GoogleDriveCallback: React.FC = () => {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Connecting to Google Drive...');

    useEffect(() => {
        handleCallback();
    }, []);

    const handleCallback = async () => {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const state = urlParams.get('state');
            const error = urlParams.get('error');

            if (error) {
                throw new Error(`Authorization failed: ${error}`);
            }

            if (!code) {
                throw new Error('No authorization code received');
            }

            const parsedState = state ? JSON.parse(decodeURIComponent(state)) : {};
            const { userId } = parsedState;

            if (!userId) {
                throw new Error('No user ID in state');
            }

            const response = await fetch(
                'https://ndrdksmdkhljymuvxjly.supabase.co/functions/v1/google-drive-connect',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_0aETJTgJJ5SZDXppAfRTnw_LO2_J_j6'}`
                    },
                    body: JSON.stringify({ code, userId, redirectUri: window.location.origin + '/google-drive-callback' })
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to connect Google Drive');
            }

            setStatus('success');
            setMessage('✅ Google Drive connected successfully!');

            if (window.opener) {
                window.opener.postMessage({ type: 'google-drive-connected' }, '*');
            }

            setTimeout(() => {
                window.close();
            }, 2000);

        } catch (error: any) {
            console.error('Google Drive callback error:', error);
            setStatus('error');
            setMessage(error.message || 'Failed to connect Google Drive');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl p-8 max-w-md w-full">
                {status === 'loading' && (
                    <div className="text-center">
                        <div className="inline-block w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <h2 className="text-xl font-bold text-white mb-2">Connecting...</h2>
                        <p className="text-slate-400">{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Success!</h2>
                        <p className="text-slate-400">{message}</p>
                        <p className="text-sm text-slate-500 mt-4">This window will close automatically...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Connection Failed</h2>
                        <p className="text-slate-400 mb-6">{message}</p>
                        <button
                            onClick={() => window.close()}
                            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                        >
                            Close Window
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
