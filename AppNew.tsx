import React, { useState, useEffect } from 'react';
import {
    Camera, Wand2, Zap, Image as ImageIcon, Download, ChevronRight,
    Menu, X, Star, Sparkles, User, Layers, Scissors, Maximize2,
    MoveHorizontal, Aperture, Settings, ToggleLeft, ToggleRight,
    MonitorPlay, Briefcase, UploadCloud, BrainCircuit, ScanFace,
    Sliders, Palette, History, RotateCcw, Send, Cloud, CheckCircle, LogIn,
    CreditCard, LogOut
} from 'lucide-react';

import { UserProfile } from './types';
import { AuthScreen } from './components/AuthScreen';
import { userService } from './services/databaseService';
import { PricingModal } from './components/PricingModal';
import { ProfileModal } from './components/ProfileModal';

// --- API MOCK ---
const mockGenerateAPI = async (params: any) => {
    console.log("🚀 START GENERATION PROCESS");
    console.log("Engine:", params.engine);
    console.log("Reference Photos:", params.photosCount);
    console.log("Skin Texture Strength:", params.skinTexture);
    return new Promise(resolve => setTimeout(resolve, 2000));
};

// --- MOCK GOOGLE DRIVE HOOK (To be replaced with real later) ---
const useGoogleDrive = () => {
    const [isDriveConnected, setIsDriveConnected] = useState(false);
    const [driveUser, setDriveUser] = useState<{ name: string, email: string } | null>(null);

    const connectDrive = () => {
        console.log("Connecting to Google Drive...");
        setTimeout(() => {
            setIsDriveConnected(true);
            setDriveUser({ name: "Alex User", email: "alex@gmail.com" });
        }, 1000);
    };

    const disconnectDrive = () => {
        setIsDriveConnected(false);
        setDriveUser(null);
    };

    return { isDriveConnected, driveUser, connectDrive, disconnectDrive };
};

// --- COMPONENTS ---

// 1. Version Switcher
const VersionSwitcher = ({ version, setVersion }: { version: string, setVersion: (v: string) => void }) => (
    <div className="flex bg-white/5 p-1 rounded-full border border-white/10 backdrop-blur-sm gap-1">
        <button
            onClick={() => setVersion('standard')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all duration-300 ${version === 'standard'
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
        >
            <Sparkles size={12} />
            LITE
        </button>
        <button
            onClick={() => setVersion('pro')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all duration-300 ${version === 'pro'
                    ? 'bg-[#2a2b30] text-blue-400 border border-blue-500/30 shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
        >
            <BrainCircuit size={12} />
            PRO
        </button>
        <button
            onClick={() => setVersion('old')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all duration-300 ${version === 'old'
                    ? 'bg-[#1E1E1E] text-white border border-gray-600 shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
        >
            <History size={12} />
            OLD
        </button>
    </div>
);

// 2. PRO VERSION COMPONENT
const ProVersion = ({ currentUser }: { currentUser: UserProfile }) => {
    const [activeModel, setActiveModel] = useState('nanabanana');
    const [skinTexture, setSkinTexture] = useState(85);
    const [uploadedPhotos, setUploadedPhotos] = useState([1, 2, 3]);
    const { isDriveConnected, driveUser, connectDrive, disconnectDrive } = useGoogleDrive();

    return (
        <div className="bg-[#0f1014] text-gray-300 min-h-screen font-mono flex flex-col pt-16">
            {/* Top Bar */}
            <div className="h-16 border-b border-[#2a2b30] bg-[#14151a] flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <ScanFace size={16} />
                        <span>FaceID Refs: <strong className="text-white">{uploadedPhotos.length}/10</strong></span>
                    </div>
                    <div className="h-4 w-[1px] bg-gray-700"></div>
                    <div className="flex items-center gap-2 text-sm text-green-400">
                        <Zap size={16} />
                        <span>GPU: READY</span>
                    </div>
                </div>
                <button
                    onClick={() => mockGenerateAPI({ engine: activeModel, photosCount: uploadedPhotos.length, skinTexture })}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                >
                    <Wand2 size={16} />
                    GENERATE SET
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar */}
                <div className="w-80 border-r border-[#2a2b30] bg-[#14151a] p-4 flex flex-col gap-6 overflow-y-auto">
                    {/* Drive Auth Module */}
                    <div className="bg-[#1c1d24] rounded-lg p-3 border border-[#2a2b30]">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold uppercase text-gray-500">Cloud Storage</span>
                            {isDriveConnected && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>}
                        </div>

                        {!isDriveConnected ? (
                            <button
                                onClick={connectDrive}
                                className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded py-2 text-xs text-gray-300 transition-colors"
                            >
                                <Cloud size={14} />
                                Connect Google Drive
                            </button>
                        ) : (
                            <div>
                                <div className="flex items-center gap-2 mb-2 bg-[#14151a] p-2 rounded border border-[#2a2b30]">
                                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                                        {driveUser?.name[0]}
                                    </div>
                                    <div className="overflow-hidden">
                                        <div className="text-xs font-bold text-white truncate">{driveUser?.name}</div>
                                        <div className="text-[9px] text-gray-500 truncate">Connected</div>
                                    </div>
                                </div>
                                <button
                                    className="w-full py-1 text-[10px] bg-blue-900/30 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-900/50"
                                >
                                    Browse Drive Files
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Model Selector */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-3 block uppercase tracking-wider">Neural Engine</label>
                        <div className="space-y-2">
                            <div
                                onClick={() => setActiveModel('nanabanana')}
                                className={`p-3 rounded-lg border cursor-pointer transition-all ${activeModel === 'nanabanana' ? 'bg-blue-900/20 border-blue-500' : 'bg-[#1c1d24] border-[#2a2b30] hover:border-gray-500'}`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-white text-sm">Nanabanana 3 Pro</span>
                                    <span className="text-[10px] bg-blue-500 text-white px-1.5 rounded">NEW</span>
                                </div>
                                <p className="text-[10px] text-gray-400">Максимальный фотореализм. Специализация: текстура кожи, микродетали.</p>
                            </div>

                            <div
                                onClick={() => setActiveModel('flux')}
                                className={`p-3 rounded-lg border cursor-pointer transition-all ${activeModel === 'flux' ? 'bg-blue-900/20 border-blue-500' : 'bg-[#1c1d24] border-[#2a2b30] hover:border-gray-500'}`}
                            >
                                <span className="font-bold text-white text-sm block mb-1">Flux 1.0 Realism</span>
                                <p className="text-[10px] text-gray-400">Хорошая анатомия, высокая скорость.</p>
                            </div>
                        </div>
                    </div>

                    {/* Reference Photos Upload */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-3 flex justify-between uppercase tracking-wider">
                            <span>Reference Set</span>
                            <span className="text-blue-400 hover:text-blue-300 cursor-pointer">+ Add</span>
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {[...Array(uploadedPhotos.length)].map((_, i) => (
                                <div key={i} className="aspect-square rounded bg-[#2a2b30] border border-[#3f414a] overflow-hidden relative group">
                                    <img src={`https://images.unsplash.com/photo-${1500000000000 + i}?w=100&h=100&fit=crop`} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                                </div>
                            ))}
                            {uploadedPhotos.length < 10 && (
                                <div className="aspect-square rounded border border-dashed border-[#3f414a] flex items-center justify-center text-gray-600 hover:text-white hover:border-gray-400 cursor-pointer transition-colors">
                                    <UploadCloud size={16} />
                                </div>
                            )}
                        </div>
                        {isDriveConnected && (
                            <div className="mt-2 flex items-center gap-1 text-[10px] text-blue-400 cursor-pointer hover:underline">
                                <Cloud size={10} />
                                Import selected from Drive
                            </div>
                        )}
                        <p className="text-[10px] text-gray-500 mt-2">Загрузите 1-10 фото для калибровки IP-Adapter.</p>
                    </div>
                </div>

                {/* Main Canvas */}
                <div className="flex-1 bg-[#0b0c0f] p-8 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>

                    <div className="max-w-4xl w-full h-full flex flex-col">
                        <div className="flex-1 border border-[#2a2b30] rounded-lg bg-[#14151a] relative group overflow-hidden flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-full bg-[#1c1d24] flex items-center justify-center mx-auto mb-4 border border-[#2a2b30]">
                                    <Sparkles className="text-gray-600" />
                                </div>
                                <h3 className="text-gray-400 font-medium">Workspace Ready</h3>
                                <p className="text-sm text-gray-600 mt-2 max-w-xs mx-auto">
                                    Nanabanana 3 Pro is active. Configure your reference set and parameters to start generating realistic portraits.
                                </p>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="h-24 mt-4 grid grid-cols-6 gap-2">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="bg-[#14151a] border border-[#2a2b30] rounded flex items-center justify-center text-xs text-gray-600 hover:border-gray-500 cursor-pointer transition-colors">
                                    Slot {i}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 3. STANDARD VERSION (Lite / Vibrant)
const StandardVersion = ({ currentUser }: { currentUser: UserProfile }) => {
    const { isDriveConnected, connectDrive } = useGoogleDrive();

    return (
        <div className="bg-slate-950 text-white min-h-screen font-sans selection:bg-fuchsia-500 pt-16">
            <div className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute top-20 left-10 w-72 h-72 bg-violet-600/30 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-fuchsia-600/30 rounded-full blur-[100px] animate-pulse delay-1000"></div>

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <div className="inline-block px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-fuchsia-300 border border-white/10 mb-6 flex items-center gap-2 mx-auto w-fit">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        UPDATED: NANABANANA ENGINE LIVE
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black mb-6 leading-tight">
                        Твой стиль. <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-white">
                            Твой Кипиш.
                        </span>
                    </h1>
                    <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
                        Загрузи пару селфи — получи профессиональную фотосессию. <br />
                        <span className="text-fuchsia-400 font-bold">New:</span> Ультра-реализм теперь доступен в Lite версии.
                    </p>

                    <div className="flex flex-col items-center gap-4">
                        <div className="flex justify-center gap-4 flex-col sm:flex-row items-center w-full max-w-lg mx-auto">
                            <button onClick={() => mockGenerateAPI({ engine: 'lite', prompt: 'vibrant' })} className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-slate-950 font-bold hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-xl shadow-white/10">
                                <Camera size={20} />
                                Загрузить фото
                            </button>
                            <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/10 border border-white/10 font-bold backdrop-blur-md flex items-center justify-center gap-2">
                                <MonitorPlay size={20} />
                                Как это работает?
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 4. OLD VERSION
const OldVersion = () => {
    return (
        <div className="bg-[#121212] text-white min-h-screen font-sans flex flex-col pt-16">
            <main className="flex-1 container mx-auto px-4 py-12 flex flex-col items-center text-center">
                <h1 className="text-4xl font-bold mb-6">Old Version Placeholder</h1>
                <p>This mimics the structure of the original V2 app.</p>
            </main>
        </div>
    )
}

// --- MAIN APP COMPONENT ---
const AppNew = () => {
    const [version, setVersion] = useState('standard'); // 'standard' | 'pro' | 'old'
    const [scrolled, setScrolled] = useState(false);
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [showPricing, setShowPricing] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

    // Initialize Auth
    useEffect(() => {
        const storedUser = localStorage.getItem('ai_studio_user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setCurrentUser(parsedUser);
                if (parsedUser.dbUserId) {
                    userService.getUser(parsedUser.dbUserId).then(dbUser => {
                        if (dbUser) {
                            const updatedUser = {
                                ...parsedUser,
                                credits: dbUser.credits,
                                subscriptionTier: dbUser.subscription_tier
                            };
                            setCurrentUser(updatedUser);
                            localStorage.setItem('ai_studio_user', JSON.stringify(updatedUser));
                        }
                    });
                }
            } catch (e) {
                console.error("Failed to parse stored user", e);
            }
        }
    }, []);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogin = (user: UserProfile) => {
        setCurrentUser(user);
        localStorage.setItem('ai_studio_user', JSON.stringify(user));
    };

    const handleLogout = () => {
        setCurrentUser(null);
        localStorage.removeItem('ai_studio_user');
    };

    if (!currentUser) {
        return <AuthScreen onLogin={handleLogin} />;
    }

    return (
        <div className={`min-h-screen transition-colors duration-500 ${version === 'standard' ? 'bg-slate-950' : (version === 'pro' ? 'bg-[#0f1014]' : 'bg-[#121212]')}`}>

            {/* Universal Navbar */}
            <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-black/80 backdrop-blur-md border-b border-white/5' : 'bg-transparent py-4'}`}>
                <div className="container mx-auto px-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded bg-gradient-to-br ${version === 'standard' ? 'from-violet-500 to-fuchsia-500' : (version === 'pro' ? 'from-blue-600 to-cyan-600' : 'from-gray-700 to-gray-500')} flex items-center justify-center transition-colors duration-500`}>
                            <span className="font-bold text-white">K</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-xl text-white leading-none">Kipish<span className={version === 'standard' ? 'text-fuchsia-500' : (version === 'pro' ? 'text-blue-500' : 'text-gray-500')}>.fun</span></span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">

                        {/* User Profile Info */}
                        <div className="hidden md:flex items-center gap-3 bg-white/5 px-2 py-1 rounded-full border border-white/10 backdrop-blur-md">
                            {currentUser.avatarUrl ? (
                                <img src={currentUser.avatarUrl} alt="Ava" className="w-6 h-6 rounded-full" />
                            ) : (
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-[10px] font-bold">
                                    {currentUser.name[0]}
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowPricing(true)}
                                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors ${currentUser.credits && currentUser.credits > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
                                >
                                    {currentUser.credits || 0} ⚡
                                </button>
                                <button onClick={handleLogout} className="text-white/40 hover:text-white transition-colors">
                                    <LogOut size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Mobile Menu / Profile Trigger for Mobile could go here */}

                        <div className="h-6 w-[1px] bg-white/10 hidden md:block"></div>

                        {/* Version Switcher */}
                        <VersionSwitcher version={version} setVersion={setVersion} />
                    </div>
                </div>
            </nav>

            {/* Render Version */}
            {version === 'standard' && <StandardVersion currentUser={currentUser} />}
            {version === 'pro' && <ProVersion currentUser={currentUser} />}
            {version === 'old' && <OldVersion />}

            {/* Modals */}
            {showPricing && (
                <PricingModal
                    isOpen={showPricing}
                    onClose={() => setShowPricing(false)}
                    currentTier={currentUser?.subscriptionTier}
                    currentUser={currentUser}
                    onPaymentSuccess={async (addedCredits, newTier) => {
                        // Optimistic update
                        if (currentUser) {
                            const updated = { ...currentUser, credits: (currentUser.credits || 0) + addedCredits };
                            setCurrentUser(updated);
                            localStorage.setItem('ai_studio_user', JSON.stringify(updated));
                        }
                    }}
                    onSelectPackage={() => { }}
                />
            )}

        </div>
    );
};

export default AppNew;
