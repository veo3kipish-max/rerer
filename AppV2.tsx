import React, { useState } from 'react';
import { ObsidianShell } from './components/obsidian/ObsidianShell';
import { StudioHome } from './components/obsidian/StudioHome';
import { CreationWizard } from './components/obsidian/CreationWizard';
import { UserProfile } from './types';

const AppV2 = () => {
    const [currentTab, setCurrentTab] = useState('home');
    // Sub-state for creation flow
    const [isCreating, setIsCreating] = useState(false);

    const handleTabChange = (tab: string) => {
        if (tab === 'create') {
            setIsCreating(true);
            setCurrentTab('home'); // Keep "home" highlighted or generic
        } else {
            setIsCreating(false);
            setCurrentTab(tab);
        }
    };

    const renderContent = () => {
        if (isCreating) {
            return (
                <CreationWizard
                    onBack={() => setIsCreating(false)}
                    onComplete={() => {
                        setIsCreating(false);
                        setCurrentTab('gallery');
                    }}
                />
            );
        }

        switch (currentTab) {
            case 'home':
                return <StudioHome onStartCreate={() => handleTabChange('create')} />;
            case 'gallery':
                return (
                    <div className="pt-4">
                        <h2 className="text-2xl font-bold text-white mb-4 pl-2">Gallery</h2>
                        <div className="text-center text-gray-500 py-20 bg-[#121214] rounded-3xl border border-dashed border-white/10">
                            Your masterpieces will appear here.
                        </div>
                    </div>
                );
            case 'pro':
                return (
                    <div className="pt-4">
                        <h2 className="text-2xl font-bold text-white mb-4 pl-2">Pro Tools</h2>
                        <div className="text-center text-gray-500 py-20 bg-[#121214] rounded-3xl border border-dashed border-white/10">
                            Advanced Generation Engine
                            <br />
                            <span className="text-xs text-violet-500">Coming Soon to v2</span>
                        </div>
                    </div>
                );
            case 'profile':
                return (
                    <div className="pt-4">
                        <h2 className="text-2xl font-bold text-white mb-4 pl-2">Profile</h2>
                        <div className="bg-[#121214] rounded-3xl p-6 border border-white/10 flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-xl font-bold text-white">
                                G
                            </div>
                            <div>
                                <div className="font-bold text-white">Guest User</div>
                                <div className="text-sm text-gray-500">Free Plan</div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return <StudioHome />;
        }
    };

    return (
        <ObsidianShell currentTab={currentTab} onTabChange={handleTabChange}>
            {renderContent()}
        </ObsidianShell>
    );
};

export default AppV2;
