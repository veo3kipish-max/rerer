import React, { useState, useEffect, useCallback, memo } from 'react';
import { GeneratedImage, PhotoshootPlan } from '../types';

interface ResultGalleryProps {
  images: GeneratedImage[];
  plan: PhotoshootPlan | null;
  onReset: () => void;
  isValidating?: boolean;
  initialSelectedIndex?: number | null;
}

interface GalleryItemProps {
  img: GeneratedImage;
  index: number;
  onSelect: (index: number) => void;
}

// Sub-component for individual gallery items to handle their own loading state
// Optimized with memo to prevent re-renders when parent state (like selectedIndex) changes
const GalleryItem = memo<GalleryItemProps>(({ img, index, onSelect }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div
      className="group relative rounded-xl overflow-hidden bg-slate-800 shadow-xl border border-slate-700 transition-transform hover:-translate-y-1 cursor-pointer will-change-transform"
      onClick={() => onSelect(index)}
    >
      <div className="aspect-[3/4] overflow-hidden bg-slate-800 relative">
        {/* Placeholder / Loading Spinner */}
        <div
          className={`absolute inset-0 bg-slate-800 flex items-center justify-center transition-opacity duration-500 z-10 ${isLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
          <div className="w-8 h-8 border-2 border-slate-600 border-t-gemini-500 rounded-full animate-spin"></div>
        </div>

        <img
          src={img.url}
          alt={`Generated ${index + 1}`}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105 ${isLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-105 blur-sm'}`}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 z-20">
        <p className="text-white font-semibold mb-1 drop-shadow-md">Нажмите, чтобы увеличить</p>
        <p className="text-xs text-slate-300 line-clamp-2">{img.prompt}</p>
      </div>
    </div>
  );
});

GalleryItem.displayName = 'GalleryItem';

export const ResultGallery: React.FC<ResultGalleryProps> = ({ images, plan, onReset, initialSelectedIndex = null }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(initialSelectedIndex);

  // Auto-open new images when they arrive
  useEffect(() => {
    if (images.length > 0) {
      // If we added a new image (length increased), open it
      setSelectedIndex(images.length - 1);
    }
  }, [images.length]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;

      if (e.key === 'Escape') {
        setSelectedIndex(null);
      } else if (e.key === 'ArrowRight') {
        setSelectedIndex((prev) => (prev !== null && prev < images.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowLeft') {
        setSelectedIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : images.length - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, images.length]);

  const navigate = (direction: 'next' | 'prev', e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex === null) return;

    if (direction === 'prev') {
      setSelectedIndex(selectedIndex > 0 ? selectedIndex - 1 : images.length - 1);
    } else {
      setSelectedIndex(selectedIndex < images.length - 1 ? selectedIndex + 1 : 0);
    }
  };

  // Memoized handler to ensure GalleryItem props remain stable
  const handleSelect = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  return (
    <div className="w-full animate-fadeIn">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-gemini-400 to-purple-400">
          Ваша AI Фотосессия
        </h2>
        <button
          onClick={onReset}
          className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-600 rounded-lg hover:bg-slate-700 hover:text-white transition-colors"
        >
          Создать новый сет
        </button>
      </div>

      {plan && (
        <div className="mb-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <h3 className="text-lg font-semibold text-gemini-400 mb-2">План фотосессии</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
            <div>
              <span className="font-bold text-slate-400">Наряд:</span> {plan.outfitDescription.slice(0, 150)}...
            </div>
            <div>
              <span className="font-bold text-slate-400">Локация:</span> {plan.locationDescription.slice(0, 150)}...
            </div>
          </div>
        </div>
      )}

      {/* Grid View with Optimized Images */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((img, idx) => (
          <GalleryItem
            key={img.id}
            img={img}
            index={idx}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {/* Fullscreen Lightbox */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center animate-fadeIn p-4 overflow-y-auto"
          onClick={() => setSelectedIndex(null)}
        >
          {/* Close Button */}
          <button
            onClick={() => setSelectedIndex(null)}
            className="absolute top-6 right-6 text-white/50 hover:text-white p-2 z-[110] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Navigation - Prev */}
          <button
            onClick={(e) => navigate('prev', e)}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white p-2 z-[110] hidden md:block transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Navigation - Next */}
          <button
            onClick={(e) => navigate('next', e)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white p-2 z-[110] hidden md:block transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Image Container */}
          <div
            className="relative w-full max-w-5xl flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[selectedIndex].url}
              alt="Fullscreen"
              decoding="async"
              className="max-w-full max-h-[70vh] object-contain rounded-sm shadow-2xl animate-fadeIn"
            />

            <div className="mt-4 flex items-center gap-4">
              <span className="text-slate-400 text-sm">
                {selectedIndex + 1} / {images.length}
              </span>
              <a
                href={images[selectedIndex].url}
                download={`photoset-${selectedIndex + 1}.png`}
                className="px-6 py-2 bg-white hover:bg-slate-200 text-slate-900 rounded-full font-bold text-sm transition-colors shadow-lg flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Скачать
              </a>

              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  const img = images[selectedIndex];
                  try {
                    const response = await fetch(img.url);
                    const blob = await response.blob();
                    const file = new File([blob], `kipish-ai-${Date.now()}.png`, { type: 'image/png' });

                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                      await navigator.share({
                        title: 'Kipish AI Photo',
                        text: 'Смотри мое новое фото от Kipish AI! kipish.fun',
                        files: [file]
                      });
                    } else {
                      // Fallback: Copy to clipboard
                      try {
                        await navigator.clipboard.write([
                          new ClipboardItem({ 'image/png': blob })
                        ]);
                        alert('Фото скопировано в буфер обмена!');
                      } catch (err) {
                        alert('Ваш браузер не поддерживает прямой шеринг. Пожалуйста, скачайте фото.');
                      }
                    }
                  } catch (error) {
                    console.error("Sharing failed", error);
                  }
                }}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-full font-bold text-sm transition-all shadow-lg flex items-center gap-2 transform active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Поделиться
              </button>
            </div>

            {/* Prompt Display */}
            <div className="mt-6 w-full max-w-2xl bg-slate-900/80 border border-slate-700/50 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-gemini-400 uppercase tracking-wider">Промпт генерации</span>
                <button
                  onClick={() => navigator.clipboard.writeText(images[selectedIndex].prompt)}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Копировать
                </button>
              </div>
              <p className="text-sm text-slate-300 italic leading-relaxed max-h-32 overflow-y-auto custom-scrollbar pr-2 whitespace-pre-wrap font-mono">
                {images[selectedIndex].prompt.trim()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};