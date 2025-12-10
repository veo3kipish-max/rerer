import React, { useState } from 'react';
import {
    Camera, Wand2, Zap, UploadCloud, X, Sparkles, ScanFace
} from 'lucide-react';
import { UserProfile, AppState, UploadedImage, GeneratedImage, PhotoshootPlan } from '../../types';
import { userService, generationService } from '../../services/databaseService';
import { planPhotoshoot, generateScenarioImage } from '../../services/geminiService';
import { ResultGallery } from '../ResultGallery';

// Mock Loading Screen (inline for simplicity or import if exists)
const LoadingScreen = ({ status, progress }: { status: string, progress: number }) => (
    <div className="flex flex-col items-center justify-center p-10 h-full">
        <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-xl font-bold text-white mb-2">{status}</div>
        <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-violet-600 transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="text-gray-500 mt-2">{Math.round(progress)}%</div>
    </div>
);

// --- MOCK GOOGLE DRIVE HOOK ---
// (Copy-paste from AppNew.tsx for compatibility)
const useGoogleDrive = () => {
    const [isDriveConnected, setIsDriveConnected] = useState(false);
    // Real implementation would be in App context
    return { isDriveConnected };
};

interface ProProps {
    currentUser: UserProfile;
}

export const ObsidianPro: React.FC<ProProps> = ({ currentUser }) => {
    const [activeModel, setActiveModel] = useState('nanabanana');
    const [userPhotos, setUserPhotos] = useState<UploadedImage[]>([]);
    const [positivePrompt, setPositivePrompt] = useState("Professional portrait, cinematic lighting, 8k, highly detailed");
    const [imageCount, setImageCount] = useState(4);

    // Generation State
    const [appState, setAppState] = useState<AppState>(AppState.IDLE);
    const [statusMessage, setStatusMessage] = useState("");
    const [progress, setProgress] = useState(0);
    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
    const [photoshootPlan, setPhotoshootPlan] = useState<PhotoshootPlan | null>(null);

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

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const processed = await Promise.all(files.map(processFile));
            setUserPhotos(prev => [...prev, ...processed]);
        }
    };


    const handleGenerate = async () => {
        if (userPhotos.length === 0) {
            alert("Upload at least 1 photo!");
            return;
        }

        try {
            setAppState(AppState.ANALYZING);

            // Credit Check
            const requiredCredits = imageCount;
            if (currentUser?.dbUserId && !(await userService.canGenerate(currentUser.dbUserId, requiredCredits))) {
                alert("Not enough credits!");
                setAppState(AppState.IDLE);
                return;
            }

            setStatusMessage("Planning photoshoot...");
            setProgress(10);

            // 1. Plan
            const plan = await planPhotoshoot(
                userPhotos,
                [], "",
                positivePrompt,
                [], "", [], "", [], "", [], "", [], "", [],
                imageCount,
                false,
                false
            );
            setPhotoshootPlan(plan);

            // 2. Generate
            setAppState(AppState.GENERATING);
            let currentGenerationId: string | null = null;
            if (currentUser.dbUserId) {
                const gen = await generationService.createGeneration(currentUser.dbUserId, 'photoshoot', imageCount, 'hd', 'normal');
                if (gen) currentGenerationId = gen.id;
            }

            const newImages: GeneratedImage[] = [];
            for (let i = 0; i < imageCount; i++) {
                setStatusMessage(`Rendering shot ${i + 1}/${imageCount}...`);

                const result = await generateScenarioImage(
                    plan, i, userPhotos[i % userPhotos.length],
                    positivePrompt, "",
                    true, // Use PRO model
                    undefined, false
                );

                newImages.push({
                    id: `gen-${Date.now()}-${i}`,
                    url: `data:image/png;base64,${result.base64}`,
                    prompt: result.prompt
                });

                if (currentUser.dbUserId) await userService.deductCredits(currentUser.dbUserId, 1);
                // Force update UI by creating new array ref
                setGeneratedImages(prev => [...newImages]); // Show progress
                setProgress(20 + ((i + 1) / imageCount) * 80);
            }

            if (currentGenerationId) {
                await generationService.updateGenerationStatus(currentGenerationId, 'completed');
            }

            setAppState(AppState.COMPLETE);

        } catch (e: any) {
            console.error(e);
            setAppState(AppState.ERROR);
            alert("Error: " + e.message);
        }
    };

    return (
        <div className="flex flex-col gap-6 font-sans text-gray-300 animate-fadeIn pb-20">
            {/* Header / Config Bar */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#121214] p-4 rounded-2xl border border-white/10">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <ScanFace size={16} />
                        <span>Refs: <strong className="text-white">{userPhotos.length}</strong></span>
                    </div>
                    <div className="h-4 w-[1px] bg-gray-700"></div>
                    <div className="flex items-center gap-2 text-sm text-green-400">
                        <Zap size={16} />
                        <span>PRO Engine</span>
                    </div>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={appState === AppState.GENERATING || appState === AppState.ANALYZING}
                    className={`w-full md:w-auto bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(124,58,237,0.3)] disabled:opacity-50`}
                >
                    {appState === AppState.GENERATING ? <div className="animate-spin w-4 h-4 border-2 border-white rounded-full border-t-white/10" /> : <Wand2 size={16} />}
                    {appState === AppState.GENERATING ? 'PROCESSING...' : 'GENERATE SET'}
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Settings Panel (Sidebar on desktop, Top on mobile) */}
                <div className="w-full lg:w-80 flex flex-col gap-6 order-2 lg:order-1">
                    {/* Refs */}
                    <div className="bg-[#121214] p-4 rounded-2xl border border-white/10">
                        <label className="text-xs font-bold text-gray-500 mb-3 flex justify-between uppercase tracking-wider">
                            <span>Reference Set</span>
                            <label htmlFor="upload-ref-pro" className="text-violet-400 hover:text-violet-300 cursor-pointer">+ Add</label>
                            <input id="upload-ref-pro" type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {userPhotos.map((img, i) => (
                                <div key={i} className="aspect-square rounded bg-[#2a2b30] border border-[#3f414a] overflow-hidden relative group">
                                    <img src={img.previewUrl} className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => setUserPhotos(prev => prev.filter((_, idx) => idx !== i))}
                                        className="absolute top-0 right-0 p-0.5 bg-black/50 text-white opacity-0 group-hover:opacity-100"
                                    >
                                        <X size={10} />
                                    </button>
                                </div>
                            ))}
                            {userPhotos.length < 10 && (
                                <label htmlFor="upload-ref-pro" className="aspect-square rounded border border-dashed border-[#3f414a] flex items-center justify-center text-gray-600 hover:text-white hover:border-gray-400 cursor-pointer transition-colors bg-white/5">
                                    <UploadCloud size={16} />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Params */}
                    <div className="bg-[#121214] p-4 rounded-2xl border border-white/10">
                        <label className="text-xs font-bold text-gray-500 mb-3 block uppercase tracking-wider">Configuration</label>
                        <div className="mb-4">
                            <label className="text-xs text-gray-400 mb-1 block">Custom Prompt</label>
                            <textarea
                                className="w-full bg-[#000] border border-[#2a2b30] rounded-xl p-3 text-xs text-white focus:border-violet-500 transition-colors outline-none resize-none"
                                rows={4}
                                placeholder="Describe your photo..."
                                value={positivePrompt}
                                onChange={e => setPositivePrompt(e.target.value)}
                            />
                        </div>
                        <div className="mb-2">
                            <div className="flex justify-between text-xs mb-1">
                                <span>Image Count</span>
                                <span className="text-violet-400">{imageCount}</span>
                            </div>
                            <input
                                type="range" min="1" max="10"
                                value={imageCount}
                                onChange={(e) => setImageCount(parseInt(e.target.value))}
                                className="w-full h-1 bg-[#2a2b30] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-violet-500 [&::-webkit-slider-thumb]:rounded-full"
                            />
                        </div>
                    </div>
                </div>

                {/* Main Canvas */}
                <div className="flex-1 bg-[#121214] rounded-2xl border border-white/10 min-h-[500px] flex flex-col relative overflow-hidden order-1 lg:order-2">
                    {appState === AppState.IDLE && generatedImages.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-50">
                            <Sparkles size={48} className="mb-4 text-gray-600" />
                            <h3 className="text-xl font-bold text-gray-400">Workspace Ready</h3>
                            <p className="text-sm">Configure settings and upload references to start.</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {appState !== AppState.COMPLETE && generatedImages.length === 0 ? (
                                <LoadingScreen status={statusMessage} progress={progress} />
                            ) : (
                                <ResultGallery images={generatedImages} plan={photoshootPlan} onReset={() => { }} isValidating={false} initialSelectedIndex={0} />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
