import React, { useState } from 'react';
import { paymentService, userService } from '../services/databaseService';

interface PricingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectPackage: (pkg: any) => void;
    currentTier?: string;
    currentUser?: { dbUserId?: string; credits?: number };
    onPaymentSuccess?: (addedCredits: number) => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({
    isOpen,
    onClose,
    onSelectPackage,
    currentTier = 'free',
    currentUser,
    onPaymentSuccess
}) => {
    const [activeTab, setActiveTab] = useState<'credits' | 'subs'>('credits');
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingMessage, setProcessingMessage] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    if (!isOpen) return null;

    const creditPackages = [
        { id: 'pack_1', credits: 1, price: 15, label: '1 photo', popular: false },
        { id: 'pack_5', credits: 5, price: 49, label: '5 photos', popular: true, save: '20%' },
        { id: 'pack_15', credits: 15, price: 99, label: '15 photos', popular: false, save: '40%' },
        { id: 'pack_50', credits: 50, price: 249, label: '50 photos', popular: false, save: '60%' },
    ];

    const subscriptions = [
        {
            id: 'sub_light',
            tier: 'light',
            title: 'Light',
            credits: 30,
            price: 49,
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
        const isGuest = !currentUser?.dbUserId;

        setIsProcessing(true);
        setProcessingMessage(isGuest ? 'Processing demo payment...' : 'Connecting to payment system...');

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (isGuest) {
                setProcessingMessage('Confirming demo payment...');
                await new Promise(resolve => setTimeout(resolve, 1000));

                setProcessingMessage('✅ Success! (Demo Mode)');
                await new Promise(resolve => setTimeout(resolve, 500));

                setIsProcessing(false);
                setShowSuccess(true);

                if (onPaymentSuccess) {
                    onPaymentSuccess(pkg.type === 'credit' ? pkg.credits : 0);
                }

                setTimeout(() => {
                    setShowSuccess(false);
                    onClose();
                }, 2000);
                return;
            }

            setProcessingMessage('Processing payment...');

            await new Promise(resolve => setTimeout(resolve, 1500));

            const payment = await paymentService.createPayment(
                currentUser!.dbUserId!,
                pkg.type === 'credit' ? 'credits' : 'subscription',
                pkg.price,
                pkg.tier,
                pkg.credits
            );

            if (!payment) {
                throw new Error('Failed to create payment record');
            }

            setProcessingMessage('Confirming payment...');
            await new Promise(resolve => setTimeout(resolve, 1000));

            await paymentService.completePayment(payment.id);

            if (pkg.type === 'credit') {
                const success = await userService.addCredits(currentUser!.dbUserId!, pkg.credits);
                if (!success) {
                    throw new Error('Failed to add credits to database. Please contact support.');
                }
            } else {
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + 30);
                const success = await userService.updateSubscription(currentUser!.dbUserId!, pkg.tier, expiryDate);
                if (!success) {
                    throw new Error('Failed to update subscription in database. Please contact support.');
                }
            }

            setProcessingMessage('✅ Success!');
            await new Promise(resolve => setTimeout(resolve, 500));

            setIsProcessing(false);
            setShowSuccess(true);

            if (onPaymentSuccess) {
                onPaymentSuccess(pkg.type === 'credit' ? pkg.credits : 0);
            }

            setTimeout(() => {
                setShowSuccess(false);
                onClose();
            }, 2000);

        } catch (error: any) {
            console.error('Payment error:', error);
            setIsProcessing(false);
            alert(error.message || 'Payment error. Please try again.');
        }

        onSelectPackage(pkg);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="relative w-full max-w-2xl bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-fadeIn">

                {isProcessing && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm">
                        <div className="text-center">
                            <div className="inline-block w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-white font-bold text-lg">{processingMessage}</p>
                        </div>
                    </div>
                )}

                {showSuccess && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-green-900/95 to-emerald-900/95 backdrop-blur-sm">
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-4 animate-pulse">
                                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="text-white font-bold text-2xl">Payment Successful!</p>
                            <p className="text-green-200 text-sm mt-2">Credits added to your account</p>
                        </div>
                    </div>
                )}

                <div className="p-6 text-center relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <h2 className="text-2xl font-bold text-white mb-2">Top Up Your Balance</h2>
                    <p className="text-slate-400 text-sm">Select a package to continue</p>
                </div>

                <div className="flex border-b border-slate-700 px-6">
                    <button
                        onClick={() => setActiveTab('credits')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === 'credits' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        One-time Photos
                        {activeTab === 'credits' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gemini-500 rounded-t-full"></div>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('subs')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === 'subs' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        Subscription (Best Value)
                        {activeTab === 'subs' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500 rounded-t-full"></div>
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
                                        ? 'bg-gemini-900/20 border-gemini-500/50 hover:bg-gemini-900/30'
                                        : 'bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50 hover:border-slate-500'
                                        }`}
                                >
                                    {pkg.popular && (
                                        <div className="absolute -top-3 right-4 bg-gemini-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shadow-lg shadow-gemini-500/20">
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
                                        <button className="px-3 py-1.5 bg-white text-slate-900 text-sm font-bold rounded-lg group-hover:scale-105 transition-transform">
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
                                        ? 'bg-purple-900/20 border-purple-500/50'
                                        : 'bg-slate-700/30 border-slate-600/50'
                                        } ${sub.active ? 'ring-2 ring-purple-500' : ''}`}
                                >
                                    <div className="text-lg font-bold text-white mb-1">{sub.title}</div>
                                    <div className="flex items-baseline gap-1 mb-4">
                                        <span className="text-3xl font-bold text-white">{sub.price}</span>
                                        <span className="text-sm text-slate-400">₴/mo</span>
                                    </div>

                                    <ul className="space-y-2 mb-6 flex-1">
                                        {sub.features.map((f, i) => (
                                            <li key={i} className="flex items-center gap-2 text-xs text-slate-300">
                                                <svg className="w-4 h-4 text-purple-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                {f}
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        onClick={() => handleBuyPackage({ type: 'subscription', ...sub })}
                                        disabled={sub.active}
                                        className={`w-full py-2 rounded-lg font-bold text-sm transition-all ${sub.active
                                            ? 'bg-slate-600 text-slate-400 cursor-default'
                                            : sub.featured
                                                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20'
                                                : 'bg-slate-600 hover:bg-slate-500 text-white'
                                            }`}
                                    >
                                        {sub.active ? 'Current Plan' : 'Select'}
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
