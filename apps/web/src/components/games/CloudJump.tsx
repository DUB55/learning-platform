'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Environment, Float, Text, RoundedBox, Sphere, Cloud as ThreeCloud, Sky, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { Cloud, RotateCcw, Home, Sparkles, Brain, XCircle, ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import ErrorLogger from '@/lib/ErrorLogger';
import { apiFetch } from '@/lib/api';

// --- 3D Components ---

function Player3D({ isJumping, jumpResult }: { isJumping: boolean, jumpResult: 'correct' | 'wrong' | null }) {
    const meshRef = useRef<THREE.Group>(null);
    
    useFrame((state) => {
        if (!meshRef.current) return;
        
        // Idle animation
        if (!isJumping && !jumpResult) {
            meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
            meshRef.current.rotation.y += 0.01;
        }

        // Jump animation
        if (isJumping) {
            meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, 4, 0.1);
            meshRef.current.rotation.x += 0.2;
        } else if (jumpResult === 'wrong') {
            meshRef.current.position.y -= 0.5;
            meshRef.current.rotation.z += 0.1;
        } else {
            meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, 0, 0.1);
            meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, 0, 0.1);
        }
    });

    return (
        <group ref={meshRef}>
            {/* Simple 3D Character (Robot/Bot style) */}
            <RoundedBox args={[1, 1, 1]} radius={0.2} smoothness={4}>
                <meshStandardMaterial color="#3b82f6" metalness={0.8} roughness={0.2} />
            </RoundedBox>
            <Sphere args={[0.2, 16, 16]} position={[0.3, 0.2, 0.5]}>
                <meshStandardMaterial color="white" emissive="white" emissiveIntensity={2} />
            </Sphere>
            <Sphere args={[0.2, 16, 16]} position={[-0.3, 0.2, 0.5]}>
                <meshStandardMaterial color="white" emissive="white" emissiveIntensity={2} />
            </Sphere>
        </group>
    );
}

function Cloud3D({ position, label, isSelected, onClick }: { position: [number, number, number], label: string, isSelected: boolean, onClick: () => void }) {
    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <group position={position} onClick={onClick}>
                <ThreeCloud 
                    opacity={isSelected ? 1 : 0.5} 
                    speed={0.4} 
                    bounds={[3, 1, 1.5]}
                    segments={20} 
                    color={isSelected ? "#ffffff" : "#cbd5e1"}
                />
                <Text
                    position={[0, 0, 1]}
                    fontSize={0.25}
                    color={isSelected ? "black" : "white"}
                    maxWidth={2}
                    textAlign="center"
                    anchorX="center"
                    anchorY="middle"
                >
                    {label}
                </Text>
            </group>
        </Float>
    );
}

// --- Main Game ---

interface Question {
    question: string;
    options: string[];
    correctAnswer: string;
}

interface StudySet {
    id: string;
    title: string;
}

interface GamePlanPayload {
    subject: string;
    material: string;
}

export default function CloudJump({ onExit, focusMode }: { onExit?: () => void, focusMode?: boolean } = {}) {
    const { updateXP } = useAuth();
    const [gameState, setGameState] = useState<'setup' | 'loading' | 'playing' | 'gameover' | 'victory'>('setup');
    const [subject, setSubject] = useState('');
    const [material, setMaterial] = useState('');
    const [studySets, setStudySets] = useState<StudySet[]>([]);
    const [selectedSetId, setSelectedSetId] = useState<string>('');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(0);
    const [score, setScore] = useState(0);
    const [isJumping, setIsJumping] = useState(false);
    const [jumpResult, setJumpResult] = useState<'correct' | 'wrong' | null>(null);

    useEffect(() => {
        const fetchSets = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('learning_sets')
                    .select('id, title')
                    .eq('user_id', user.id);
                if (data) setStudySets(data as StudySet[]);
            }
        };
        fetchSets();
    }, []);

    const handleStart = async () => {
        if (!subject.trim() && !selectedSetId) return;
        setGameState('loading');
        try {
            let payload: GamePlanPayload = { subject, material };
            
            if (selectedSetId) {
                const { data: items } = await supabase
                    .from('learning_set_terms')
                    .select('term, definition')
                    .eq('learning_set_id', selectedSetId);
                
                if (items && items.length > 0) {
                    const setContent = items.map(i => `${i.term}: ${i.definition}`).join('\n');
                    const selectedSet = studySets.find(s => s.id === selectedSetId);
                    payload.subject = selectedSet?.title || subject;
                    payload.material = `Use these flashcards as the primary source: \n${setContent}`;
                }
            }

            const data = await apiFetch('/api/generate-game-plan', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            
            if (data.success && data.questions.length > 0) {
                setQuestions(data.questions);
                setGameState('playing');
                setCurrentIndex(0);
                setScore(0);
            } else {
                throw new Error('No questions generated');
            }
        } catch (err) {
            ErrorLogger.error('Error starting CloudJump', err);
            // Fallback for demo
            setQuestions([
                {
                    question: "What is the process by which plants make their own food?",
                    options: ["Respiration", "Photosynthesis", "Transpiration"],
                    correctAnswer: "Photosynthesis"
                },
                {
                    question: "Which gas do plants absorb from the atmosphere for photosynthesis?",
                    options: ["Oxygen", "Carbon Dioxide", "Nitrogen"],
                    correctAnswer: "Carbon Dioxide"
                }
            ]);
            setGameState('playing');
        }
    };

    const handleJump = () => {
        if (isJumping) return;
        setIsJumping(true);
        const isCorrect = questions[currentIndex].options[selectedOption] === questions[currentIndex].correctAnswer;
        
        setTimeout(() => {
            if (isCorrect) {
                setJumpResult('correct');
                setScore(score + 100);
                updateXP(50); // Award 50 XP per correct answer
                setTimeout(() => {
                    if (currentIndex + 1 < questions.length) {
                        setCurrentIndex(currentIndex + 1);
                        setSelectedOption(0);
                        setJumpResult(null);
                        setIsJumping(false);
                    } else {
                        updateXP(250); // Bonus XP for finishing
                        setGameState('victory');
                    }
                }, 1000);
            } else {
                setJumpResult('wrong');
                setTimeout(() => {
                    setGameState('gameover');
                }, 1500);
            }
        }, 600);
    };

    // Keyboard controls
    useEffect(() => {
        if (gameState !== 'playing' || isJumping) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                setSelectedOption(prev => (prev > 0 ? prev - 1 : questions[currentIndex].options.length - 1));
            } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                setSelectedOption(prev => (prev < questions[currentIndex].options.length - 1 ? prev + 1 : 0));
            } else if (e.key === 'Enter') {
                handleJump();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState, isJumping, currentIndex, selectedOption, questions]);

    if (gameState === 'setup') {
        return (
            <div className="w-full max-w-2xl p-8 space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="text-center space-y-2">
                    <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                        <Cloud className="w-10 h-10 text-blue-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-white uppercase tracking-tight italic">Cloud Jump Study</h2>
                    <p className="text-slate-400">Master your subjects by jumping through the clouds.</p>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Select Learning Set</label>
                        <select 
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            value={selectedSetId}
                            onChange={(e) => {
                                setSelectedSetId(e.target.value);
                                if (e.target.value) setSubject('');
                            }}
                        >
                            <option value="" className="bg-slate-900 text-slate-400 italic">-- Choose from your library --</option>
                            {studySets.map(set => (
                                <option key={set.id} value={set.id} className="bg-slate-900 text-white">
                                    {set.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="relative py-2 flex items-center gap-4">
                        <div className="flex-1 h-px bg-white/10"></div>
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">OR</span>
                        <div className="flex-1 h-px bg-white/10"></div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Subject or Topic</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Photosynthesis, World War II, Calculus..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            value={subject}
                            onChange={(e) => {
                                setSubject(e.target.value);
                                if (e.target.value) setSelectedSetId('');
                            }}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Additional Material (Optional)</label>
                        <textarea 
                            placeholder="Paste your notes here for custom questions..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all h-32 resize-none"
                            value={material}
                            onChange={(e) => setMaterial(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={handleStart}
                        disabled={!subject.trim() && !selectedSetId}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-lg"
                    >
                        <Sparkles className="w-5 h-5" /> Start Learning
                    </button>
                </div>
            </div>
        );
    }

    if (gameState === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                    <div className="w-24 h-24 border-4 border-blue-500/20 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 w-24 h-24 border-4 border-t-blue-500 rounded-full animate-spin"></div>
                    <Brain className="absolute inset-0 m-auto w-10 h-10 text-blue-400 animate-bounce" />
                </div>
                <div className="text-center">
                    <h3 className="text-xl font-bold text-white mb-2">AI is building your game...</h3>
                    <p className="text-slate-500 font-medium">Creating custom questions for "{subject}"</p>
                </div>
            </div>
        );
    }

    if (gameState === 'playing') {
        const q = questions[currentIndex];
        return (
            <div className="w-full h-full relative overflow-hidden bg-slate-950">
                {/* 3D Scene Background */}
                <div className="absolute inset-0 z-0">
                    <Canvas shadows dpr={[1, 2]}>
                        <Suspense fallback={null}>
                            <PerspectiveCamera makeDefault position={[0, 2, 10]} />
                            <Sky distance={450000} sunPosition={[0, 1, 0]} inclination={0} azimuth={0.25} />
                            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                            <ambientLight intensity={0.5} />
                            <pointLight position={[10, 10, 10]} intensity={1} />
                            
                            <Player3D isJumping={isJumping} jumpResult={jumpResult} />
                            
                            {/* Cloud Options */}
                            {q.options.map((opt, i) => (
                                <Cloud3D 
                                    key={i}
                                    position={[(i - 1) * 5, -2, 0]} 
                                    label={opt}
                                    isSelected={selectedOption === i}
                                    onClick={() => { setSelectedOption(i); handleJump(); }}
                                />
                            ))}
                            
                            <Environment preset="night" />
                        </Suspense>
                    </Canvas>
                </div>

                {/* UI Overlay */}
                <div className="relative z-10 w-full h-full flex flex-col items-center justify-between p-8 pointer-events-none">
                    {/* Header Info */}
                    <div className="w-full flex justify-between items-center pointer-events-auto">
                        <div className="bg-black/50 border border-white/10 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2">
                            <Brain className="w-4 h-4 text-purple-400" />
                            <span className="text-sm font-bold text-slate-300 uppercase tracking-tighter">Q: {currentIndex + 1} / {questions.length}</span>
                        </div>
                        <div className="bg-black/50 border border-white/10 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm font-bold text-white uppercase tracking-tighter">{score} XP</span>
                        </div>
                    </div>

                    {/* Question Overlay */}
                    <div className="bg-black/40 border border-white/10 backdrop-blur-md p-6 max-w-2xl w-full text-center rounded-3xl mb-48 pointer-events-auto">
                        <h3 className="text-2xl font-bold text-white leading-relaxed italic uppercase tracking-tight">{q.question}</h3>
                    </div>

                    {/* Controls Help */}
                    <div className="flex gap-6 text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] pointer-events-auto">
                        <div className="flex items-center gap-2"><div className="p-1 bg-white/10 rounded"><ChevronLeft className="w-3 h-3" /></div><div className="p-1 bg-white/10 rounded"><ChevronRight className="w-3 h-3" /></div> SELECT</div>
                        <div className="flex items-center gap-2"><div className="p-1 bg-white/10 rounded px-2 font-black">ENTER</div> JUMP</div>
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'gameover' || gameState === 'victory') {
        return (
            <div className="w-full max-w-md p-8 text-center space-y-8 animate-in fade-in zoom-in">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 border-4 ${
                    gameState === 'victory' ? 'bg-emerald-500/20 border-emerald-500' : 'bg-red-500/20 border-red-500'
                }`}>
                    {gameState === 'victory' ? <Trophy className="w-12 h-12 text-emerald-500" /> : <XCircle className="w-12 h-12 text-red-500" />}
                </div>
                
                <div>
                    <h2 className="text-4xl font-black italic mb-2 uppercase tracking-tighter">
                        {gameState === 'victory' ? 'LEVEL CLEARED!' : 'GAME OVER'}
                    </h2>
                    <p className="text-slate-400 font-medium">
                        {gameState === 'victory' ? `You mastered ${subject}!` : 'Don\'t give up! Study the material and try again.'}
                    </p>
                </div>

                <div className="bg-white/5 border border-white/10 backdrop-blur-xl p-6 flex flex-col gap-2 rounded-2xl">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total XP Earned</div>
                    <div className="text-4xl font-black text-white italic">{score} XP</div>
                </div>

                <div className="flex flex-col gap-3">
                    <button 
                        onClick={() => setGameState('setup')}
                        className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                    >
                        <RotateCcw className="w-5 h-5" /> Play Again
                    </button>
                    <button 
                        onClick={onExit}
                        className="w-full py-4 bg-white/5 text-white font-black uppercase tracking-widest rounded-xl border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                    >
                        <Home className="w-5 h-5" /> Back to Arcade
                    </button>
                </div>
            </div>
        );
    }

    return null;
}