import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface PricingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectPackage: (pkg: any) => void;
    currentTier?: string;
    currentUser?: { dbUserId?: string; credits?: number };
    onPaymentSuccess?: (addedCredits: number, newTier?: string) => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({
    isOpen,
    onClose,
    onSelectPackage,
    currentTier = 'free',
    currentUser,
    onPaymentSuccess
}) => {
    const [paymentMethod, setPaymentMethod] = useState<'wayforpay' | 'ammerpay'>((window as any).Telegram?.WebApp?.initDataUnsafe?.user ? 'ammerpay' : 'wayforpay');
    const [activeTab, setActiveTab] = useState<'credits' | 'subs'>('credits');
    const [isProcessing, setIsProcessing] = useState(false);

    const isGuest = !currentUser?.dbUserId;

    if (!isOpen) return null;

    const creditPackages = [
        { id: 'pack_1', credits: 1, price: 1, label: '1 photo', popular: false },
        { id: 'pack_5', credits: 5, price: 49, label: '5 photos', popular: true, save: '20%' },
        { id: 'pack_15', credits: 15, price: 99, label: '15 photos', popular: false, save: '40%' },
        { id: 'pack_50', credits: 50, price: 249, label: '50 photos', popular: false, save: '60%' },
    ];

    const subscriptions = [
        {
            id: 'sub_light',
            tier: 'light',
            title: 'Light (Promo)',
            credits: 30,
            price: 1,
            features: ['30 photos/mo', 'SD quality', '5 locations'],
            active: currentTier === 'light'
        },
        {
            id: 'sub_pro',
            tier: 'pro',
            title: 'Pro',
            credits: 100,
            price: 149,
            features: ['100 photos/mo', 'HD quality', '20 locations', 'FaceID'],
            featured: true,
            active: currentTier === 'pro'
        },
        {
            id: 'sub_ultra',
            tier: 'ultra',
            title: 'Ultra',
            credits: 300,
            price: 299,
            features: ['300 photos/mo', 'UHD 4K', 'Unlimited locations', 'Max priority'],
            active: currentTier === 'ultra'
        },
    ];

    const handleBuyPackage = async (pkg: any) => {
        if (isGuest) {
            alert('Please log in to purchase credits');
            return;
        }

        try {
            setIsProcessing(true);

            if (paymentMethod === 'ammerpay') {
                // --- AMMER PAY / TELEGRAM LOGIC ---
                const tg = (window as any).Telegram?.WebApp;
                const chatId = tg?.initDataUnsafe?.user?.id;

                if (!chatId && !confirm('You are not in Telegram. Payment link will be opened in a new window. Continue?')) {
                    setIsProcessing(false);
                    return;
                }

                // Get Anon Key from environment
                const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_0aETJTgJJ5SZDXppAfRTnw_LO2_J_j6';

                // Use direct fetch but with Authorization header
                const response = await fetch('https://ndrdksmdkhljymuvxjly.supabase.co/functions/v1/create-telegram-invoice', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${anonKey}`
                    },
                    body: JSON.stringify({
                        chatId: chatId,
                        title: pkg.label || pkg.title,
                        description: `AI Photo Studio - ${pkg.label || pkg.title}`,
                        amount: pkg.price,
                        credits: pkg.credits,
                        userId: currentUser!.dbUserId,
                        packageId: pkg.id,
                        tier: pkg.tier // Pass tier to backend
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    try {
                        const errorJson = JSON.parse(errorText);
                        // If we get 401 with Authorization header present, it means Verification is likely ON and Key is 'sb_', or Key is invalid.
                        if (response.status === 401) {
                            throw new Error('CRITICAL: Please disable "Enforce JWT Verification" in Supabase -> Edge Functions -> create-telegram-invoice -> Settings.');
                        }
                        throw new Error(errorJson.error || errorJson.details || errorText);
                    } catch (e: any) {
                        if (e.message.includes('CRITICAL')) throw e;
                        throw new Error(`Server Error: ${response.status} ${errorText}`);
                    }
                }

                const data = await response.json();

                if (!data?.invoice_url) {
                    throw new Error('No invoice URL returned from server');
                }

                // Check for Web clients that might not support native payments with this provider
                const platform = tg?.platform || 'unknown';
                const isWebPlatform = ['weba', 'webk', 'web', 'unknown'].includes(platform);

                if (tg && tg.openInvoice && !isWebPlatform) {
                    // Native Mobile / Desktop App handling
                    tg.openInvoice(data.invoice_url, (status: string) => {
                        setIsProcessing(false);
                        if (status === 'paid') {
                            alert('✅ Payment successful! Credits will be added shortly.');
                            onClose();
                            if (onPaymentSuccess) onPaymentSuccess(pkg.credits, pkg.tier);
                        } else if (status === 'failed') {
                            alert('Payment failed. Please try again.');
                        }
                    });
                } else {
                    // Web Fallback: "Web A does not support payments with this provider" fix.
                    // We open the invoice link directly. This redirects to the Bot or a Web Payment page.
                    setIsProcessing(false);

                    // Open in new tab/window to ensure it doesn't get blocked by Mini App constraints
                    window.open(data.invoice_url, '_blank');

                    alert('💸 Payment page opened in a new tab. \n\nPlease complete the payment there. Credits will be added automatically within 1-2 minutes.');
                    onClose();
                }

            } else {
                // --- WAYFORPAY LOGIC ---
                const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_0aETJTgJJ5SZDXppAfRTnw_LO2_J_j6';

                const response = await fetch('https://ndrdksmdkhljymuvxjly.supabase.co/functions/v1/create-wayforpay-invoice', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${anonKey}`
                    },
                    body: JSON.stringify({
                        amount: pkg.price,
                        productName: pkg.label || pkg.title || 'Credits Package',
                        productCount: 1,
                        productPrice: pkg.price,
                        userId: currentUser!.dbUserId,
                        packageId: pkg.id
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Payment server error: ${response.status} ${errorText}`);
                }

                const data = await response.json();

                // Create and submit hidden form
                const form = document.createElement('form');
                form.setAttribute('method', 'POST');
                form.setAttribute('action', data.url);
                form.setAttribute('target', '_self');

                Object.keys(data.params).forEach(key => {
                    const value = data.params[key];
                    if (Array.isArray(value)) {
                        value.forEach(val => {
                            const input = document.createElement('input');
                            input.setAttribute('type', 'hidden');
                            input.setAttribute('name', key + '[]');
                            input.setAttribute('value', String(val));
                            form.appendChild(input);
                        });
                    } else {
                        const input = document.createElement('input');
                        input.setAttribute('type', 'hidden');
                        input.setAttribute('name', key);
                        input.setAttribute('value', String(value));
                        form.appendChild(input);
                    }
                });

                document.body.appendChild(form);
                form.submit();
            }

        } catch (error: any) {
            console.error('Payment error:', error);
            setIsProcessing(false);

            if (error.message?.includes('non-2xx')) {
                alert('Payment Error: Please check Supabase Secrets (See FIX_PAYMENT_CONFIG.md)');
            } else {
                alert(error.message || 'Failed to create payment. Please try again.');
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="relative w-full max-w-2xl bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-fadeIn">

                {isProcessing && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm">
                        <div className="text-center">
                            <div className="inline-block w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-white font-bold text-lg">Processing payment...</p>
                            <p className="text-slate-400 text-sm mt-2">Please follow instructions</p>
                        </div>
                    </div>
                )}

                <div className="p-6 pb-2 text-center relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <h2 className="text-2xl font-bold text-white mb-2">Top Up Your Balance</h2>
                    <p className="text-slate-400 text-sm mb-4">Select a package to continue</p>

                    {/* Payment Method Selector */}
                    <div className="flex justify-center gap-4 mb-4">
                        <button
                            onClick={() => setPaymentMethod('wayforpay')}
                            className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all w-32 ${paymentMethod === 'wayforpay'
                                ? 'border-blue-500 bg-blue-900/30'
                                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                                }`}
                        >
                            <svg className="w-8 h-8 text-blue-400 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            <span className={`text-xs font-bold ${paymentMethod === 'wayforpay' ? 'text-white' : 'text-slate-400'}`}>Card (UAH)</span>
                        </button>

                        <button
                            onClick={() => setPaymentMethod('ammerpay')}
                            className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all w-32 ${paymentMethod === 'ammerpay'
                                ? 'border-blue-500 bg-blue-900/30'
                                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                                }`}
                        >
                            <svg className="w-8 h-8 text-blue-400 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span className={`text-xs font-bold ${paymentMethod === 'ammerpay' ? 'text-white' : 'text-slate-400'}`}>Telegram / Crypto</span>
                        </button>
                    </div>
                </div>

                <div className="flex border-b border-slate-700 px-6">
                    <button
                        onClick={() => setActiveTab('credits')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === 'credits' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        One-time Photos
                        {activeTab === 'credits' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full"></div>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('subs')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === 'subs' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        Subscription (Best Value)
                        {activeTab === 'subs' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full"></div>
                        )}
                    </button>
                </div>

                <div className="p-6 min-h-[300px]">
                    {activeTab === 'credits' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {creditPackages.map((pkg) => (
                                <div
                                    key={pkg.id}
                                    onClick={() => handleBuyPackage({ type: 'credit', ...pkg })}
                                    className={`relative group cursor-pointer p-4 rounded-xl border transition-all duration-300 ${pkg.popular
                                        ? 'bg-blue-900/20 border-blue-500/50 hover:bg-blue-900/30'
                                        : 'bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50 hover:border-slate-500'
                                        }`}
                                >
                                    {pkg.popular && (
                                        <div className="absolute -top-3 right-4 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shadow-lg shadow-blue-500/20">
                                            Best Seller
                                        </div>
                                    )}
                                    {pkg.save && (
                                        <div className="absolute top-2 right-2 text-green-400 text-xs font-bold">
                                            -{pkg.save}
                                        </div>
                                    )}

                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-3xl font-bold text-white">{pkg.credits}</span>
                                        <span className="text-sm text-slate-400 mb-1">photos</span>
                                    </div>

                                    <div className="flex justify-between items-center mt-4">
                                        <div className="text-xl font-bold text-white">{pkg.price} ₴</div>
                                        <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg group-hover:scale-105 transition-transform flex items-center gap-1">
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                            </svg>
                                            Buy
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {subscriptions.map((sub) => (
                                <div
                                    key={sub.id}
                                    className={`relative flex flex-col p-4 rounded-xl border transition-all ${sub.featured
                                        ? 'bg-blue-900/20 border-blue-500/50'
                                        : 'bg-slate-700/30 border-slate-600/50'
                                        } ${sub.active ? 'ring-2 ring-blue-500' : ''}`}
                                >
                                    <div className="text-lg font-bold text-white mb-1">{sub.title}</div>
                                    <div className="flex items-baseline gap-1 mb-4">
                                        <span className="text-3xl font-bold text-white">{sub.price}</span>
                                        <span className="text-sm text-slate-400">₴/mo</span>
                                    </div>

                                    <ul className="space-y-2 mb-6 flex-1">
                                        {sub.features.map((f, i) => (
                                            <li key={i} className="flex items-center gap-2 text-xs text-slate-300">
                                                <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                {f}
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        onClick={() => handleBuyPackage({ type: 'subscription', ...sub })}
                                        disabled={sub.active}
                                        className={`w-full py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${sub.active
                                            ? 'bg-slate-600 text-slate-400 cursor-default'
                                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg'
                                            }`}
                                    >
                                        {!sub.active && (
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.03-1.99 1.27-5.62 3.72-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.05-.49-.82-.27-1.47-.42-1.42-.88.03-.24.37-.48 1.02-.73 4-1.74 6.68-2.88 8.03-3.43 3.82-1.59 4.61-1.87 5.13-1.87.11 0 .37.03.54.17.14.11.18.26.2.37.01.06.03.24.01.38z" />
                                            </svg>
                                        )}
                                        {sub.active ? 'Current Plan' : 'Pay Now'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 bg-slate-900/50 border-t border-slate-700/50 text-center">
                    <p className="text-xs text-slate-500 cursor-pointer hover:text-slate-300" onClick={() => window.open('https://t.me/support', '_blank')}>
                        Need help? Contact support
                    </p>
                </div>
            </div>
        </div>
    );
};
