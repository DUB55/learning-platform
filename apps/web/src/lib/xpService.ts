import { supabase } from './supabase';

export interface UserXP {
    id: string;
    user_id: string;
    total_xp: number;
    level: number;
    current_streak: number;
    longest_streak: number;
    last_activity_date: string | null;
}

export interface Achievement {
    id: string;
    key: string;
    name: string;
    description: string;
    icon: string;
    xp_reward: number;
    category: string;
}

export interface UserAchievement {
    id: string;
    user_id: string;
    achievement_id: string;
    unlocked_at: string;
    achievement: Achievement;
}

class XPService {
    /**
     * Get or create user XP record
     */
    async getUserXP(userId: string): Promise<UserXP | null> {
        const { data, error } = await supabase
            .from('user_xp')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code === 'PGRST116') {
            // Record doesn't exist, create it
            const { data: newData, error: insertError } = await supabase
                .from('user_xp')
                .insert([{ user_id: userId }])
                .select()
                .single();

            if (insertError) {
                console.error('Error creating user XP:', insertError);
                return null;
            }
            return newData;
        }

        if (error) {
            console.error('Error fetching user XP:', error);
            return null;
        }

        return data;
    }

    /**
     * Award XP to a user
     */
    async awardXP(userId: string, amount: number, reason: string, referenceId?: string): Promise<boolean> {
        try {
            // Get current XP
            const currentXP = await this.getUserXP(userId);
            if (!currentXP) return false;

            const newTotalXP = currentXP.total_xp + amount;
            const newLevel = this.calculateLevel(newTotalXP);

            // Update user XP
            const { error: updateError } = await supabase
                .from('user_xp')
                .update({
                    total_xp: newTotalXP,
                    level: newLevel,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId);

            if (updateError) {
                console.error('Error updating XP:', updateError);
                return false;
            }

            // Record transaction
            const { error: transactionError } = await supabase
                .from('xp_transactions')
                .insert([{
                    user_id: userId,
                    amount,
                    reason,
                    reference_id: referenceId
                }]);

            if (transactionError) {
                console.error('Error recording XP transaction:', transactionError);
            }

            // Check for level-up achievements
            if (newLevel > currentXP.level) {
                await this.checkLevelUpAchievements(userId, newLevel);
            }

            return true;
        } catch (error) {
            console.error('Error in awardXP:', error);
            return false;
        }
    }

    /**
     * Calculate level from XP
     */
    calculateLevel(xp: number): number {
        return Math.floor(Math.sqrt(xp / 100)) + 1;
    }

    /**
     * Calculate XP needed for next level
     */
    xpForNextLevel(currentLevel: number): number {
        return Math.pow(currentLevel, 2) * 100;
    }

    /**
     * Update daily streak
     */
    async updateStreak(userId: string): Promise<boolean> {
        try {
            const today = new Date().toISOString().split('T')[0];

            // Check if already logged today
            const { data: existingStreak } = await supabase
                .from('daily_streaks')
                .select('*')
                .eq('user_id', userId)
                .eq('activity_date', today)
                .single();

            if (existingStreak) {
                return true; // Already logged today
            }

            // Insert today's activity
            const { error: insertError } = await supabase
                .from('daily_streaks')
                .insert([{
                    user_id: userId,
                    activity_date: today
                }]);

            if (insertError) {
                console.error('Error inserting streak:', insertError);
                return false;
            }

            // Calculate current streak
            const streak = await this.calculateCurrentStreak(userId);

            // Update user_xp with new streak
            const currentXP = await this.getUserXP(userId);
            if (currentXP) {
                const { error: updateError } = await supabase
                    .from('user_xp')
                    .update({
                        current_streak: streak,
                        longest_streak: Math.max(streak, currentXP.longest_streak),
                        last_activity_date: today
                    })
                    .eq('user_id', userId);

                if (updateError) {
                    console.error('Error updating streak:', updateError);
                }

                // Check streak achievements
                await this.checkStreakAchievements(userId, streak);
            }

            return true;
        } catch (error) {
            console.error('Error in updateStreak:', error);
            return false;
        }
    }

    /**
     * Calculate current streak from daily_streaks
     */
    async calculateCurrentStreak(userId: string): Promise<number> {
        const { data, error } = await supabase
            .from('daily_streaks')
            .select('activity_date')
            .eq('user_id', userId)
            .order('activity_date', { ascending: false });

        if (error || !data || data.length === 0) {
            return 0;
        }

        let streak = 0;
        let expectedDate = new Date();
        expectedDate.setHours(0, 0, 0, 0);

        for (const record of data) {
            const activityDate = new Date(record.activity_date);
            activityDate.setHours(0, 0, 0, 0);

            if (activityDate.getTime() === expectedDate.getTime()) {
                streak++;
                expectedDate.setDate(expectedDate.getDate() - 1);
            } else {
                break;
            }
        }

        return streak;
    }

    /**
     * Unlock an achievement
     */
    async unlockAchievement(userId: string, achievementKey: string): Promise<boolean> {
        try {
            // Get achievement
            const { data: achievement, error: achError } = await supabase
                .from('achievements')
                .select('*')
                .eq('key', achievementKey)
                .single();

            if (achError || !achievement) {
                console.error('Achievement not found:', achievementKey);
                return false;
            }

            // Check if already unlocked
            const { data: existing } = await supabase
                .from('user_achievements')
                .select('*')
                .eq('user_id', userId)
                .eq('achievement_id', achievement.id)
                .single();

            if (existing) {
                return true; // Already unlocked
            }

            // Unlock achievement
            const { error: unlockError } = await supabase
                .from('user_achievements')
                .insert([{
                    user_id: userId,
                    achievement_id: achievement.id
                }]);

            if (unlockError) {
                console.error('Error unlocking achievement:', unlockError);
                return false;
            }

            // Award XP
            if (achievement.xp_reward > 0) {
                await this.awardXP(userId, achievement.xp_reward, 'achievement_unlocked', achievement.id);
            }

            return true;
        } catch (error) {
            console.error('Error in unlockAchievement:', error);
            return false;
        }
    }

    /**
     * Get user's unlocked achievements
     */
    async getUserAchievements(userId: string): Promise<UserAchievement[]> {
        const { data, error } = await supabase
            .from('user_achievements')
            .select('*, achievement:achievements(*)')
            .eq('user_id', userId)
            .order('unlocked_at', { ascending: false });

        if (error) {
            console.error('Error fetching achievements:', error);
            return [];
        }

        return data as any;
    }

    /**
     * Get all achievements
     */
    async getAllAchievements(): Promise<Achievement[]> {
        const { data, error } = await supabase
            .from('achievements')
            .select('*')
            .order('category, xp_reward');

        if (error) {
            console.error('Error fetching all achievements:', error);
            return [];
        }

        return data;
    }

    /**
     * Check and unlock streak-based achievements
     */
    private async checkStreakAchievements(userId: string, streak: number): Promise<void> {
        if (streak >= 3) await this.unlockAchievement(userId, 'study_streak_3');
        if (streak >= 7) await this.unlockAchievement(userId, 'study_streak_7');
        if (streak >= 30) await this.unlockAchievement(userId, 'study_streak_30');
    }

    /**
     * Check level-up achievements (can be extended)
     */
    private async checkLevelUpAchievements(userId: string, newLevel: number): Promise<void> {
        // Can add level-based achievements here
        // e.g., "Reached Level 10", "Reached Level 50", etc.
    }
}

export const xpService = new XPService();
