// Supabase Database Types

export type SubscriptionTier = 'free' | 'light' | 'pro' | 'ultra';
export type PaymentType = 'subscription' | 'credits';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type GenerationStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type GenerationPriority = 'normal' | 'high' | 'max';
export type QualityLevel = 'sd' | 'hd' | 'uhd';
export type GenerationMode = 'selfie' | 'photoshoot' | 'replicate';

export interface User {
    id: string;
    auth_provider: 'google' | 'telegram' | 'guest';
    auth_id: string;
    name: string;
    email?: string;
    avatar_url?: string;
    subscription_tier: SubscriptionTier;
    subscription_expires_at?: string;
    credits: number;
    total_generated: number;
    last_generation_at?: string;
    created_at: string;
    updated_at: string;
}

export interface Payment {
    id: string;
    user_id: string;
    type: PaymentType;
    tier?: SubscriptionTier;
    credits?: number;
    amount: number;
    currency: string;
    telegram_payment_id?: string;
    telegram_charge_id?: string;
    status: PaymentStatus;
    created_at: string;
    completed_at?: string;
}

export interface Generation {
    id: string;
    user_id: string;
    priority: GenerationPriority;
    status: GenerationStatus;
    quality: QualityLevel;
    mode: GenerationMode;
    image_count: number;
    result_urls?: string[];
    error_message?: string;
    queued_at: string;
    started_at?: string;
    completed_at?: string;
    credits_used: number;
    created_at: string;
}

export interface SubscriptionPlan {
    tier: SubscriptionTier;
    monthly_generations: number;
    max_locations?: number;
    quality_limit: QualityLevel;
    face_id_enabled: boolean;
    priority: GenerationPriority;
    monthly_price_uah?: number;
    description?: string;
    created_at: string;
}

export interface CreditPackage {
    id: string;
    credits: number;
    price_uah: number;
    discount_percent: number;
    popular: boolean;
    created_at: string;
}

export interface AdminLog {
    id: string;
    admin_user_id?: string;
    action: string;
    target_user_id?: string;
    details?: Record<string, any>;
    created_at: string;
}
