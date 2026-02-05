-- Create dub5_tips table for random tips
CREATE TABLE IF NOT EXISTS dub5_tips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dub5_featured_tip table for admin-editable tip
CREATE TABLE IF NOT EXISTS dub5_featured_tip (
    id TEXT PRIMARY KEY DEFAULT 'global',
    header TEXT NOT NULL DEFAULT 'DUB5''s Focus Tip',
    content TEXT NOT NULL DEFAULT 'Try the Pomodoro technique: 25 minutes of focus followed by a 5-minute break. DUB5 can help you track this!',
    xp_amount INTEGER NOT NULL DEFAULT 50,
    xp_text TEXT NOT NULL DEFAULT 'XP BONUS',
    link_text TEXT NOT NULL DEFAULT 'Try it with DUB5',
    link_url TEXT NOT NULL DEFAULT '/ai-chat',
    icon_name TEXT NOT NULL DEFAULT 'Lightbulb',
    use_random BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial featured tip if not exists
INSERT INTO dub5_featured_tip (id) VALUES ('global') ON CONFLICT (id) DO NOTHING;

-- Seed some random tips
INSERT INTO dub5_tips (content) VALUES 
('Drink water regularly to keep your brain hydrated and focused.'),
('Take a 5-minute walk every hour to improve blood circulation.'),
('Use active recall: test yourself instead of just re-reading notes.'),
('Space out your study sessions over several days for better retention.'),
('Teach what you learned to someone else (or an imaginary friend).'),
('Keep your study space clean and free of distractions.'),
('Listen to lo-fi or classical music if you find silence too distracting.'),
('Prioritize your hardest tasks when your energy is highest.'),
('Use the Pomodoro technique: 25 min study, 5 min break.'),
('Write down your goals for each study session before you start.'),
('Get at least 7-8 hours of sleep for optimal memory consolidation.'),
('Eat healthy snacks like nuts or fruit during your study breaks.'),
('Review your notes within 24 hours of first writing them.'),
('Use mnemonic devices to remember complex lists or concepts.'),
('Turn off your phone or put it in another room while studying.'),
('Visualize the concepts you are learning to create mental maps.'),
('Break large projects into smaller, manageable sub-tasks.'),
('Use flashcards for quick review of key terms and definitions.'),
('Stay positive! A growth mindset helps you overcome challenges.'),
('Celebrate small wins to stay motivated throughout your journey.'),
('Try studying in different locations to improve memory association.'),
('Keep a "distraction list" to write down random thoughts for later.'),
('Use different colors in your notes to categorize information.'),
('Summarize each chapter in your own words after reading.'),
('Take deep breaths if you feel overwhelmed during a study session.'),
('Consistency is key: 20 minutes every day is better than a 5-hour marathon once a week.'),
('Use diagrams and charts to visualize relationships between ideas.'),
('Limit your caffeine intake, especially in the afternoon.'),
('Practice past exams to get familiar with the question styles.'),
('Set specific, measurable goals for each week of studying.'),
('Don''t be afraid to ask for help when you don''t understand something.'),
('Review your mistakes to understand where you went wrong.'),
('Keep a dedicated study notebook for each subject.'),
('Use a planner to schedule your study sessions and deadlines.'),
('Stay organized! Use folders to keep your digital and physical notes tidy.'),
('Find a study buddy to stay accountable and motivated.'),
('Take breaks away from screens to rest your eyes.'),
('Reward yourself after completing a particularly difficult task.'),
('Stay curious! Ask "why" and "how" to deepen your understanding.'),
('Focus on one thing at a time: multitasking is a myth.'),
('Practice mindfulness to improve your concentration and focus.'),
('Listen to your body: rest when you need it.'),
('Believe in yourself! You are capable of achieving great things.')
ON CONFLICT DO NOTHING;

-- Ensure user_xp starts at 0
ALTER TABLE user_xp ALTER COLUMN total_xp SET DEFAULT 0;
ALTER TABLE user_xp ALTER COLUMN level SET DEFAULT 1;

-- Enable realtime for dub5_featured_tip
ALTER PUBLICATION supabase_realtime ADD TABLE dub5_featured_tip;
