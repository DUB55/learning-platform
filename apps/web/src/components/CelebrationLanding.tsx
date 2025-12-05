'use client';

import { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { Sparkles, PartyPopper, Rocket } from 'lucide-react';

interface CelebrationLandingProps {
    onComplete: () => void;
}

export default function CelebrationLanding({ onComplete }: CelebrationLandingProps) {
    const [countdown, setCountdown] = useState<number | string>('Are you ready?');
    const [showConfetti, setShowConfetti] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        // Set window size for confetti
        setWindowSize({
            width: window.innerWidth,
            height: window.innerHeight
        });

        // Countdown sequence
        const timers: NodeJS.Timeout[] = [];

        // "Are you ready?" for 1.5 seconds
        timers.push(setTimeout(() => setCountdown(3), 1500));
        timers.push(setTimeout(() => setCountdown(2), 2500));
        timers.push(setTimeout(() => setCountdown(1), 3500));

        // Start celebration at 0
        timers.push(setTimeout(() => {
            setCountdown('🎉');
            setShowConfetti(true);
            setShowCelebration(true);
        }, 4500));

        // End celebration and call onComplete
        timers.push(setTimeout(() => {
            setShowConfetti(false);
            onComplete();
        }, 9500));

        return () => {
            timers.forEach(timer => clearTimeout(timer));
        };
    }, [onComplete]);

    return (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center overflow-hidden">
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-pulse" />

            {/* Confetti */}
            {showConfetti && (
                <Confetti
                    width={windowSize.width}
                    height={windowSize.height}
                    recycle={true}
                    numberOfPieces={500}
                    gravity={0.3}
                />
            )}

            {/* Floating balloons */}
            {showCelebration && (
                <>
                    {[...Array(15)].map((_, i) => (
                        <div
                            key={i}
                            className="balloon"
                            style={{
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${3 + Math.random() * 3}s`
                            }}
                        >
                            {i % 3 === 0 ? '🎈' : i % 3 === 1 ? '🎉' : '🎊'}
                        </div>
                    ))}
                </>
            )}

            {/* Main content */}
            <div className="relative z-10 text-center space-y-8">
                {!showCelebration ? (
                    // Countdown phase
                    <div className="space-y-6">
                        <div className="text-6xl md:text-8xl font-bold text-white animate-bounce-slow">
                            {countdown}
                        </div>
                    </div>
                ) : (
                    // Celebration phase
                    <div className="space-y-8 animate-slide-up">
                        <div className="flex justify-center gap-4 text-6xl animate-bounce">
                            <PartyPopper className="w-16 h-16 text-yellow-400" />
                            <Sparkles className="w-16 h-16 text-pink-400" />
                            <Rocket className="w-16 h-16 text-blue-400" />
                        </div>

                        <div className="space-y-4">
                            <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 animate-gradient">
                                IT'S FINALLY HERE! 🎉
                            </h1>
                            <p className="text-2xl md:text-4xl font-bold text-white">
                                The Learning Platform is COMPLETE!
                            </p>
                        </div>

                        <div className="max-w-2xl mx-auto space-y-4 px-4">
                            <div className="glass-card p-6 animate-fade-in-up animation-delay-200">
                                <p className="text-xl text-slate-200">
                                    🚀 <strong>All features built</strong> - From AI assistance to announcements
                                </p>
                            </div>
                            <div className="glass-card p-6 animate-fade-in-up animation-delay-400">
                                <p className="text-xl text-slate-200">
                                    ✨ <strong>TypeScript errors defeated</strong> - Zero compilation errors!
                                </p>
                            </div>
                            <div className="glass-card p-6 animate-fade-in-up animation-delay-600">
                                <p className="text-xl text-slate-200">
                                    🎯 <strong>Deployed on Vercel</strong> - Live and ready to go!
                                </p>
                            </div>
                        </div>

                        <div className="text-lg text-slate-300 animate-fade-in animation-delay-800">
                            <p>Welcome to your amazing learning platform! 🎓</p>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes float-up {
                    0% {
                        transform: translateY(100vh) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(-100vh) rotate(360deg);
                        opacity: 0;
                    }
                }

                @keyframes bounce-slow {
                    0%, 100% {
                        transform: translateY(0) scale(1);
                    }
                    50% {
                        transform: translateY(-30px) scale(1.1);
                    }
                }

                @keyframes slide-up {
                    from {
                        opacity: 0;
                        transform: translateY(50px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes fade-in-up {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes fade-in {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes gradient {
                    0%, 100% {
                        background-position: 0% 50%;
                    }
                    50% {
                        background-position: 100% 50%;
                    }
                }

                .balloon {
                    position: absolute;
                    font-size: 3rem;
                    animation: float-up linear infinite;
                    pointer-events: none;
                }

                .animate-bounce-slow {
                    animation: bounce-slow 2s ease-in-out infinite;
                }

                .animate-slide-up {
                    animation: slide-up 0.8s ease-out;
                }

                .animate-fade-in-up {
                    animation: fade-in-up 0.6s ease-out;
                }

                .animate-fade-in {
                    animation: fade-in 0.8s ease-out;
                }

                .animate-gradient {
                    background-size: 200% 200%;
                    animation: gradient 3s ease infinite;
                }

                .animation-delay-200 {
                    animation-delay: 0.2s;
                    opacity: 0;
                    animation-fill-mode: forwards;
                }

                .animation-delay-400 {
                    animation-delay: 0.4s;
                    opacity: 0;
                    animation-fill-mode: forwards;
                }

                .animation-delay-600 {
                    animation-delay: 0.6s;
                    opacity: 0;
                    animation-fill-mode: forwards;
                }

                .animation-delay-800 {
                    animation-delay: 0.8s;
                    opacity: 0;
                    animation-fill-mode: forwards;
                }
            `}</style>
        </div>
    );
}
