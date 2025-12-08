import React, { useCallback } from 'react';
import { UploadedImage } from '../types';

interface ImageUploaderProps {
  label: string;
  images: UploadedImage[];
  setImages: (images: UploadedImage[]) => void;
  maxImages: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ label, images, setImages, maxImages }) => {

  const processFile = (file: File): Promise<UploadedImage> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        // Extract base64 data (remove "data:image/jpeg;base64," prefix)
        const base64Data = result.split(',')[1];
        resolve({
          id: Math.random().toString(36).substr(2, 9),
          file,
          previewUrl: result,
          base64Data,
          mimeType: file.type
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const remainingSlots = maxImages - images.length;
      const filesToProcess = newFiles.slice(0, remainingSlots);
      
      const processedImages = await Promise.all(filesToProcess.map(processFile));
      setImages([...images, ...processedImages]);
    }
  };

  const removeImage = (id: string) => {
    setImages(images.filter(img => img.id !== id));
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-slate-300 mb-2">{label} (Макс. {maxImages})</label>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {images.map((img) => (
          <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-700 bg-slate-800">
            <img src={img.previewUrl} alt="preview" className="w-full h-full object-cover" />
            <button
              onClick={() => removeImage(img.id)}
              className="absolute top-1 right-1 bg-red-500/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ))}
        
        {images.length < maxImages && (
          <label className="flex flex-col items-center justify-center w-full h-full min-h-[120px] border-2 border-slate-700 border-dashed rounded-lg cursor-pointer bg-slate-800/50 hover:bg-slate-800 hover:border-gemini-500 transition-all">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg className="w-8 h-8 mb-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              <p className="text-xs text-slate-400">Добавить фото</p>
            </div>
            <input type="file" className="hidden" accept="image/*" multiple onChange={handleFileChange} />
          </label>
        )}
      </div>
    </div>
  );
};