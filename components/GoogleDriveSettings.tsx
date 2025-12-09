import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

interface GoogleDriveSettingsProps {
    userId: string;
    onConnect?: () => void;
    onDisconnect?: () => void;
}

export const GoogleDriveSettings: React.FC<GoogleDriveSettingsProps> = ({
    userId,
    onConnect,
    onDisconnect
}) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [connectedAt, setConnectedAt] = useState<string | null>(null);

    useEffect(() => {
        checkConnection();
    }, [userId]);

    const checkConnection = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('google_drive_token, google_drive_connected_at')
                .eq('id', userId)
                .single();

            if (!error && data) {
                setIsConnected(!!data.google_drive_token);
                setConnectedAt(data.google_drive_connected_at);
            }
        } catch (e) {
            console.error('Failed to check Drive connection', e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnect = async () => {
        try {
            // Get Google OAuth URL from environment
            const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

            if (!clientId) {
                alert('Google Client ID not configured. Please contact support.');
                return;
            }

            const redirectUri = `${window.location.origin}/google-drive-callback`;
            const scope = 'https://www.googleapis.com/auth/drive.file';
            const state = JSON.stringify({ userId });

            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
                `client_id=${clientId}` +
                `&redirect_uri=${encodeURIComponent(redirectUri)}` +
                `&response_type=code` +
                `&scope=${encodeURIComponent(scope)}` +
                `&access_type=offline` +
                `&prompt=consent` +
                `&state=${encodeURIComponent(state)}`;

            // Open in NEW TAB (fixes blocking in Telegram/Iframes)
            window.open(authUrl, '_blank');
            setIsLoading(true);

            // Start polling for connection (since we can't use postMessage from external browser)
            const startTime = Date.now();
            const pollInterval = setInterval(async () => {
                // Stop after 2 minutes
                if (Date.now() - startTime > 120000) {
                    clearInterval(pollInterval);
                    setIsLoading(false);
                    return;
                }

                const { data } = await supabase
                    .from('users')
                    .select('google_drive_token, google_drive_connected_at')
                    .eq('id', userId)
                    .single();

                if (data && data.google_drive_token) {
                    clearInterval(pollInterval);
                    setIsConnected(true);
                    setConnectedAt(data.google_drive_connected_at);
                    setIsLoading(false);
                    if (onConnect) onConnect();
                    alert('✅ Google Drive connected successfully!');
                }
            }, 3000); // Check every 3 seconds

        } catch (error) {
            console.error('Failed to connect Google Drive', error);
            alert('Failed to connect Google Drive. Please try again.');
            setIsLoading(false);
        }
    };

    const handleDisconnect = async () => {
        if (!confirm('Are you sure you want to disconnect Google Drive? Your existing photos will remain in Drive.')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('users')
                .update({
                    google_drive_token: null,
                    google_drive_refresh_token: null,
                    google_drive_folder_id: null,
                    google_drive_connected_at: null
                })
                .eq('id', userId);

            if (!error) {
                setIsConnected(false);
                setConnectedAt(null);
                if (onDisconnect) onDisconnect();
                alert('✅ Google Drive disconnected successfully!');
            }
        } catch (error) {
            console.error('Failed to disconnect Google Drive', error);
            alert('Failed to disconnect. Please try again.');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-4">
                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isConnected ? 'bg-green-600' : 'bg-slate-600'
                    }`}>
                    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z" />
                    </svg>
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">Google Drive</h3>
                    <p className="text-sm text-slate-400">
                        {isConnected ? 'Connected' : 'Auto-save your photos'}
                    </p>
                </div>
            </div>

            {isConnected ? (
                <>
                    <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-2 text-green-400 text-sm mb-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="font-medium">Google Drive Connected</span>
                        </div>
                        {connectedAt && (
                            <p className="text-xs text-slate-400 ml-6">
                                Since {new Date(connectedAt).toLocaleDateString('ru-RU', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                })}
                            </p>
                        )}
                    </div>

                    <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3 mb-4">
                        <div className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                All generated photos will be automatically saved to your Google Drive in organized folders.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleDisconnect}
                        className="w-full py-2.5 bg-red-600/80 hover:bg-red-600 text-white font-medium rounded-lg transition-colors text-sm"
                    >
                        Disconnect Google Drive
                    </button>
                </>
            ) : (
                <>
                    <div className="bg-slate-800/50 rounded-lg p-3 mb-4">
                        <ul className="space-y-2 text-sm text-slate-300">
                            <li className="flex items-start gap-2">
                                <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Auto-save all generated photos</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Organized in folders by date</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Access from any device</span>
                            </li>
                        </ul>
                    </div>

                    {/* Hidden Link for Auth */}
                    <a
                        id="google-auth-link"
                        href={`https://accounts.google.com/o/oauth2/v2/auth?client_id=${import.meta.env.VITE_GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(`${window.location.origin}/google-drive-callback`)}&response_type=code&scope=${encodeURIComponent('https://www.googleapis.com/auth/drive.file')}&access_type=offline&prompt=consent&state=${encodeURIComponent(JSON.stringify({ userId }))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden"
                    >
                        Connect
                    </a>

                    <button
                        onClick={() => {
                            // Trigger the link click programmatically or fallback to manual click
                            const link = document.getElementById('google-auth-link') as HTMLAnchorElement;
                            if (link) {
                                link.click();
                                setIsLoading(true);
                                // Start polling
                                const startTime = Date.now();
                                const pollInterval = setInterval(async () => {
                                    if (Date.now() - startTime > 120000) {
                                        clearInterval(pollInterval);
                                        setIsLoading(false);
                                        return;
                                    }
                                    const { data } = await supabase
                                        .from('users')
                                        .select('google_drive_token, google_drive_connected_at')
                                        .eq('id', userId)
                                        .single();
                                    if (data && data.google_drive_token) {
                                        clearInterval(pollInterval);
                                        setIsConnected(true);
                                        setConnectedAt(data.google_drive_connected_at);
                                        setIsLoading(false);
                                        if (onConnect) onConnect();
                                        alert('✅ Google Drive connected successfully!');
                                    }
                                }, 3000);
                            }
                        }}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z" />
                        </svg>
                        Connect Google Drive (Open Browser)
                    </button>
                </>
            )}
        </div>
    );
};
