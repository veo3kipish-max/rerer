import React, { useState, useRef, useEffect } from 'react';

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({ label, options, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-slate-900 border rounded-lg p-3 text-sm text-left text-slate-200 focus:ring-2 focus:ring-gemini-500 focus:outline-none flex justify-between items-center transition-colors ${isOpen ? 'border-gemini-500' : 'border-slate-700'}`}
      >
        <span className="truncate pr-4">
          {selected.length === 0 
            ? "Выберите ракурсы..." 
            : selected.length === options.length
              ? "Все ракурсы выбраны"
              : `${selected.length} выбрано: ${selected.map(s => s.split('(')[0].trim()).slice(0, 2).join(', ')}${selected.length > 2 ? '...' : ''}`
          }
        </span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-20 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-fadeIn">
          {options.map((option) => {
            const isSelected = selected.includes(option);
            return (
              <div 
                key={option}
                className="flex items-center p-3 hover:bg-slate-700 cursor-pointer transition-colors border-b border-slate-700/50 last:border-0"
                onClick={() => toggleOption(option)}
              >
                <div className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center mr-3 transition-all ${isSelected ? 'bg-gemini-600 border-gemini-500' : 'border-slate-500 bg-slate-900/50'}`}>
                  {isSelected && (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  )}
                </div>
                <span className={`text-sm ${isSelected ? 'text-white font-medium' : 'text-slate-300'}`}>{option}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};