import { supabase } from './supabaseClient';
import type { User, Payment, Generation, SubscriptionPlan, CreditPackage, SubscriptionTier } from '../types/supabase';

// User Service
export const userService = {
    // Get or create user
    async getOrCreateUser(authProvider: 'google' | 'telegram' | 'guest', authId: string, name: string, email?: string, avatarUrl?: string): Promise<User | null> {
        try {
            // Try to find existing user
            const { data: existing, error: findError } = await supabase
                .from('users')
                .select('*')
                .eq('auth_provider', authProvider)
                .eq('auth_id', authId)
                .single();

            if (existing && !findError) {
                return existing;
            }

            // Create new user with 5 free credits
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert({
                    auth_provider: authProvider,
                    auth_id: authId,
                    name,
                    email,
                    avatar_url: avatarUrl,
                    credits: 5, // 5 free generations
                    subscription_tier: 'free'
                })
                .select()
                .single();

            if (createError) throw createError;
            return newUser;
        } catch (error) {
            console.error('Error in getOrCreateUser:', error);
            return null;
        }
    },

    // Get user by ID
    async getUser(userId: string): Promise<User | null> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error getting user:', error);
            return null;
        }
        return data;
    },

    // Check if user can generate
    async canGenerate(userId: string, creditsNeeded: number = 1): Promise<boolean> {
        const { data, error } = await supabase.rpc('can_generate', {
            p_user_id: userId,
            p_credits_needed: creditsNeeded
        });

        if (error) {
            console.error('Error checking generation permission:', error);
            return false;
        }
        return data === true;
    },

    // Deduct credits
    async deductCredits(userId: string, credits: number = 1): Promise<boolean> {
        const { error } = await supabase.rpc('deduct_credits', {
            p_user_id: userId,
            p_credits: credits
        });

        if (error) {
            console.error('Error deducting credits:', error);
            return false;
        }
        return true;
    },

    // Update subscription
    async updateSubscription(userId: string, tier: SubscriptionTier, expiresAt?: Date): Promise<boolean> {
        const { error } = await supabase
            .from('users')
            .update({
                subscription_tier: tier,
                subscription_expires_at: expiresAt?.toISOString()
            })
            .eq('id', userId);

        if (error) {
            console.error('Error updating subscription:', error);
            return false;
        }
        return true;
    },

    // Add credits
    async addCredits(userId: string, creditsToAdd: number): Promise<boolean> {
        // First get current credits
        const { data: user } = await supabase
            .from('users')
            .select('credits')
            .eq('id', userId)
            .single();

        if (!user) return false;

        // Then update with new value
        const { error } = await supabase
            .from('users')
            .update({
                credits: user.credits + creditsToAdd
            })
            .eq('id', userId);

        if (error) {
            console.error('Error adding credits:', error);
            return false;
        }
        return true;
    }
};

// Payment Service
export const paymentService = {
    // Create payment record
    async createPayment(
        userId: string,
        type: 'subscription' | 'credits',
        amount: number,
        tier?: SubscriptionTier,
        credits?: number,
        telegramPaymentId?: string
    ): Promise<Payment | null> {
        const { data, error } = await supabase
            .from('payments')
            .insert({
                user_id: userId,
                type,
                amount,
                currency: 'UAH',
                tier,
                credits,
                telegram_payment_id: telegramPaymentId,
                status: 'pending'
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating payment:', error);
            return null;
        }
        return data;
    },

    // Complete payment
    async completePayment(paymentId: string, telegramChargeId?: string): Promise<boolean> {
        const { error } = await supabase
            .from('payments')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                telegram_charge_id: telegramChargeId
            })
            .eq('id', paymentId);

        if (error) {
            console.error('Error completing payment:', error);
            return false;
        }
        return true;
    },

    // Get user payments
    async getUserPayments(userId: string): Promise<Payment[]> {
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error getting payments:', error);
            return [];
        }
        return data || [];
    }
};

// Generation Service
export const generationService = {
    // Create generation request
    async createGeneration(
        userId: string,
        mode: 'selfie' | 'photoshoot' | 'replicate',
        imageCount: number,
        quality: 'sd' | 'hd' | 'uhd',
        priority: 'normal' | 'high' | 'max'
    ): Promise<Generation | null> {
        const { data, error } = await supabase
            .from('generations')
            .insert({
                user_id: userId,
                mode,
                image_count: imageCount,
                quality,
                priority,
                status: 'queued',
                credits_used: imageCount
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating generation:', error);
            return null;
        }
        return data;
    },

    // Update generation status
    async updateGenerationStatus(
        generationId: string,
        status: 'processing' | 'completed' | 'failed',
        resultUrls?: string[],
        errorMessage?: string
    ): Promise<boolean> {
        const updates: any = { status };

        if (status === 'processing') {
            updates.started_at = new Date().toISOString();
        } else if (status === 'completed' || status === 'failed') {
            updates.completed_at = new Date().toISOString();
        }

        if (resultUrls) updates.result_urls = resultUrls;
        if (errorMessage) updates.error_message = errorMessage;

        const { error } = await supabase
            .from('generations')
            .update(updates)
            .eq('id', generationId);

        if (error) {
            console.error('Error updating generation:', error);
            return false;
        }
        return true;
    },

    // Get user generations
    async getUserGenerations(userId: string, limit: number = 20): Promise<Generation[]> {
        const { data, error } = await supabase
            .from('generations')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error getting generations:', error);
            return [];
        }
        return data || [];
    },

    // Get queue position
    async getQueuePosition(generationId: string): Promise<number> {
        const { data: generation } = await supabase
            .from('generations')
            .select('queued_at, priority')
            .eq('id', generationId)
            .single();

        if (!generation) return -1;

        const { count } = await supabase
            .from('generations')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'queued')
            .or(`priority.gt.${generation.priority},and(priority.eq.${generation.priority},queued_at.lt.${generation.queued_at})`);

        return (count || 0) + 1;
    }
};

// Subscription Plans Service
export const plansService = {
    // Get all plans
    async getPlans(): Promise<SubscriptionPlan[]> {
        const { data, error } = await supabase
            .from('subscription_plans')
            .select('*')
            .order('monthly_price_uah', { ascending: true });

        if (error) {
            console.error('Error getting plans:', error);
            return [];
        }
        return data || [];
    },

    // Get credit packages
    async getCreditPackages(): Promise<CreditPackage[]> {
        const { data, error } = await supabase
            .from('credit_packages')
            .select('*')
            .order('credits', { ascending: true });

        if (error) {
            console.error('Error getting packages:', error);
            return [];
        }
        return data || [];
    }
};
