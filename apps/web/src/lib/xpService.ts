import { supabase } from './supabase';
import ErrorLogger from './ErrorLogger';

export interface UserXP {
    id: string;
    user_id: string;
    total_xp: number;
    level: number;
    current_streak: number;
    longest_streak: number;
    last_activity_date: string | null;
    study_minutes: number;
    tasks_completed: number;
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
    async getUserXP(userId: string, signal?: AbortSignal): Promise<UserXP | null> {
        const { data, error } = await supabase
            .from('user_xp')
            .select('*')
            .eq('user_id', userId)
            .abortSignal(signal!)
            .single();

        if (error && error.code === 'PGRST116') {
            // Record doesn't exist, create it
            const { data: newData, error: insertError } = await supabase
                .from('user_xp')
                .insert([{ user_id: userId }])
                .select()
                .abortSignal(signal!)
                .single();

            if (insertError) {
                if (insertError.name === 'AbortError') return null;
                ErrorLogger.error('Error creating user XP:', insertError);
                return null;
            }
            return newData as UserXP;
        }

        if (error) {
            if (error.name === 'AbortError') return null;
            ErrorLogger.error('Error fetching user XP:', error);
            return null;
        }

        return data as UserXP;
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
                ErrorLogger.error('Error updating XP', updateError);
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
                ErrorLogger.error('Error recording XP transaction', transactionError);
            }

            // Check for level-up achievements
            if (newLevel > currentXP.level) {
                await this.checkLevelUpAchievements(userId);
            }

            return true;
        } catch (error) {
            ErrorLogger.error('Error in awardXP', error);
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
                ErrorLogger.error('Error inserting streak', insertError);
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
                    ErrorLogger.error('Error updating streak:', updateError);
                }

                // Check streak achievements
                await this.checkStreakAchievements(userId, streak);
            }

            return true;
        } catch (error) {
            ErrorLogger.error('Error in updateStreak', error);
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
        const expectedDate = new Date();
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
                ErrorLogger.error('Achievement not found:', achievementKey);
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
                ErrorLogger.error('Error unlocking achievement', unlockError);
                return false;
            }

            // Award XP
            if (achievement.xp_reward > 0) {
                await this.awardXP(userId, achievement.xp_reward, 'achievement_unlocked', achievement.id);
            }

            return true;
        } catch (error) {
            ErrorLogger.error('Error in unlockAchievement', error);
            return false;
        }
    }

    /**
     * Get user's unlocked achievements
     */
    async getUserAchievements(userId: string, signal?: AbortSignal): Promise<UserAchievement[]> {
        const { data, error } = await supabase
            .from('user_achievements')
            .select('*, achievement:achievements(*)')
            .eq('user_id', userId)
            .order('unlocked_at', { ascending: false })
            .abortSignal(signal!);

        if (error) {
            if (error.name === 'AbortError') return [];
            ErrorLogger.error('Error fetching achievements', error);
            return [];
        }

        return data as unknown as UserAchievement[];
    }

    /**
     * Get all achievements
     */
    async getAllAchievements(signal?: AbortSignal): Promise<Achievement[]> {
        const { data, error } = await (supabase
            .from('achievements') as any)
            .select('*')
            .order('category, xp_reward')
            .abortSignal(signal as any);

        if (error) {
            if (error.name === 'AbortError') return [];
            ErrorLogger.error('Error fetching all achievements:', error);
            return [];
        }

        if (!data || data.length === 0) {
            // Seed default achievements if none exist
            await this.seedAchievements();
            return this.getAllAchievements(signal);
        }

        return data;
    }

    /**
     * Seed default achievements
     */
    private async seedAchievements(): Promise<void> {
        const defaultAchievements = [
            {
                key: 'study_time_1h',
                name: 'Focused Hour',
                description: 'Study for a total of 1 hour.',
                icon: 'Timer',
                xp_reward: 100,
                category: 'Study Time',
                requirement_type: 'study_minutes',
                requirement_value: 60
            },
            {
                key: 'study_time_10h',
                name: 'Study Marathon',
                description: 'Study for a total of 10 hours.',
                icon: 'Clock',
                xp_reward: 500,
                category: 'Study Time',
                requirement_type: 'study_minutes',
                requirement_value: 600
            },
            {
                key: 'task_first',
                name: 'Getting Started',
                description: 'Complete your first task.',
                icon: 'CheckCircle',
                xp_reward: 50,
                category: 'Tasks',
                requirement_type: 'tasks_completed',
                requirement_value: 1
            },
            {
                key: 'task_50',
                name: 'Task Master',
                description: 'Complete 50 tasks.',
                icon: 'CheckSquare',
                xp_reward: 1000,
                category: 'Tasks',
                requirement_type: 'tasks_completed',
                requirement_value: 50
            },
            {
                key: 'study_streak_7',
                name: 'Week on Fire',
                description: 'Maintain a 7-day study streak.',
                icon: 'Zap',
                xp_reward: 300,
                category: 'Streaks',
                requirement_type: 'streak',
                requirement_value: 7
            },
            {
                key: 'study_streak_30',
                name: 'Unstoppable',
                description: 'Maintain a 30-day study streak.',
                icon: 'Flame',
                xp_reward: 2000,
                category: 'Streaks',
                requirement_type: 'streak',
                requirement_value: 30
            }
        ];

        const { error } = await supabase
            .from('achievements')
            .insert(defaultAchievements);

        if (error) {
            ErrorLogger.error('Error seeding achievements:', error);
        }
    }

    /**
     * Check study time achievements
     */
    async checkStudyTimeAchievements(userId: string): Promise<void> {
        const xp = await this.getUserXP(userId);
        if (!xp) return;

        const minutes = xp.study_minutes || 0;
        // Try to unlock various milestones (will fail silently if achievement doesn't exist)
        if (minutes >= 60) await this.unlockAchievement(userId, 'study_time_1h');
        if (minutes >= 300) await this.unlockAchievement(userId, 'study_time_5h'); // 5 hours
        if (minutes >= 600) await this.unlockAchievement(userId, 'study_time_10h'); // 10 hours
        if (minutes >= 1440) await this.unlockAchievement(userId, 'study_time_24h'); // 24 hours
        if (minutes >= 6000) await this.unlockAchievement(userId, 'study_time_100h'); // 100 hours
    }

    /**
     * Check task completion achievements
     */
    async checkTaskAchievements(userId: string): Promise<void> {
        const xp = await this.getUserXP(userId);
        if (!xp) return;

        const tasks = xp.tasks_completed || 0;
        if (tasks >= 1) await this.unlockAchievement(userId, 'task_first');
        if (tasks >= 10) await this.unlockAchievement(userId, 'task_10');
        if (tasks >= 50) await this.unlockAchievement(userId, 'task_50');
        if (tasks >= 100) await this.unlockAchievement(userId, 'task_100');
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
    private async checkLevelUpAchievements(userId: string): Promise<void> {
        // Can add level-based achievements here
        // e.g., "Reached Level 10", "Reached Level 50", etc.
    }
}

export const xpService = new XPService();
