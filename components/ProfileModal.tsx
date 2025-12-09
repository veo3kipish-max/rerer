import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { generationService } from '../services/databaseService';
import { GoogleDriveSettings } from './GoogleDriveSettings';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: UserProfile;
    onOpenPricing: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
    isOpen,
    onClose,
    currentUser,
    onOpenPricing
}) => {
    const [recentGenerations, setRecentGenerations] = useState<any[]>([]);
    const [stats, setStats] = useState({ total: 0, successful: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'history' | 'settings'>('history');

    useEffect(() => {
        if (isOpen && currentUser.dbUserId) {
            loadData();
        }
    }, [isOpen, currentUser.dbUserId]);

    const loadData = async () => {
        if (!currentUser.dbUserId) return;

        setIsLoading(true);
        try {
            const [gens, userStats] = await Promise.all([
                generationService.getUserGenerations(currentUser.dbUserId, 10),
                generationService.getUserStats(currentUser.dbUserId)
            ]);

            setRecentGenerations(gens);
            setStats(userStats);
        } catch (e) {
            console.error("Failed to load profile data", e);
        } finally {
            setIsLoading(false);
        }
    };

    const getTierColor = (tier?: string) => {
        switch (tier) {
            case 'free': return 'bg-slate-600 text-slate-200';
            case 'light': return 'bg-blue-600 text-blue-100';
            case 'pro': return 'bg-purple-600 text-purple-100';
            case 'ultra': return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white';
            default: return 'bg-slate-600 text-slate-200';
        }
    };

    const getTierName = (tier?: string) => {
        switch (tier) {
            case 'free': return 'Бесплатный';
            case 'light': return 'Light';
            case 'pro': return 'Pro';
            case 'ultra': return 'Ultra';
            default: return 'Бесплатный';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-lg md:max-w-xl bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]">

                {/* Header with Gradient */}
                <div className="relative bg-gradient-to-br from-purple-900/50 via-slate-800 to-slate-800 p-5 border-b border-slate-700 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="flex items-center gap-4">
                        {currentUser.avatarUrl ? (
                            <img
                                src={currentUser.avatarUrl}
                                alt="Avatar"
                                className="w-20 h-20 rounded-full border-4 border-purple-500/30 shadow-lg shadow-purple-900/30"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-purple-900/30">
                                {currentUser.name.charAt(0).toUpperCase()}
                            </div>
                        )}

                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-white mb-1">{currentUser.name}</h2>
                            <p className="text-sm text-slate-400 mb-2">{currentUser.email || `@${currentUser.provider}`}</p>

                            <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getTierColor(currentUser.subscriptionTier)}`}>
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    {getTierName(currentUser.subscriptionTier)}
                                </span>

                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${currentUser.credits && currentUser.credits > 0 ? 'bg-green-900/50 text-green-400 border border-green-700/30' : 'bg-red-900/50 text-red-400 border border-red-700/30'}`}>
                                    <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    {currentUser.credits || 0} кредитов
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button
                            onClick={onOpenPricing}
                            className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-900/30"
                        >
                            <div className="absolute inset-0 bg-white/10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                            <div className="relative flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Пополнить баланс
                            </div>
                        </button>

                        <button
                            onClick={onOpenPricing}
                            className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-900/30"
                        >
                            <div className="absolute inset-0 bg-white/10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                            <div className="relative flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Купить подписку
                            </div>
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-white mb-1">{currentUser.credits || 0}</div>
                            <div className="text-xs text-slate-400 uppercase tracking-wide">Кредиты</div>
                        </div>

                        <div className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-purple-400 mb-1">
                                {stats.total}
                            </div>
                            <div className="text-xs text-slate-400 uppercase tracking-wide">Генераций</div>
                        </div>

                        <div className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-green-400 mb-1">
                                {stats.successful}
                            </div>
                            <div className="text-xs text-slate-400 uppercase tracking-wide">Успешных</div>
                        </div>

                        <div className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-blue-400 mb-1">
                                {currentUser.subscriptionTier === 'free' ? '∞' : '30'}
                            </div>
                            <div className="text-xs text-slate-400 uppercase tracking-wide">Дней</div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-slate-700 gap-4">
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === 'history' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                История
                            </div>
                            {activeTab === 'history' && (
                                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500 rounded-t-full"></div>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === 'settings' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Настройки
                            </div>
                            {activeTab === 'settings' && (
                                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500 rounded-t-full"></div>
                            )}
                        </button>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'history' && (
                        /* Recent Generations Section */
                        <div>
                            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                История генераций
                            </h3>

                            <div className="bg-slate-700/20 border border-slate-600/30 rounded-xl overflow-hidden">
                                {isLoading ? (
                                    <div className="p-8 text-center text-slate-400">
                                        <div className="inline-block w-8 h-8 border-4 border-slate-600 border-t-purple-500 rounded-full animate-spin"></div>
                                        <p className="mt-2 text-sm">Загрузка...</p>
                                    </div>
                                ) : recentGenerations.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400">
                                        <svg className="w-16 h-16 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <p>Пока нет генераций</p>
                                        <p className="text-xs mt-1">Создайте свою первую фотосессию!</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-600/30">
                                        {recentGenerations.slice(0, 5).map((gen) => (
                                            <div key={gen.id} className="p-3 hover:bg-slate-700/30 transition-colors">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`inline-block w-2 h-2 rounded-full ${gen.status === 'completed' ? 'bg-green-500' :
                                                                gen.status === 'processing' ? 'bg-yellow-500 animate-pulse' :
                                                                    gen.status === 'failed' ? 'bg-red-500' :
                                                                        'bg-slate-500'
                                                                }`}></span>
                                                            <span className="text-sm font-medium text-white capitalize">{gen.mode}</span>
                                                            <span className="text-xs text-slate-500">•</span>
                                                            <span className="text-xs text-slate-400 uppercase">{gen.quality}</span>
                                                        </div>
                                                        <div className="text-xs text-slate-500">
                                                            {new Date(gen.created_at).toLocaleString('ru-RU', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm font-bold text-purple-400">{gen.image_count} фото</div>
                                                        <div className="text-xs text-slate-500">-{gen.credits_used} ⚡</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Settings Tab */}
                    {activeTab === 'settings' && currentUser.dbUserId && (
                        <div className="space-y-5">
                            <GoogleDriveSettings userId={currentUser.dbUserId} />
                        </div>
                    )}

                    {/* Telegram Wallet Info */}
                    <div className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-700/30 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 11.944 0Zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635Z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-white mb-1">Оплата через Telegram Wallet</h4>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Быстрая и безопасная оплата через Telegram. Поддерживаются карты, криптовалюта и другие способы.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-900 border-t border-slate-800 flex-shrink-0 flex flex-col gap-2">
                    <button onClick={onClose} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors text-sm">Закрыть профиль</button>
                    <div className="text-[9px] text-center text-slate-600 font-mono">
                        v2.3 • {new Date().getFullYear()}
                    </div>

                    <p className="text-xs text-slate-500">
                        Используя сервис, вы соглашаетесь с{' '}
                        <a href="#" className="text-purple-400 hover:text-purple-300">условиями использования</a>
                        {' '}и{' '}
                        <a href="#" className="text-purple-400 hover:text-purple-300">политикой конфиденциальности</a>
                    </p>
                </div>
            </div>
        </div >
    );
};
