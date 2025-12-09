import React from 'react';
import { Plus, ChevronRight, Zap, Image as ImageIcon, Camera } from 'lucide-react';

interface HomeProps {
    onStartCreate?: () => void;
}

export const StudioHome: React.FC<HomeProps> = ({ onStartCreate }) => {
    return (
        <div className="space-y-8 animate-fadeIn">

            {/* 1. Hero / Quick Start */}
            <section className="mt-4">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-500 mb-2">
                    Studio v2
                </h1>
                <p className="text-gray-500 text-sm mb-6">Create stunning AI portraits in seconds.</p>

                <div
                    onClick={onStartCreate}
                    className="bg-[#121214] border border-white/5 rounded-3xl p-6 relative overflow-hidden group cursor-pointer hover:border-violet-500/30 transition-colors"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/20 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-violet-600/30 transition-colors"></div>

                    <div className="relative z-10 flex flex-col items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center shadow-lg">
                            <Camera size={24} fill="currentColor" className="text-black" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white mb-1">New Photoshoot</h2>
                            <p className="text-xs text-gray-400">Generate 10-20 professional shots.</p>
                        </div>
                        <button className="mt-2 bg-white text-black px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 hover:scale-105 transition-transform">
                            Start Now <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </section>

            {/* 2. Trending Styles (Horizontal Scroll) */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-300 text-sm uppercase tracking-wide">Trending Now</h3>
                    <button className="text-[10px] text-violet-400 hover:text-white transition-colors">View All</button>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                    {['Cyberpunk', 'Old Money', 'Vogue', 'Anime V5', 'Polaroid'].map((style, i) => (
                        <div key={i} className="flex-none w-32 aspect-[3/4] rounded-2xl bg-[#121214] border border-white/5 relative overflow-hidden group cursor-pointer">
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 z-10"></div>
                            <img
                                src={`https://images.unsplash.com/photo-${1500000000000 + i}?w=300&h=400&fit=crop`}
                                className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                            />
                            <div className="absolute bottom-3 left-3 z-20">
                                <span className="text-xs font-bold text-white block">{style}</span>
                                <div className="flex items-center gap-1 mt-1">
                                    <Zap size={10} className="text-yellow-400" fill="currentColor" />
                                    <span className="text-[8px] text-gray-400 uppercase">Popular</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 3. Recent Projects */}
            <section>
                <h3 className="font-bold text-gray-300 text-sm uppercase tracking-wide mb-4">Recent Projects</h3>
                <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((item, i) => (
                        <div key={i} className="aspect-square bg-[#121214] rounded-2xl border border-white/5 p-3 flex flex-col justify-between hover:border-white/10 transition-colors cursor-pointer">
                            <div className="flex gap-1">
                                <div className="w-full aspect-square bg-[#1c1c1f] rounded-lg overflow-hidden">
                                    {/* Placeholder for project thumb */}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-gray-300">Project #{1024 + i}</h4>
                                <p className="text-[10px] text-gray-600 mt-0.5">4 images • 2h ago</p>
                            </div>
                        </div>
                    ))}

                    {/* New Project Placeholder */}
                    <div className="aspect-square rounded-2xl border border-dashed border-white/10 flex items-center justify-center flex-col gap-2 text-gray-600 hover:text-violet-400 hover:border-violet-500/30 transition-colors cursor-pointer">
                        <Plus size={24} />
                        <span className="text-xs font-medium">New</span>
                    </div>
                </div>
            </section>

        </div>
    );
};
