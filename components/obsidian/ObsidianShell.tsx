
import React from 'react';
import { Home, Zap, Layers, User, Plus, Bell } from 'lucide-react';

interface ShellProps {
    children: React.ReactNode;
    currentTab: string;
    onTabChange: (tab: string) => void;
}

export const ObsidianShell: React.FC<ShellProps> = ({ children, currentTab, onTabChange }) => {
    // Local state removed, using props


    return (
        <div className="min-h-screen bg-[#000000] text-gray-200 font-sans selection:bg-violet-500/30 selection:text-violet-200">

            {/* 1. Header (Floating Glass) */}
            <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
                <div className="mx-auto max-w-md md:max-w-4xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.3)]">
                            <Zap className="text-white" size={16} fill="currentColor" />
                        </div>
                        <span className="font-bold text-lg text-white tracking-tight">Kipish<span className="text-violet-500">.ai</span></span>
                    </div>

                    <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md active:scale-95 transition-transform relative">
                        <Bell size={18} className="text-gray-400" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#000000]"></span>
                    </button>
                </div>
            </header>

            {/* 2. Main Content Area */}
            <main className="pt-24 pb-32 px-4 min-h-screen mx-auto max-w-md md:max-w-4xl relative z-10">
                {children}
            </main>

            {/* 3. Bottom Navigation (Mobile First) */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-6 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none md:pointer-events-auto">
                <div className="mx-auto max-w-md md:max-w-4xl bg-[#09090b]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-2 shadow-2xl pointer-events-auto flex items-center justify-between px-6">

                    <NavButton
                        icon={<Home size={22} />}
                        label="Home"
                        isActive={currentTab === 'home'}
                        onClick={() => onTabChange('home')}
                    />

                    <NavButton
                        icon={<Layers size={22} />}
                        label="Gallery"
                        isActive={currentTab === 'gallery'}
                        onClick={() => onTabChange('gallery')}
                    />

                    {/* Center FAB (Create) */}
                    <div className="-mt-8">
                        <button
                            onClick={() => onTabChange('create')}
                            className="w-16 h-16 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-[0_0_20px_rgba(124,58,237,0.5)] flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all border-4 border-[#09090b]"
                        >
                            <Plus size={32} />
                        </button>
                    </div>

                    <NavButton
                        icon={<Zap size={22} />}
                        label="Pro"
                        isActive={currentTab === 'pro'}
                        onClick={() => onTabChange('pro')}
                    />

                    <NavButton
                        icon={<User size={22} />}
                        label="Profile"
                        isActive={currentTab === 'profile'}
                        onClick={() => onTabChange('profile')}
                    />

                </div>
            </nav>

            {/* 4. Ambient Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-violet-900/20 blur-[120px] mix-blend-screen animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-cyan-900/10 blur-[100px] mix-blend-screen"></div>
            </div>

        </div>
    );
};

const NavButton = ({ icon, label, isActive, onClick }: any) => (
    <button
        onClick={onClick}
        className={`flex flex - col items - center gap - 1 p - 2 rounded - xl transition - all duration - 300 ${isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300'} `}
    >
        <div className={`transition - transform duration - 300 ${isActive ? '-translate-y-1' : ''} `}>
            {icon}
        </div>
        <span className={`text - [10px] font - medium transition - opacity duration - 300 ${isActive ? 'opacity-100' : 'opacity-0 h-0 hidden'} `}>
            {label}
        </span>
        {isActive && <div className="w-1 h-1 bg-violet-500 rounded-full absolute bottom-2"></div>}
    </button>
);
