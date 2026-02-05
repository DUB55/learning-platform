'use client';

import { useState, useRef, useEffect, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
    Text, 
    Box, 
    Sky, 
    Stars,
    PointerLockControls,
    Sphere
} from '@react-three/drei';
import * as THREE from 'three';
import { Brain, Sparkles, Trophy, Play, Search, FolderOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import ErrorLogger from '@/lib/ErrorLogger';
import { apiFetch } from '@/lib/api';
import ResourceExplorerModal from '@/components/modals/ResourceExplorerModal';

// --- Types ---
interface Question {
    question: string;
    options: string[];
    correctAnswer: string;
}

interface StudySet {
    id: string;
    title: string;
}

interface StudyCityGameProps {
    onExit: () => void;
    terms?: any[];
    focusMode?: boolean;
}

// --- 3D Components ---

// Player/Camera Controller for "Roblox-style" movement
function Player() {
    const { camera } = useThree();
    const velocity = useRef(new THREE.Vector3());
    const direction = useRef(new THREE.Vector3());
    const moveState = useRef({ forward: false, backward: false, left: false, right: false, up: false, down: false });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.code) {
                case 'KeyW': moveState.current.forward = true; break;
                case 'KeyS': moveState.current.backward = true; break;
                case 'KeyA': moveState.current.left = true; break;
                case 'KeyD': moveState.current.right = true; break;
                case 'Space': moveState.current.up = true; break;
                case 'ShiftLeft': moveState.current.down = true; break;
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            switch (e.code) {
                case 'KeyW': moveState.current.forward = false; break;
                case 'KeyS': moveState.current.backward = false; break;
                case 'KeyA': moveState.current.left = false; break;
                case 'KeyD': moveState.current.right = false; break;
                case 'Space': moveState.current.up = false; break;
                case 'ShiftLeft': moveState.current.down = false; break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    useFrame((state, delta) => {
        // Smooth deceleration
        velocity.current.x -= velocity.current.x * 10.0 * delta;
        velocity.current.z -= velocity.current.z * 10.0 * delta;
        velocity.current.y -= velocity.current.y * 10.0 * delta;

        direction.current.z = Number(moveState.current.forward) - Number(moveState.current.backward);
        direction.current.x = Number(moveState.current.right) - Number(moveState.current.left);
        direction.current.y = Number(moveState.current.up) - Number(moveState.current.down);
        direction.current.normalize();

        const speed = 120.0; // Slightly faster movement
        if (moveState.current.forward || moveState.current.backward) velocity.current.z += direction.current.z * speed * delta;
        if (moveState.current.left || moveState.current.right) velocity.current.x -= direction.current.x * speed * delta;
        if (moveState.current.up || moveState.current.down) velocity.current.y += direction.current.y * speed * delta;

        camera.translateX(velocity.current.x * delta);
        camera.translateZ(velocity.current.z * delta);
        camera.position.y += velocity.current.y * delta;
        
        // Keep within bounds
        const bounds = 150;
        const heightBounds = [1.7, 50]; // Min height 1.7 (eye level), Max 50 (flying)
        
        if (camera.position.x > bounds) camera.position.x = bounds;
        if (camera.position.x < -bounds) camera.position.x = -bounds;
        if (camera.position.z > bounds) camera.position.z = bounds;
        if (camera.position.z < -bounds) camera.position.z = -bounds;
        if (camera.position.y < heightBounds[0]) camera.position.y = heightBounds[0];
        if (camera.position.y > heightBounds[1]) camera.position.y = heightBounds[1];
    });

    return null;
}

function VirtualLab({ position, onEnter }: { position: [number, number, number], onEnter: () => void }) {
    const [hovered, setHovered] = useState(false);
    const ringRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (ringRef.current) {
            ringRef.current.rotation.y += 0.01;
            ringRef.current.rotation.z += 0.005;
        }
    });
    
    return (
        <group position={position}>
            {/* Lab Building - Futuristic Glass/Metal Design */}
            <Box args={[12, 10, 12]} onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}>
                <meshStandardMaterial 
                    color="#3b82f6" 
                    transparent 
                    opacity={0.4} 
                    metalness={0.9} 
                    roughness={0.1}
                    emissive="#3b82f6"
                    emissiveIntensity={hovered ? 0.5 : 0.2}
                />
            </Box>
            
            {/* Lab Core */}
            <Sphere args={[2, 32, 32]} position={[0, 0, 0]}>
                <meshStandardMaterial color="#60a5fa" emissive="#60a5fa" emissiveIntensity={2} />
                <pointLight intensity={2} distance={20} color="#3b82f6" />
            </Sphere>

            {/* Floating Rotating Rings */}
            <group ref={ringRef}>
                {[0, 1, 2].map((i) => (
                    <mesh key={i} rotation={[Math.PI / (i + 1), i, 0]}>
                        <torusGeometry args={[4 + i, 0.05, 16, 100]} />
                        <meshStandardMaterial color="#93c5fd" emissive="#93c5fd" emissiveIntensity={1} />
                    </mesh>
                ))}
            </group>

            {/* Holographic Label */}
            <Text
                position={[0, 8, 0]}
                fontSize={1.5}
                color="white"
                font="/fonts/Inter-Bold.woff"
                anchorX="center"
            >
                VIRTUAL SCIENCE LAB
            </Text>
            <Text
                position={[0, 6.5, 0]}
                fontSize={0.5}
                color="#60a5fa"
                anchorX="center"
            >
                {hovered ? "CLICK BLUE PAD TO ENTER" : "RESEARCH FACILITY"}
            </Text>

            {/* Interaction Trigger Pad */}
            <Box 
                args={[6, 0.2, 6]} 
                position={[0, -4.9, 10]} 
                onClick={onEnter}
                onPointerEnter={() => setHovered(true)}
                onPointerLeave={() => setHovered(false)}
            >
                <meshStandardMaterial color="#1e40af" emissive="#3b82f6" emissiveIntensity={hovered ? 2 : 0.5} />
                <Text position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.4} color="white" font="/fonts/Inter-Bold.woff">
                    ACCESS LAB
                </Text>
            </Box>
        </group>
    );
}

function Building({ position, id, onEnter, label }: { position: [number, number, number], id: number, onEnter: (id: number) => void, label: string }) {
    const [hovered, setHovered] = useState(false);
    const color = useMemo(() => new THREE.Color().setHSL(Math.random(), 0.7, 0.5), []);

    return (
        <group position={position}>
            {/* Building Body */}
            <Box args={[4, 8, 4]} onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}>
                <meshStandardMaterial color={hovered ? '#ffffff' : color} metalness={0.5} roughness={0.2} />
            </Box>
            
            {/* Doorway / Entry Trigger */}
            <Box 
                args={[1.5, 2.5, 0.5]} 
                position={[0, -2.7, 2.1]} 
                onClick={() => onEnter(id)}
            >
                <meshStandardMaterial color="#222" emissive={hovered ? "#444" : "#000"} />
            </Box>

            {/* Label */}
            <Text
                position={[0, 4.5, 0]}
                fontSize={0.5}
                color="white"
                anchorX="center"
                anchorY="middle"
            >
                {label}
            </Text>
        </group>
    );
}

function City({ onEnterBuilding, onEnterLab }: { onEnterBuilding: (id: number) => void, onEnterLab: () => void }) {
    // Generate a grid of buildings
    const buildings = useMemo(() => {
        const b = [];
        for (let x = -5; x <= 5; x++) {
            for (let z = -5; z <= 5; z++) {
                if (x === 0 && z === 0) continue; // Start point
                if (x === 2 && z === 2) continue; // Reserved for Virtual Lab
                b.push({
                    id: x * 100 + z,
                    position: [x * 15, 4, z * 15] as [number, number, number],
                    label: `Building ${b.length + 1}`
                });
            }
        }
        return b;
    }, []);

    return (
        <group>
            <Sky distance={450000} sunPosition={[0, 1, 0]} inclination={0} azimuth={0.25} />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            
            {/* Ground */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[500, 500]} />
                <meshStandardMaterial color="#1a1a1a" />
            </mesh>

            {/* Grid Helper */}
            <gridHelper args={[500, 50, "#333", "#222"]} position={[0, 0.01, 0]} />

            {/* Virtual Science Lab */}
            <VirtualLab position={[30, 5, 30]} onEnter={onEnterLab} />

            {buildings.map(b => (
                <Building key={b.id} {...b} onEnter={onEnterBuilding} />
            ))}
        </group>
    );
}

// --- Main Component ---
export default function StudyCityGame({ onExit, terms, focusMode }: StudyCityGameProps) {
    const { updateXP } = useAuth();
    const [gameState, setGameState] = useState<'setup' | 'processing' | 'loading' | 'exploring' | 'question' | 'victory' | 'gameover' | 'lab'>('setup');
    const [subject, setSubject] = useState('');
    const [material, setMaterial] = useState('');
    const [studySets, setStudySets] = useState<StudySet[]>([]);
    const [selectedSetId, setSelectedSetId] = useState<string>('');
    const [selectedSetName, setSelectedSetName] = useState<string>('');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [score, setScore] = useState(0);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [labExperiment, setLabExperiment] = useState<any>(null);
    const [isExplorerOpen, setIsExplorerOpen] = useState(false);
    const [aiProcessingStatus, setAiProcessingStatus] = useState('');

    useEffect(() => {
        const fetchSets = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data, error } = await supabase
                    .from('leersets')
                    .select('id, title')
                    .eq('created_by', user.id)
                    .limit(5); // Just show a few as shortcuts
                if (data) setStudySets(data);
            }
        };
        fetchSets();
    }, []);

    const handleSelectResource = (resource: any) => {
        setSelectedSetId(resource.id);
        setSelectedSetName(resource.title);
        setSubject(''); // Clear manual subject
    };

    const handleStart = async () => {
        if (!subject.trim() && !selectedSetId) return;
        
        setGameState('processing');
        setAiProcessingStatus('Analyzing study material...');
        
        try {
            let payload: any = { subject, material };
            
            // If a study set is selected, we fetch its content first
            if (selectedSetId) {
                setAiProcessingStatus('Fetching learning set data...');
                const { data: items } = await supabase
                    .from('leerset_items')
                    .select('term, definition')
                    .eq('leerset_id', selectedSetId);
                
                if (items && items.length > 0) {
                    const setContent = items.map((i: any) => `${i.term}: ${i.definition}`).join('\n');
                    const selectedSetTitle = selectedSetName || studySets.find(s => s.id === selectedSetId)?.title;
                    payload.subject = selectedSetTitle || subject;
                    payload.material = `Use these flashcards as the primary source: \n${setContent}`;
                } else {
                    throw new Error('No terms available for this set.');
                }
            }

            setAiProcessingStatus('AI is generating your 3D study world...');
            
            const data = await apiFetch('/api/generate-game-plan', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            
            if (data.success && data.questions.length > 0) {
                setAiProcessingStatus('World generation complete! Preparing environment...');
                setQuestions(data.questions);
                
                // Small delay to show completion
                setTimeout(() => {
                    setGameState('exploring');
                    setScore(0);
                }, 1000);
            } else {
                throw new Error(data.error || 'No questions generated');
            }
        } catch (err: any) {
            ErrorLogger.error('Error starting StudyCity3D', err);
            setAiProcessingStatus(`Error: ${err.message || 'Something went wrong'}. Using fallback content.`);
            
            // Fallback
            setQuestions([
                { question: "Sample: What is 2+2?", options: ["3", "4", "5"], correctAnswer: "4" },
                { question: "Sample: Capital of France?", options: ["London", "Paris", "Berlin"], correctAnswer: "Paris" }
            ]);
            
            setTimeout(() => {
                setGameState('exploring');
            }, 2000);
        }
    };

    const enterBuilding = (id: number) => {
        if (gameState !== 'exploring') return;
        const randomQ = questions[Math.floor(Math.random() * questions.length)];
        setCurrentQuestion(randomQ);
        setGameState('question');
        setFeedback(null);
    };

    const enterLab = async () => {
        if (gameState !== 'exploring') return;
        setGameState('loading');
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.origin : '');
            const res = await fetch(`${apiUrl}/api/generate-lab-experiment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject, material }),
            });
            const data = await res.json();
            if (data.success) {
                setLabExperiment(data.experiment);
                setGameState('lab');
            } else {
                throw new Error('Failed to generate experiment');
            }
        } catch (err) {
            ErrorLogger.error('Error entering lab', err);
            // Fallback experiment
            setLabExperiment({
                title: "The Mystery of Gravity",
                description: "Observe how different masses fall in a vacuum.",
                steps: ["Drop the lead ball", "Drop the feather", "Compare times"],
                reward: 250
            });
            setGameState('lab');
        }
    };

    const handleAnswer = (option: string) => {
        if (!currentQuestion || feedback) return;
        
        const isCorrect = option === currentQuestion.correctAnswer;
        if (isCorrect) {
            setFeedback('correct');
            setScore(s => s + 100);
            updateXP(100, 'Solved a building challenge in Study City 3D'); // Award 100 XP per correct building
            setTimeout(() => {
                setGameState('exploring');
                setFeedback(null);
                setCurrentQuestion(null);
            }, 1500);
        } else {
            setFeedback('wrong');
            setTimeout(() => {
                setGameState('gameover');
            }, 1500);
        }
    };

    const completeLab = () => {
        setScore(s => s + (labExperiment?.reward || 250));
        updateXP(labExperiment?.reward || 250, `Completed Virtual Lab: ${labExperiment?.title}`);
        setGameState('exploring');
        setLabExperiment(null);
    };

    if (gameState === 'setup') {
        return (
            <div className="w-full max-w-2xl p-8 space-y-8 animate-in fade-in zoom-in duration-500 glass-card">
                <div className="text-center space-y-2">
                    <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                        <Play className="w-10 h-10 text-blue-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-white uppercase tracking-tight italic">3D Study City</h2>
                    <p className="text-slate-400">Explore the city, enter buildings, and master your knowledge.</p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Select Learning Set</label>
                        <select 
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            value={selectedSetId}
                            onChange={(e) => {
                                setSelectedSetId(e.target.value);
                                if (e.target.value) setSubject(''); // Clear manual subject if set is selected
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

                    <div className="relative py-4 flex items-center gap-4">
                        <div className="flex-1 h-px bg-white/10"></div>
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">OR</span>
                        <div className="flex-1 h-px bg-white/10"></div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Subject or Topic</label>
                        <input 
                            type="text" 
                            placeholder="e.g. World Geography, Python Programming..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            value={subject}
                            onChange={(e) => {
                                setSubject(e.target.value);
                                if (e.target.value) setSelectedSetId(''); // Clear set selection if manual topic is entered
                            }}
                        />
                    </div>
                    <button 
                        onClick={handleStart}
                        disabled={!subject.trim() && !selectedSetId}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-lg"
                    >
                        <Sparkles className="w-5 h-5" /> Initialize City
                    </button>
                </div>
                
                <div className="text-center text-xs text-slate-500">
                    WASD to Move • MOUSE to Look • CLICK Doors to Enter
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
                <h3 className="text-xl font-bold text-white">Generating 3D Study Environment...</h3>
            </div>
        );
    }

    return (
        <div className="w-full h-full relative">
            {/* UI Overlay */}
            <div className="absolute top-8 left-8 z-50 flex gap-4">
                <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white font-bold flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-400" /> {score} XP
                </div>
                <button 
                    onClick={onExit}
                    className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white font-bold hover:bg-red-500/20 transition-colors"
                >
                    Exit
                </button>
            </div>

            {/* Instruction Overlay */}
            {gameState === 'exploring' && (
                <div className="absolute inset-x-0 bottom-8 z-50 flex flex-col items-center gap-4 pointer-events-none">
                    <div className="bg-black/40 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/5 text-slate-300 text-sm font-medium animate-bounce pointer-events-auto">
                        Find a building or the <span className="text-blue-400 font-bold">Virtual Lab</span> to start!
                    </div>
                    
                    {/* HUD Controls */}
                    <div className="flex items-center gap-3 pointer-events-auto">
                        <div className="glass-card px-4 py-2 rounded-xl border border-white/10 flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <kbd className="bg-white/10 px-2 py-1 rounded text-[10px] text-white">WASD</kbd>
                                <span className="text-[10px] text-slate-400 uppercase font-bold">Move</span>
                            </div>
                            <div className="w-px h-4 bg-white/10" />
                            <div className="flex items-center gap-2">
                                <kbd className="bg-white/10 px-2 py-1 rounded text-[10px] text-white">SPACE</kbd>
                                <span className="text-[10px] text-slate-400 uppercase font-bold">Fly Up</span>
                            </div>
                            <div className="w-px h-4 bg-white/10" />
                            <div className="flex items-center gap-2">
                                <kbd className="bg-white/10 px-2 py-1 rounded text-[10px] text-white">SHIFT</kbd>
                                <span className="text-[10px] text-slate-400 uppercase font-bold">Fly Down</span>
                            </div>
                        </div>
                        
                        <button 
                            onClick={enterLab}
                            className="bg-blue-600/80 hover:bg-blue-500 backdrop-blur-sm p-3 rounded-xl border border-blue-400/30 text-white shadow-lg transition-all hover:scale-110 active:scale-95 group"
                            title="Teleport to Lab"
                        >
                            <Brain className="w-5 h-5 group-hover:animate-pulse" />
                        </button>
                    </div>
                </div>
            )}

            {/* Question Modal */}
            {gameState === 'question' && currentQuestion && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
                        <h3 className="text-2xl font-bold text-white mb-8 text-center">{currentQuestion.question}</h3>
                        <div className="grid gap-4">
                            {currentQuestion.options.map((opt, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleAnswer(opt)}
                                    disabled={!!feedback}
                                    className={`w-full p-4 rounded-2xl font-bold text-left transition-all border-2 ${
                                        feedback === 'correct' && opt === currentQuestion.correctAnswer
                                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                            : feedback === 'wrong' && opt !== currentQuestion.correctAnswer
                                            ? 'bg-red-500/20 border-red-500 text-red-400'
                                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
                                    }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                        {feedback === 'correct' && (
                            <div className="mt-6 text-center text-emerald-500 font-bold animate-bounce">
                                Correct! +100 XP
                            </div>
                        )}
                        {feedback === 'wrong' && (
                            <div className="mt-6 text-center text-red-500 font-bold animate-shake">
                                Incorrect! Try another building.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Virtual Lab Modal */}
            {gameState === 'lab' && labExperiment && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
                    <div className="w-full max-w-2xl bg-slate-900/90 border border-blue-500/30 rounded-[2.5rem] p-10 shadow-[0_0_50px_rgba(59,130,246,0.2)] animate-in fade-in zoom-in duration-500 overflow-hidden relative">
                        {/* Futuristic Background Element */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"></div>

                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">
                                        {labExperiment.title}
                                    </h3>
                                    <p className="text-blue-400 font-bold text-sm tracking-widest uppercase">Virtual Science Lab</p>
                                </div>
                                <div className="bg-blue-500/20 px-4 py-2 rounded-2xl border border-blue-500/30 text-blue-300 font-bold">
                                    +{labExperiment.reward} XP
                                </div>
                            </div>

                            <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
                                <p className="text-slate-300 text-lg leading-relaxed">
                                    {labExperiment.description}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Experiment Steps</h4>
                                <div className="grid gap-3">
                                    {labExperiment.steps.map((step: string, i: number) => (
                                        <div key={i} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-colors group">
                                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm group-hover:bg-blue-500 group-hover:text-white transition-all">
                                                {i + 1}
                                            </div>
                                            <span className="text-slate-200 font-medium">{step}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={completeLab}
                                className="w-full py-5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black rounded-2xl shadow-[0_10px_20px_rgba(37,99,235,0.3)] transition-all transform hover:-translate-y-1 active:scale-95 uppercase tracking-widest flex items-center justify-center gap-3"
                            >
                                <Sparkles className="w-6 h-6" /> Complete Experiment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 3D Scene */}
            <div id="city-canvas-container" className="w-full h-full bg-black cursor-crosshair">
                <Canvas shadows camera={{ position: [0, 2, 10], fov: 75 }}>
                    <Suspense fallback={null}>
                        <City onEnterBuilding={enterBuilding} onEnterLab={enterLab} />
                        <Player />
                        {gameState === 'exploring' && <PointerLockControls selector="#city-canvas-container" />}
                    </Suspense>
                </Canvas>
            </div>
        </div>
    );
}
