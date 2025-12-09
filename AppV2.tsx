import React, { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { ObsidianShell } from './components/obsidian/ObsidianShell';
import { StudioHome } from './components/obsidian/StudioHome';
import { CreationWizard } from './components/obsidian/CreationWizard';
import { AuthScreen } from './components/AuthScreen';
import { userService, generationService } from './services/databaseService';
import { planPhotoshoot, generateScenarioImage } from './services/geminiService';
import { UserProfile, UploadedImage, GeneratedImage } from './types';
import { ResultGallery } from './components/ResultGallery';

const AppV2 = () => {
    const [currentTab, setCurrentTab] = useState('home');
    // Sub-state for creation flow
    const [isCreating, setIsCreating] = useState(false);
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);

    // Content State
    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const savedUser = localStorage.getItem('user_profile');
                if (savedUser) {
                    const parsed = JSON.parse(savedUser);
                    // Refresh credits if user exists
                    if (parsed.dbUserId) {
                        try {
                            const dbUser = await userService.getUser(parsed.dbUserId);
                            if (dbUser) parsed.credits = dbUser.credits;
                        } catch (e) {
                            console.error("Failed to refresh credits", e);
                        }
                    }
                    setCurrentUser(parsed);
                }
            } catch (e) {
                console.error("Auth init error", e);
                localStorage.removeItem('user_profile');
            } finally {
                setIsLoadingAuth(false);
            }
        };
        initAuth();
    }, []);

    const handleLogin = (user: UserProfile) => {
        setCurrentUser(user);
        localStorage.setItem('user_profile', JSON.stringify(user));
    };

    const handleLogout = () => {
        setCurrentUser(null);
        localStorage.removeItem('user_profile');
        setIsCreating(false);
        setCurrentTab('home');
    };

    const handleTabChange = (tab: string) => {
        if (tab === 'create') {
            setIsCreating(true);
            setCurrentTab('home'); // Keep "home" highlighted or generic
        } else {
            setIsCreating(false);
            setCurrentTab(tab);
        }
    };

    const processFile = (file: File): Promise<UploadedImage> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64Full = reader.result as string;
                const base64Data = base64Full.split(',')[1];
                resolve({
                    id: Math.random().toString(36).substr(2, 9),
                    file,
                    previewUrl: URL.createObjectURL(file),
                    base64Data,
                    mimeType: file.type
                });
            };
            reader.onerror = reject;
        });
    };

    const handleWizardGenerate = async (files: File[], style: string) => {
        if (!currentUser?.dbUserId) throw new Error("Please log in to generate");

        // 1. Check Credits
        const imageCount = 4;
        const hasCredits = await userService.canGenerate(currentUser.dbUserId, imageCount);
        if (!hasCredits) throw new Error("Not enough credits! Please top up.");

        // 2. Prepare Files
        const uploaded = await Promise.all(files.map(processFile));

        // 3. Map Style
        const stylePrompts: Record<string, string> = {
            'Cyberpunk': 'Futuristic cyberpunk portrait, neon lights, high tech, urban scifi, detailed face',
            'Old Money': 'Old money aesthetic, quiet luxury, elegant portrait, beige and navy, wealthy look',
            'Studio': 'Professional studio headshot, grey background, soft lighting, 8k resolution, sharp focus',
            'Fantasy': 'Ethereal fantasy portrait, magical glowing lights, digital art, rpg character',
            'Business': 'Corporate headshot, suit, office background, confident look, linkedin profile photo',
            'Neon': 'Synthwave aesthetic, pink and blue lighting, retro 80s style, vaporwave'
        };
        const prompt = stylePrompts[style] || style;

        // 4. Plan & Generate
        const plan = await planPhotoshoot(uploaded, [], "", prompt, [], "", [], "", [], "", [], "", [], "", [], imageCount, false, false);

        const genRecord = await generationService.createGeneration(currentUser.dbUserId, 'photoshoot', imageCount, 'hd', 'normal');

        const newImages: GeneratedImage[] = [];
        for (let i = 0; i < imageCount; i++) {
            const result = await generateScenarioImage(plan, i, uploaded[i % uploaded.length], prompt, "", true);
            newImages.push({
                id: `gen-${Date.now()}-${i}`,
                url: `data:image/png;base64,${result.base64}`,
                prompt: result.prompt
            });
        }

        if (genRecord) await generationService.updateGenerationStatus(genRecord.id, 'completed');

        await userService.deductCredits(currentUser.dbUserId, imageCount);

        // Update User Credits UI
        setCurrentUser(prev => prev ? ({ ...prev, credits: (prev.credits || 0) - imageCount }) : null);

        // Save Images
        setGeneratedImages(prev => [...newImages, ...prev]);
    };

    const renderContent = () => {
        if (isCreating) {
            return (
                <CreationWizard
                    onBack={() => setIsCreating(false)}
                    onGenerate={handleWizardGenerate}
                    onComplete={() => {
                        setIsCreating(false);
                        setCurrentTab('gallery');
                    }}
                />
            );
        }

        if (isLoadingAuth) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
        if (!currentUser) return <AuthScreen onLogin={handleLogin} />;

        switch (currentTab) {
            case 'home':
                return <StudioHome onStartCreate={() => handleTabChange('create')} />;
            case 'gallery':
                return (
                    <div className="pt-4 h-full flex flex-col">
                        <h2 className="text-2xl font-bold text-white mb-4 pl-2">Gallery</h2>
                        {generatedImages.length > 0 ? (
                            <ResultGallery images={generatedImages} plan={null} onReset={() => { }} isValidating={false} initialSelectedIndex={0} />
                        ) : (
                            <div className="text-center text-gray-500 py-20 bg-[#121214] rounded-3xl border border-dashed border-white/10">
                                Your masterpieces will appear here.
                            </div>
                        )}
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
                    <div className="pt-4 animate-fadeIn">
                        <h2 className="text-2xl font-bold text-white mb-4 pl-2">My Studio</h2>
                        <div className="bg-[#121214] rounded-3xl p-6 border border-white/10 flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-xl font-bold text-white overflow-hidden">
                                {currentUser?.avatarUrl ? <img src={currentUser.avatarUrl} className="w-full h-full object-cover" /> : currentUser?.name?.[0]}
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-white text-lg">{currentUser?.name}</div>
                                <div className="text-sm text-gray-500">Credits: <span className="text-violet-400 font-bold">{currentUser?.credits}</span></div>
                            </div>
                            <button onClick={handleLogout} className="p-2 bg-white/5 rounded-full hover:bg-red-500/20 text-gray-400 hover:text-red-500 transition-colors">
                                <LogOut size={20} />
                            </button>
                        </div>

                        <div className="text-center text-gray-600 text-xs">
                            ID: {currentUser?.id}
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
