import React, { useState, useEffect, useRef } from 'react';
import {
    Camera, Wand2, Zap, Image as ImageIcon, Download, ChevronRight,
    Menu, X, Star, Sparkles, User, Layers, Scissors, Maximize2,
    MoveHorizontal, Aperture, Settings, ToggleLeft, ToggleRight,
    MonitorPlay, Briefcase, UploadCloud, BrainCircuit, ScanFace,
    Sliders, Palette, History, RotateCcw, Send, Cloud, CheckCircle, LogIn
} from 'lucide-react';

// --- API MOCK ---
const mockGenerateAPI = async (params: any) => {
    console.log("🚀 START GENERATION PROCESS");
    console.log("Engine:", params.engine);
    console.log("Reference Photos:", params.photosCount);
    console.log("Skin Texture Strength:", params.skinTexture);
    return new Promise(resolve => setTimeout(resolve, 2000));
};

// --- MOCK GOOGLE DRIVE HOOK ---
const useGoogleDrive = () => {
    const [isDriveConnected, setIsDriveConnected] = useState(false);
    const [driveUser, setDriveUser] = useState<{ name: string, email: string } | null>(null);

    const connectDrive = () => {
        // Здесь должна быть реальная OAuth логика
        console.log("Connecting to Google Drive...");
        setTimeout(() => {
            setIsDriveConnected(true);
            setDriveUser({ name: "Alex User", email: "alex@gmail.com" });
            alert("Google Drive успешно подключен!");
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
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${version === 'standard'
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
        >
            <Sparkles size={14} />
            LITE
        </button>
        <button
            onClick={() => setVersion('pro')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${version === 'pro'
                    ? 'bg-[#2a2b30] text-blue-400 border border-blue-500/30 shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
        >
            <BrainCircuit size={14} />
            PRO
        </button>
        <button
            onClick={() => setVersion('old')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${version === 'old'
                    ? 'bg-[#1E1E1E] text-white border border-gray-600 shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
        >
            <History size={14} />
            OLD
        </button>
    </div>
);

// 2. PRO VERSION COMPONENT (With Drive Integration)
const ProVersion = () => {
    const [activeModel, setActiveModel] = useState('nanabanana');
    const [skinTexture, setSkinTexture] = useState(85);
    const [uploadedPhotos, setUploadedPhotos] = useState([1, 2, 3]);
    const { isDriveConnected, driveUser, connectDrive, disconnectDrive } = useGoogleDrive();

    return (
        <div className="bg-[#0f1014] text-gray-300 min-h-screen font-mono flex flex-col">
            {/* Top Bar */}
            <div className="h-16 border-b border-[#2a2b30] bg-[#14151a] flex items-center justify-between px-6 mt-16">
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
                                    onClick={() => alert("Открывается окно выбора файлов Google Drive...")}
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

                    {/* Parameters */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-4 block uppercase tracking-wider">Realism Settings</label>

                        <div className="mb-4">
                            <div className="flex justify-between text-xs mb-1">
                                <span>Skin Texture (Pores/Fuzz)</span>
                                <span className="text-blue-400">{skinTexture}%</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="100"
                                value={skinTexture}
                                onChange={(e: any) => setSkinTexture(e.target.value)}
                                className="w-full h-1 bg-[#2a2b30] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full"
                            />
                        </div>

                        <div className="mb-4">
                            <div className="flex justify-between text-xs mb-1">
                                <span>Lighting Match (Ray Tracing)</span>
                                <span className="text-blue-400">High</span>
                            </div>
                            <div className="flex bg-[#1c1d24] rounded p-1 gap-1">
                                {['Soft', 'Studio', 'Cinematic', 'Natural'].map(mode => (
                                    <button key={mode} className="flex-1 py-1 text-[9px] rounded hover:bg-[#2a2b30] focus:bg-blue-600 focus:text-white transition-colors">{mode}</button>
                                ))}
                            </div>
                        </div>
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
const StandardVersion = () => {
    const { isDriveConnected, connectDrive } = useGoogleDrive();

    return (
        <div className="bg-slate-950 text-white min-h-screen font-sans selection:bg-fuchsia-500">
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

                        {/* Google Drive Option */}
                        <div
                            onClick={connectDrive}
                            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white cursor-pointer transition-colors mt-2 bg-slate-900/50 px-4 py-2 rounded-full border border-white/5 hover:border-white/20"
                        >
                            <Cloud size={16} className={isDriveConnected ? "text-green-500" : ""} />
                            {isDriveConnected ? "Google Drive подключен" : "Или загрузите из Google Drive"}
                        </div>
                    </div>

                    <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                        {[
                            { name: 'Realistic', icon: <User /> },
                            { name: 'Cyberpunk', icon: <Zap /> },
                            { name: 'Anime', icon: <Star /> },
                            { name: 'Art', icon: <Palette /> }
                        ].map((style, i) => (
                            <div key={i} className="aspect-square rounded-2xl bg-slate-800/50 border border-white/10 hover:border-fuchsia-500 transition-colors flex items-center justify-center flex-col gap-3 cursor-pointer group">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 group-hover:scale-110 transition-transform shadow-lg shadow-violet-500/20 flex items-center justify-center text-white">
                                    {style.icon}
                                </div>
                                <span className="font-bold">{style.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// 4. OLD VERSION (Replica of current kipish.fun)
const OldVersion = () => {
    return (
        <div className="bg-[#121212] text-white min-h-screen font-sans flex flex-col">
            {/* Simple Navbar matching current style */}
            <header className="h-16 border-b border-white/10 flex items-center justify-between px-4 md:px-10 bg-[#121212] mt-16">
                <div className="text-xl font-bold flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">K</div>
                    Kipish.fun
                </div>
                <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                    Войти / Регистрация
                </button>
            </header>

            <main className="flex-1 container mx-auto px-4 py-12 flex flex-col items-center text-center">
                <div className="inline-block px-4 py-1.5 rounded-full bg-purple-900/30 text-purple-400 text-sm font-medium mb-6 border border-purple-500/20">
                    Нейросеть V3.0 уже здесь
                </div>

                <h1 className="text-4xl md:text-6xl font-bold mb-6 max-w-4xl leading-tight">
                    Твоя персональная <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">AI Фотостудия</span>
                </h1>
                <p className="text-gray-400 text-lg mb-10 max-w-2xl">
                    Загрузи свое фото и выбери стиль. Наша нейросеть обработает его за пару секунд, сохранив черты лица.
                </p>

                {/* Simple Upload Box */}
                <div className="w-full max-w-xl bg-[#1E1E1E] rounded-2xl border border-white/5 p-10 mb-16 flex flex-col items-center justify-center hover:border-purple-500/50 transition-all cursor-pointer group shadow-2xl">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 text-purple-500 group-hover:scale-110 transition-transform">
                        <UploadCloud size={40} />
                    </div>
                    <h3 className="text-2xl font-semibold mb-2">Загрузить фото</h3>
                    <p className="text-gray-500">Перетащите сюда или нажмите для выбора</p>
                    <button className="mt-6 px-8 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-bold transition-colors">
                        Выбрать файл
                    </button>
                </div>

                {/* Styles Grid - Simple Cards */}
                <div className="w-full max-w-6xl text-left">
                    <div className="flex justify-between items-end mb-8">
                        <h2 className="text-3xl font-bold">Популярные стили</h2>
                        <a href="#" className="text-purple-400 hover:text-purple-300">Смотреть все</a>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { title: 'Cyberpunk 2077', color: 'from-pink-500 to-purple-600' },
                            { title: 'Anime V4', color: 'from-blue-400 to-indigo-600' },
                            { title: 'Business Portrait', color: 'from-gray-700 to-gray-900' },
                            { title: 'Oil Painting', color: 'from-yellow-600 to-orange-700' },
                            { title: 'GTA Style', color: 'from-green-500 to-emerald-700' },
                            { title: 'Barbie Core', color: 'from-pink-400 to-rose-500' },
                            { title: 'Viking', color: 'from-slate-600 to-slate-800' },
                            { title: 'Sketch', color: 'from-gray-400 to-gray-600' }
                        ].map((style, i) => (
                            <div key={i} className="aspect-[3/4] bg-[#1E1E1E] rounded-xl overflow-hidden relative group cursor-pointer border border-white/5 hover:border-purple-500/50 transition-all shadow-lg">
                                {/* Placeholder for image */}
                                <div className={`w-full h-full bg-gradient-to-br ${style.color} opacity-40 group-hover:opacity-60 transition-opacity`}></div>
                                <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:opacity-100 transition-opacity">
                                    <Wand2 className="text-white" size={32} />
                                </div>

                                <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/90 to-transparent">
                                    <span className="font-bold text-lg">{style.title}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <footer className="py-10 border-t border-white/5 text-center text-gray-500 text-sm bg-[#121212] mt-12">
                <div className="flex justify-center gap-8 mb-6 font-medium">
                    <a href="#" className="hover:text-white transition-colors">Telegram Бот</a>
                    <a href="#" className="hover:text-white transition-colors">Группа VK</a>
                    <a href="#" className="hover:text-white transition-colors">Поддержка</a>
                    <a href="#" className="hover:text-white transition-colors">Оферта</a>
                </div>
                <p>&copy; 2024 Kipish.fun. Все права защищены.</p>
            </footer>
        </div>
    );
};

// --- MAIN APP COMPONENT ---
const AppNew = () => {
    const [version, setVersion] = useState('standard'); // 'standard' | 'pro' | 'old'
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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
                            <span className="text-[10px] font-mono text-gray-500 leading-none mt-1 tracking-wider">
                                {version === 'standard' ? 'LITE EDITION' : (version === 'pro' ? 'NANABANANA LAB' : 'CURRENT LIVE')}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex gap-6 text-sm font-medium text-gray-400">
                            <a href="#" className="hover:text-white">Модели</a>
                            <a href="#" className="hover:text-white">API</a>
                        </div>
                        {/* Version Switcher */}
                        <VersionSwitcher version={version} setVersion={setVersion} />
                    </div>
                </div>
            </nav>

            {/* Render Version */}
            {version === 'standard' && <StandardVersion />}
            {version === 'pro' && <ProVersion />}
            {version === 'old' && <OldVersion />}

        </div>
    );
};

export default AppNew;
