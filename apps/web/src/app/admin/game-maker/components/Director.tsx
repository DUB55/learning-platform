'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';

interface OrchestrationSegment {
    startTime: number;
    endTime: number;
    narration: string;
    cameraAction: {
        type: 'move' | 'lookAt' | 'orbit' | 'follow';
        position: [number, number, number];
        target: [number, number, number] | string;
    };
    visualEvents: Array<{
        type: 'spawn' | 'animate' | 'highlight' | 'destroy' | 'speech_bubble';
        objectId: string;
        params: any;
    }>;
}

interface DirectorProps {
    orchestration: OrchestrationSegment[];
    isPlaying: boolean;
}

export function Director({ orchestration, isPlaying }: DirectorProps) {
    const { camera, scene } = useThree();
    const [currentTime, setCurrentTime] = useState(0);
    const [currentSegmentIndex, setCurrentSegmentIndex] = useState(-1);
    const [narration, setNarration] = useState('');
    
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const lastProcessedSegment = useRef(-1);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            synthRef.current = window.speechSynthesis;
        }
    }, []);

    useFrame((state, delta) => {
        if (!isPlaying) return;

        const newTime = currentTime + delta;
        setCurrentTime(newTime);

        // Find current segment
        const segmentIndex = orchestration.findIndex(s => newTime >= s.startTime && newTime <= s.endTime);
        
        if (segmentIndex !== -1 && segmentIndex !== currentSegmentIndex) {
            setCurrentSegmentIndex(segmentIndex);
            const segment = orchestration[segmentIndex];
            
            // Handle Narration
            if (segmentIndex !== lastProcessedSegment.current) {
                speak(segment.narration);
                lastProcessedSegment.current = segmentIndex;
                setNarration(segment.narration);
            }

            // Handle Camera Action
            handleCamera(segment.cameraAction, delta);
            
            // Handle Visual Events
            handleVisualEvents(segment.visualEvents);
        }
    });

    const speak = (text: string) => {
        if (!synthRef.current) return;
        synthRef.current.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'nl-NL'; // Dutch support
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        
        utteranceRef.current = utterance;
        synthRef.current.speak(utterance);
    };

    const handleCamera = (action: OrchestrationSegment['cameraAction'], delta: number) => {
        const targetPos = new THREE.Vector3(...action.position);
        camera.position.lerp(targetPos, delta * 2);

        if (typeof action.target === 'string') {
            const targetObj = scene.getObjectByName(action.target);
            if (targetObj) {
                camera.lookAt(targetObj.position);
            }
        } else if (Array.isArray(action.target)) {
            camera.lookAt(new THREE.Vector3(...action.target));
        }
    };

    const handleVisualEvents = (events: OrchestrationSegment['visualEvents']) => {
        events.forEach(event => {
            const obj = scene.getObjectByName(event.objectId);
            if (!obj) return;

            switch (event.type) {
                case 'highlight':
                    // Temporary visual feedback
                    if (obj.userData.originalColor === undefined) {
                        obj.userData.originalColor = (obj as any).material?.color?.getHex() || 0xffffff;
                    }
                    (obj as any).material?.color?.set(event.params.color || 0xffff00);
                    break;
                case 'animate':
                    // Handle animations if available
                    break;
                case 'speech_bubble':
                    // This would ideally be handled by a UI overlay or 3D text
                    break;
            }
        });
    };

    return (
        <DirectorOverlay narration={narration} isPlaying={isPlaying} />
    );
}

function DirectorOverlay({ narration, isPlaying }: { narration: string; isPlaying: boolean }) {
    return (
        <AnimatePresence>
            {isPlaying && narration && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="fixed bottom-12 left-1/2 -translate-x-1/2 w-full max-w-3xl px-6 z-[200] pointer-events-none"
                >
                    <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                        <p className="text-white text-lg font-medium text-center leading-relaxed">
                            {narration}
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
