import React from 'react';

interface LoadingScreenProps {
  status: string;
  progress: number; // 0 to 100
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ status, progress }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-sm">
      <div className="w-full max-w-md p-6 bg-slate-800 rounded-xl shadow-2xl border border-slate-700">
        <div className="flex justify-center mb-6">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-slate-600"></div>
            <div className="absolute inset-0 rounded-full border-4 border-gemini-500 border-t-transparent animate-spin"></div>
            <div className="absolute inset-2 bg-gradient-to-tr from-gemini-600 to-purple-600 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-center text-white mb-2">Создание фотосессии</h3>
        <p className="text-center text-slate-400 mb-6 animate-pulse">{status}</p>
        
        <div className="w-full bg-slate-700 rounded-full h-2.5 mb-2 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-gemini-500 to-purple-500 h-2.5 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-right text-xs text-slate-500">{progress}%</p>
      </div>
    </div>
  );
};