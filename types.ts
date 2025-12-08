
export interface UploadedImage {
  id: string;
  file: File;
  previewUrl: string;
  base64Data: string; // Pure base64 without mime type prefix for API
  mimeType: string;
}

export interface PhotosetConfig {
  userPhotos: UploadedImage[];
  locationPhotos: UploadedImage[];
  locationDescription: string;
  positivePrompt: string;
  negativePrompt: string;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
}

export interface PhotoshootPlan {
  characterDescription: string;
  outfitDescription: string;
  locationDescription: string;
  scenarios: {
    angle: string;
    pose: string;
    action: string;
    lighting: string;
  }[];
}

export interface UserProfile {
  id: string;
  name: string;
  avatarUrl?: string;
  provider: 'google' | 'telegram' | 'guest';
  // Database fields
  dbUserId?: string;
  credits?: number;
  subscriptionTier?: 'free' | 'light' | 'pro' | 'ultra';
}

export enum AppState {
  IDLE,
  ANALYZING,
  GENERATING,
  COMPLETE,
  ERROR
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}
