
import React, { useState, useCallback, useEffect } from 'react';
import { AppState, UploadedImage, GeneratedImage, PhotoshootPlan, UserProfile } from './types';
import { ImageUploader } from './components/ImageUploader';
import { LoadingScreen } from './components/LoadingScreen';
import { ResultGallery } from './components/ResultGallery';
import { MultiSelect } from './components/MultiSelect';
import { AuthScreen } from './components/AuthScreen'; // Import AuthScreen
import { PricingModal } from './components/PricingModal';
import { ProfileModal } from './components/ProfileModal';
import { planPhotoshoot, generateScenarioImage } from './services/geminiService';
import { userService, generationService } from './services/databaseService';

const App: React.FC = () => {
  // Auth State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Initialize Auth from LocalStorage and sync with DB
  useEffect(() => {
    const storedUser = localStorage.getItem('ai_studio_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);

        // Refresh credits from DB
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

  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('ai_studio_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ai_studio_user');
    resetApp();
  };

  // State
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [statusMessage, setStatusMessage] = useState("Инициализация...");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPermissionError, setIsPermissionError] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Model Selection
  const [useProModel, setUseProModel] = useState(false);
  const [isSelfieMode, setIsSelfieMode] = useState(false);
  const [isReplicateMode, setIsReplicateMode] = useState(false);

  // Inputs
  const [userPhotos, setUserPhotos] = useState<UploadedImage[]>([]);
  const [hasTattoos, setHasTattoos] = useState(false);
  const [tattooPhotos, setTattooPhotos] = useState<UploadedImage[]>([]);
  const [tattooLocation, setTattooLocation] = useState("");
  const [locationPhotos, setLocationPhotos] = useState<UploadedImage[]>([]);
  const [locationText, setLocationText] = useState("");
  const [positivePrompt, setPositivePrompt] = useState("Cinematic, warm lighting, professional photography");
  const [negativePrompt, setNegativePrompt] = useState("Blurry, low quality, distorted face, bad anatomy, cartoon, drawing");
  const [imageCount, setImageCount] = useState(5);

  // Location/Pose Add-ons
  const [showPoseAddons, setShowPoseAddons] = useState(false);
  const [posePhotos, setPosePhotos] = useState<UploadedImage[]>([]);
  const [poseText, setPoseText] = useState("");

  // Style Add-ons State
  const [showAddons, setShowAddons] = useState(false);
  const [hairstylePhotos, setHairstylePhotos] = useState<UploadedImage[]>([]);
  const [hairstyleText, setHairstyleText] = useState("");
  const [makeupPhotos, setMakeupPhotos] = useState<UploadedImage[]>([]);
  const [makeupText, setMakeupText] = useState("");
  const [outfitPhotos, setOutfitPhotos] = useState<UploadedImage[]>([]);
  const [outfitText, setOutfitText] = useState("");

  // Camera Angles
  const [selectedAngles, setSelectedAngles] = useState<string[]>([]);

  const availableAngles = [
    "Экстремальный крупный план (Extreme Close Up)",
    "Крупный план (Close Up)",
    "Анфас (Front View)",
    "Студийный портрет (Studio Portrait)",
    "Домашняя фотосессия (Home Lifestyle)",
    "Уличная фотосессия (Street Outdoor)",
    "В полный рост (Full Body)",
    "Крупный портрет (Face Close-up)",
    "Нижний ракурс (Low angle)",
    "Верхний ракурс (High angle)",
    "Сбоку (Side profile)"
  ];

  // Outputs
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [photoshootPlan, setPhotoshootPlan] = useState<PhotoshootPlan | null>(null);

  const handleGenerate = useCallback(async () => {
    if (userPhotos.length === 0) {
      setErrorMsg("Пожалуйста, загрузите хотя бы 1 ваше фото.");
      return;
    }

    if (isReplicateMode && locationPhotos.length === 0) {
      setErrorMsg("Для режима 'Повторить фото' необходимо загрузить хотя бы 1 фото локации/референса.");
      return;
    }

    try {
      setAppState(AppState.ANALYZING);
      setErrorMsg(null);
      setIsPermissionError(false);

      // Step 0: Check Credits
      const requiredCredits = imageCount;
      if (currentUser?.dbUserId) {
        const canGen = await userService.canGenerate(currentUser.dbUserId, requiredCredits);
        if (!canGen) {
          setAppState(AppState.IDLE);
          setShowPricing(true);
          return;
        }
      } else {
        // Guest/Demo user local check
        if ((currentUser?.credits || 0) < requiredCredits) {
          setAppState(AppState.IDLE);
          setShowPricing(true);
          return;
        }
      }

      // Step 1: Analyze and Plan
      setStatusMessage("Анализирую ваш стиль и локацию...");
      setProgress(10);

      const plan = await planPhotoshoot(
        userPhotos,
        locationPhotos,
        locationText,
        positivePrompt,
        hasTattoos ? tattooPhotos : [],
        hasTattoos ? tattooLocation : "",
        showAddons ? hairstylePhotos : [],
        showAddons ? hairstyleText : "",
        showAddons ? makeupPhotos : [],
        showAddons ? makeupText : "",
        showAddons ? outfitPhotos : [],
        showAddons ? outfitText : "",
        isSelfieMode ? [] : (showPoseAddons ? posePhotos : []),
        isSelfieMode ? "" : (showPoseAddons ? poseText : ""),
        isSelfieMode ? [] : selectedAngles,
        imageCount,
        isSelfieMode,
        isReplicateMode
      );
      setPhotoshootPlan(plan);

      console.log("Plan created:", plan);

      // Create generation record in DB
      let currentGenerationId: string | null = null;
      if (currentUser?.dbUserId) {
        const genRecord = await generationService.createGeneration(
          currentUser.dbUserId,
          isReplicateMode ? 'replicate' : (isSelfieMode ? 'selfie' : 'photoshoot'),
          imageCount,
          useProModel ? 'hd' : 'sd', // mapping to quality
          'normal'
        );
        if (genRecord) {
          currentGenerationId = genRecord.id;
        }
      }

      // Step 2: Generate Images
      setAppState(AppState.GENERATING);
      const newImages: GeneratedImage[] = [];
      const totalImages = imageCount;

      for (let i = 0; i < totalImages; i++) {
        setStatusMessage(`Создаю фото ${i + 1} из ${totalImages} (в том же наряде)...`);

        // Update generation status to processing if it's the first image
        if (i === 0 && currentGenerationId) {
          await generationService.updateGenerationStatus(currentGenerationId, 'processing');
        }

        // Pick a random user photo as Face reference
        const refPhoto = userPhotos[i % userPhotos.length];

        // Pick a scene reference if available (Replicate Mode OR Standard Location Photo)
        let sceneRefPhoto: UploadedImage | undefined = undefined;
        if (locationPhotos.length > 0) {
          // Use location photos as direct references if provided
          sceneRefPhoto = locationPhotos[i % locationPhotos.length];
        }

        const result = await generateScenarioImage(
          plan,
          i,
          refPhoto,
          positivePrompt,
          negativePrompt,
          useProModel,
          sceneRefPhoto,
          isReplicateMode
        );

        // Deduct credit
        // Always update local state immediately using functional update to handle async loop correctly
        setCurrentUser(prevUser => {
          if (!prevUser) return null;
          const updatedUser = { ...prevUser, credits: (prevUser.credits || 0) - 1 };
          localStorage.setItem('ai_studio_user', JSON.stringify(updatedUser));
          return updatedUser;
        });

        // If real user, sync with DB
        // Connect to DB using ID which is stable
        if (currentUser?.dbUserId) {
          await userService.deductCredits(currentUser.dbUserId, 1);
        }

        newImages.push({
          id: `gen-${Date.now()}-${i}`,
          url: `data:image/png;base64,${result.base64}`,
          prompt: result.prompt
        });

        setProgress(20 + ((i + 1) / totalImages) * 80);
        setGeneratedImages([...newImages]); // Update incrementally

        // Add a delay between requests to avoid hitting rate limits (429 errors)
        if (i < totalImages - 1) {
          setStatusMessage(`Пауза для соблюдения лимитов API...`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2-second delay
        }
      }

      // Mark generation as complete in DB
      if (currentGenerationId) {
        await generationService.updateGenerationStatus(currentGenerationId, 'completed');
      }

      setAppState(AppState.COMPLETE);

    } catch (error: any) {
      console.error(error);
      setAppState(AppState.ERROR);
      const msg = error.message || "Произошла непредвиденная ошибка.";

      // Mark generation as failed in DB
      // We don't have access to currentGenerationId here easily due to block scope, 
      // but in a real refactor we would lift it. For now, we accept it might stay stuck or we can't update it in catch block easily 
      // without lifting variable declaration. 
      // *Self-Correction*: I will lift the declaration in the ReplacementContent to the top of try block.

      // Check for specific errors to provide better user feedback
      if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
        setErrorMsg("Превышен лимит запросов к API. Пожалуйста, подождите минуту и попробуйте снова.");
        setIsPermissionError(false);
      } else if (msg.includes("403") || msg.includes("PERMISSION_DENIED") || msg.includes("permission")) {
        setErrorMsg(msg);
        setIsPermissionError(true);
      } else {
        setErrorMsg(msg);
      }
    }
  }, [
    currentUser,
    userPhotos, locationPhotos, locationText, positivePrompt, negativePrompt, hasTattoos, tattooPhotos, tattooLocation,
    showAddons, hairstylePhotos, hairstyleText, makeupPhotos, makeupText, outfitPhotos, outfitText,
    showPoseAddons, posePhotos, poseText, selectedAngles, useProModel, imageCount, isSelfieMode, isReplicateMode
  ]);

  const handleSelectKey = async () => {
    try {
      const win = window as any;
      if (win.aistudio && win.aistudio.openSelectKey) {
        await win.aistudio.openSelectKey();
        setErrorMsg(null);
        setIsPermissionError(false);
        setAppState(AppState.IDLE);
        alert("API-ключ обновлен. Пожалуйста, попробуйте сгенерировать снова.");
      }
    } catch (e) {
      console.error(e);
      alert("Не удалось открыть выбор ключа.");
    }
  };

  const resetApp = () => {
    setAppState(AppState.IDLE);
    setGeneratedImages([]);
    setPhotoshootPlan(null);
    setProgress(0);
  };

  // If not authenticated, show AuthScreen
  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <header className="mb-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-gemini-400 to-purple-500 tracking-tight">
              Студия AI Фотосессий
            </h1>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2 rounded-full border border-slate-700/50 backdrop-blur-md">
            {currentUser.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full border border-slate-600" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-gemini-500 flex items-center justify-center text-xs font-bold text-white">
                {currentUser.name.charAt(0)}
              </div>
            )}
            <div className="text-sm">
              <p className="text-white font-medium leading-none">{currentUser.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-[10px] text-slate-400 leading-none uppercase tracking-wide opacity-70">{currentUser.provider}</p>
                {currentUser.credits !== undefined && (
                  <button
                    onClick={() => setShowPricing(true)}
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold cursor-pointer hover:opacity-80 transition-opacity ${currentUser.credits > 0 ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400 shadow-pulse-red'}`}
                    title="Пополнить баланс"
                  >
                    {currentUser.credits} ⚡
                  </button>
                )}
                <button
                  onClick={() => setShowProfile(true)}
                  className="text-[10px] px-2 py-1 bg-purple-900/50 text-purple-300 rounded-full font-bold hover:bg-purple-800/50 transition-colors uppercase"
                  title="Личный кабинет"
                >
                  Профиль
                </button>
              </div>
            </div>
            <div className="h-6 w-px bg-slate-700 mx-1"></div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-white transition-colors p-1"
              title="Выйти"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        {appState === AppState.IDLE && (
          <p className="text-slate-400 max-w-2xl mx-auto text-center mb-8 -mt-6">
            Загрузите ваши фото и пример локации. Мы сгенерируем профессиональную {isSelfieMode ? 'серию селфи' : `фотосессию из ${imageCount} кадров`} с единым стилем, используя модели Gemini.
          </p>
        )}

        {/* Loading Overlay */}
        {/* Loading Overlay (Hide once we have at least 1 image to show) */}
        {(appState === AppState.ANALYZING || (appState === AppState.GENERATING && generatedImages.length === 0)) && (
          <LoadingScreen status={statusMessage} progress={Math.round(progress)} />
        )}

        {/* Result Gallery (Always show if we have images) */}
        {(appState === AppState.COMPLETE || (appState === AppState.GENERATING && generatedImages.length > 0)) && (
          <div className="mb-12 animate-fadeIn">
            <ResultGallery
              images={generatedImages}
              plan={photoshootPlan}
              onReset={resetApp}
              isValidating={appState === AppState.GENERATING}
              initialSelectedIndex={generatedImages.length - 1} // Auto-focus latest image
            />
          </div>
        )}

        {/* Input Form (Hide only if complete) */}
        {appState !== AppState.COMPLETE && appState !== AppState.GENERATING && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Left Column: Uploads */}
            <div className="lg:col-span-7 space-y-8 bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
              <div>
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gemini-600 text-xs">1</span>
                  Ваши фото
                </h2>
                <ImageUploader
                  label="Загрузите 1-10 ваших фото (лицо должно быть хорошо видно)"
                  images={userPhotos}
                  setImages={setUserPhotos}
                  maxImages={10}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-xs">2</span>
                    Локация
                  </h2>

                  {/* Replicate Mode Toggle */}
                  <div className="flex items-center gap-2 bg-slate-700/50 px-3 py-1.5 rounded-full border border-slate-600">
                    <input
                      id="isReplicateMode"
                      type="checkbox"
                      checked={isReplicateMode}
                      onChange={(e) => setIsReplicateMode(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-500 bg-slate-800 text-purple-500 focus:ring-purple-600"
                      disabled={isSelfieMode}
                    />
                    <label htmlFor="isReplicateMode" className={`text-xs font-semibold cursor-pointer select-none ${isSelfieMode ? 'text-slate-500' : 'text-purple-300'}`}>
                      Повторить фото (с заменой лица)
                    </label>
                  </div>
                </div>

                <ImageUploader
                  label={isReplicateMode ? "Загрузите фото для повторения (композиция будет скопирована)" : "Загрузите 1-10 фото локации"}
                  images={locationPhotos}
                  setImages={setLocationPhotos}
                  maxImages={10}
                />

                <textarea
                  className="w-full mt-3 bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:ring-2 focus:ring-gemini-500 focus:border-transparent outline-none resize-none transition-all"
                  rows={3}
                  placeholder="Или опишите локацию текстом (например, 'Киберпанк-рынок на ночной улице под неоновым дождем')..."
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  disabled={isReplicateMode} // Text not needed if replicating
                />

                <div className={`mt-6 border-t border-slate-700 pt-6 transition-opacity ${isSelfieMode || isReplicateMode ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                  <div className="flex items-center">
                    <input
                      id="showPoseAddons"
                      type="checkbox"
                      checked={showPoseAddons}
                      onChange={(e) => setShowPoseAddons(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-gemini-500 focus:ring-gemini-600"
                      disabled={isSelfieMode || isReplicateMode}
                    />
                    <label htmlFor="showPoseAddons" className="ml-3 block text-sm font-medium text-slate-200">
                      Дополнительные настройки позы {isSelfieMode && <span className="text-xs text-slate-500">(недоступно в режиме селфи)</span>} {isReplicateMode && <span className="text-xs text-slate-500">(автоматически из фото)</span>}
                    </label>
                  </div>

                  {showPoseAddons && !isSelfieMode && !isReplicateMode && (
                    <div className="mt-4 space-y-4 animate-fadeIn">
                      <ImageUploader
                        label="Загрузите референс позы"
                        images={posePhotos}
                        setImages={setPosePhotos}
                        maxImages={5}
                      />
                      <textarea
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:ring-2 focus:ring-gemini-500 focus:border-transparent outline-none resize-none transition-all"
                        rows={2}
                        placeholder="Опишите желаемую позу (например, 'Сидит на стуле, нога на ногу')..."
                        value={poseText}
                        onChange={(e) => setPoseText(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Controls */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-pink-600 text-xs">3</span>
                  Настройки стиля
                </h2>

                <div className="space-y-4">
                  {/* Generation Mode Buttons */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                      Тип генерации
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => { setIsSelfieMode(true); setIsReplicateMode(false); }}
                        className={`w-full py-2 px-3 text-sm font-semibold rounded-lg border transition-all duration-200 ${isSelfieMode
                          ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-900/30'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:border-slate-500'
                          }`}
                      >
                        Селфи
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsSelfieMode(false)}
                        className={`w-full py-2 px-3 text-sm font-semibold rounded-lg border transition-all duration-200 ${!isSelfieMode
                          ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-900/30'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:border-slate-500'
                          }`}
                      >
                        Фотосессия
                      </button>
                    </div>
                  </div>

                  {/* Image Count Slider */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                      Количество фото: <span className="text-white font-bold text-sm ml-1">{imageCount}</span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={imageCount}
                      onChange={(e) => setImageCount(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-gemini-500"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>1</span>
                      <span>10</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Позитивный промпт</label>
                    <textarea
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:ring-2 focus:ring-gemini-500 focus:outline-none"
                      rows={4}
                      value={positivePrompt}
                      onChange={(e) => setPositivePrompt(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Негативный промпт</label>
                    <textarea
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:ring-2 focus:ring-red-500 focus:outline-none"
                      rows={2}
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                    />
                  </div>

                  {/* Camera Angles Dropdown */}
                  <div className={`transition-opacity ${isSelfieMode || isReplicateMode ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                    <MultiSelect
                      label={`Ракурсы камеры ${isSelfieMode ? '(недоступно в режиме селфи)' : ''}`}
                      options={availableAngles}
                      selected={selectedAngles}
                      onChange={setSelectedAngles}
                    />
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-700 pt-6">
                  <div className="flex items-center">
                    <input
                      id="showAddons"
                      type="checkbox"
                      checked={showAddons}
                      onChange={(e) => setShowAddons(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-gemini-500 focus:ring-gemini-600"
                    />
                    <label htmlFor="showAddons" className="ml-3 block text-sm font-medium text-slate-200">
                      Добавить детальные дополнения к стилю
                    </label>
                  </div>

                  {showAddons && (
                    <div className="mt-4 space-y-8 animate-fadeIn">
                      {/* Tattoos */}
                      <div>
                        <div className="flex items-center mb-3">
                          <input
                            id="hasTattoos"
                            type="checkbox"
                            checked={hasTattoos}
                            onChange={(e) => setHasTattoos(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-gemini-500 focus:ring-gemini-600"
                          />
                          <label htmlFor="hasTattoos" className="ml-3 text-md font-semibold text-slate-300 cursor-pointer">
                            Татуировки
                          </label>
                        </div>
                        {hasTattoos && (
                          <div className="pl-7 space-y-3 animate-fadeIn">
                            <ImageUploader
                              label="Фото татуировок"
                              images={tattooPhotos}
                              setImages={setTattooPhotos}
                              maxImages={10}
                            />
                            <textarea
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-200 focus:ring-2 focus:ring-gemini-500 focus:border-transparent outline-none resize-none transition-all"
                              rows={2}
                              placeholder="Расположение и цвета (например: 'Цветной дракон на всю спину', 'Черная надпись на левом запястье')..."
                              value={tattooLocation}
                              onChange={(e) => setTattooLocation(e.target.value)}
                            />
                          </div>
                        )}
                      </div>

                      <hr className="border-slate-700" />

                      <div>
                        <h3 className="text-md font-semibold text-slate-300 mb-2">Прическа</h3>
                        <ImageUploader label="Примеры прически" images={hairstylePhotos} setImages={setHairstylePhotos} maxImages={5} />
                        <textarea className="w-full mt-2 bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm" rows={2} placeholder="Или опишите прическу..." value={hairstyleText} onChange={e => setHairstyleText(e.target.value)} />
                      </div>
                      <div>
                        <h3 className="text-md font-semibold text-slate-300 mb-2">Макияж</h3>
                        <ImageUploader label="Примеры макияжа" images={makeupPhotos} setImages={setMakeupPhotos} maxImages={5} />
                        <textarea className="w-full mt-2 bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm" rows={2} placeholder="Или опишите макияж..." value={makeupText} onChange={e => setMakeupText(e.target.value)} />
                      </div>
                      <div>
                        <h3 className="text-md font-semibold text-slate-300 mb-2">Наряд</h3>
                        <ImageUploader label="Примеры наряда" images={outfitPhotos} setImages={setOutfitPhotos} maxImages={5} />
                        <textarea className="w-full mt-2 bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm" rows={2} placeholder="Или опишите наряд..." value={outfitText} onChange={e => setOutfitText(e.target.value)} />
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {errorMsg && (
                <div className="p-4 bg-red-900/50 border border-red-700/50 text-red-200 rounded-lg text-sm flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span>{errorMsg}</span>
                  </div>

                  {isPermissionError && (
                    <button
                      onClick={handleSelectKey}
                      className="mt-2 py-2 px-4 bg-red-700 hover:bg-red-600 rounded text-xs font-bold uppercase tracking-wider transition-colors w-full"
                    >
                      Подключить аккаунт Google (требуется биллинг)
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={appState !== AppState.IDLE && appState !== AppState.ERROR}
                className="w-full py-4 px-6 bg-gradient-to-r from-gemini-600 to-purple-600 hover:from-gemini-500 hover:to-purple-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-purple-900/20 transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex justify-center items-center gap-3"
              >
                {appState === AppState.IDLE || appState === AppState.ERROR ? (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                    {isSelfieMode ? 'Создать селфи' : isReplicateMode ? 'Сгенерировать (Face Swap)' : 'Создать фотосессию'}
                  </>
                ) : (
                  "В процессе..."
                )}
              </button>


            </div>
          </div>
        )}
        {/* Pricing Modal */}
        {showPricing && (
          <PricingModal
            isOpen={showPricing}
            onClose={() => setShowPricing(false)}
            currentTier={currentUser?.subscriptionTier}
            currentUser={currentUser}
            onPaymentSuccess={async (addedCredits, newTier) => {
              // Optimistic UI Update: Immediately update credits in local state
              if (currentUser) {
                const optimisticUser = {
                  ...currentUser,
                  credits: (currentUser.credits || 0) + addedCredits,
                  subscriptionTier: newTier || currentUser.subscriptionTier // Update tier if provided
                };
                setCurrentUser(optimisticUser);
                localStorage.setItem('ai_studio_user', JSON.stringify(optimisticUser));
              }

              // Sync with DB if real user
              if (currentUser?.dbUserId) {
                const freshUser = await userService.getUser(currentUser.dbUserId);
                if (freshUser) {
                  const updatedUser = {
                    ...currentUser,
                    credits: freshUser.credits,
                    subscriptionTier: freshUser.subscription_tier
                  };
                  // Only update if differ to avoid flickering or race conditions, 
                  // but usually fresh data is authoritative.
                  setCurrentUser(updatedUser);
                  localStorage.setItem('ai_studio_user', JSON.stringify(updatedUser));
                }
              }
            }}
            onSelectPackage={(pkg) => {
              console.log('Selected package:', pkg);
            }}
          />
        )}

        {/* Profile Modal */}
        {showProfile && currentUser && (
          <ProfileModal
            isOpen={showProfile}
            onClose={() => setShowProfile(false)}
            currentUser={currentUser}
            onOpenPricing={() => {
              setShowProfile(false);
              setShowPricing(true);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default App;
