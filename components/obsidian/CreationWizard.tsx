import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, UploadCloud, Camera, Check, X, Wand2 } from 'lucide-react';

interface WizardProps {
    onBack: () => void;
    onComplete: () => void;
    onGenerate: (files: File[], style: string) => Promise<void>;
}

export const CreationWizard: React.FC<WizardProps> = ({ onBack, onComplete, onGenerate }) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    // STEP 1: UPLOAD
    const renderUploadStep = () => (
        <div className="space-y-6 animate-fadeIn">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-white">Upload Reference</h2>
                <p className="text-sm text-gray-400">Upload 1-4 clear selfies of yourself.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="aspect-[3/4] rounded-2xl border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center relative overflow-hidden group">
                        {uploadedFiles[i] ? (
                            <img src={URL.createObjectURL(uploadedFiles[i])} className="w-full h-full object-cover" />
                        ) : (
                            <>
                                <UploadCloud className="text-gray-500 mb-2 group-hover:text-violet-500 transition-colors" />
                                <span className="text-xs text-gray-500">Tap to add</span>
                            </>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => {
                                if (e.target.files?.[0]) {
                                    const newFiles = [...uploadedFiles];
                                    newFiles[i] = e.target.files[0];
                                    setUploadedFiles(newFiles);
                                }
                            }}
                        />
                        {uploadedFiles[i] && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const newFiles = [...uploadedFiles];
                                    newFiles[i] = undefined as any; // Hacky clear, better filter
                                    // Actually we should store array of {file, index} or just filter out
                                    setUploadedFiles(uploadedFiles.filter((_, idx) => idx !== i));
                                }}
                                className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <button
                onClick={() => setStep(2)}
                disabled={uploadedFiles.length === 0}
                className="w-full py-4 bg-white text-black rounded-full font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
                Next Step
            </button>
        </div>
    );

    // STEP 2: STYLE SELECTION
    const handleStartGeneration = async () => {
        if (!selectedStyle || uploadedFiles.length === 0) return;

        setStep(3);
        setIsGenerating(true);

        try {
            await onGenerate(uploadedFiles, selectedStyle);
            // Generation done
            onComplete();
        } catch (e: any) {
            alert("Generation failed: " + e.message);
            setStep(2); // Go back on error
            setIsGenerating(false);
        }
    };

    const renderStyleStep = () => (
        <div className="space-y-6 animate-fadeIn">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-white">Choose Aesthetic</h2>
                <p className="text-sm text-gray-400">Select the vibe for your photoshoot.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {['Cyberpunk', 'Old Money', 'Studio', 'Fantasy', 'Business', 'Neon'].map((style) => (
                    <div
                        key={style}
                        onClick={() => setSelectedStyle(style)}
                        className={`aspect-video rounded-xl bg-[#1c1c1f] border-2 relative overflow-hidden cursor-pointer transition-all ${selectedStyle === style ? 'border-violet-500 shadow-[0_0_15px_rgba(124,58,237,0.4)]' : 'border-transparent hover:border-white/20'}`}
                    >
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/40">
                            <span className="font-bold text-white">{style}</span>
                        </div>
                        <img src={`https://source.unsplash.com/random/400x300/?${style}`} className="w-full h-full object-cover opacity-60" />

                        {selectedStyle === style && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center z-20">
                                <Check size={14} className="text-white" />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <button
                onClick={handleStartGeneration}
                disabled={!selectedStyle}
                className="w-full py-4 bg-violet-600 text-white rounded-full font-bold text-lg disabled:opacity-50 hover:bg-violet-500 transition-colors shadow-[0_0_20px_rgba(124,58,237,0.4)]"
            >
                Generate Magic
            </button>
        </div>
    );

    // STEP 3: PROCESSING
    const renderProcessingStep = () => (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-fadeIn">
            <div className="relative w-32 h-32">
                <div className="absolute inset-0 border-4 border-violet-500/30 rounded-full animate-ping"></div>
                <div className="absolute inset-0 border-4 border-t-violet-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Wand2 className="text-violet-400 animate-pulse" size={40} />
                </div>
            </div>

            <div className="space-y-2">
                <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400">
                    Dreaming...
                </h3>
                <p className="text-gray-500 text-sm max-w-xs mx-auto">
                    Creating your {selectedStyle} photos. <br />This usually takes about 30-40 seconds.
                </p>
            </div>
        </div>
    );

    return (
        <div className="pt-2 pb-20">
            <div className="flex items-center mb-6">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                    <ChevronLeft size={24} />
                </button>
                <div className="flex-1 flex justify-center gap-2">
                    <div className={`h-1 w-8 rounded-full transition-colors ${step >= 1 ? 'bg-violet-500' : 'bg-gray-800'}`}></div>
                    <div className={`h-1 w-8 rounded-full transition-colors ${step >= 2 ? 'bg-violet-500' : 'bg-gray-800'}`}></div>
                    <div className={`h-1 w-8 rounded-full transition-colors ${step >= 3 ? 'bg-violet-500' : 'bg-gray-800'}`}></div>
                </div>
                <div className="w-10"></div>
            </div>

            {step === 1 && renderUploadStep()}
            {step === 2 && renderStyleStep()}
            {step === 3 && renderProcessingStep()}
        </div>
    );
};
