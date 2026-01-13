'use client';

import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, BrainCircuit } from 'lucide-react';
import QuizBuilder from '@/components/quizzes/QuizBuilder';

export default function CreateQuizPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();

    // Fallback if params aren't ready yet
    if (!params?.unitId || !params?.id) return null;

    return (
        <div className="p-8 pb-32 max-w-5xl mx-auto animate-fade-in">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Unit</span>
            </button>

            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-500">
                    <BrainCircuit className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">Create New Quiz</h1>
                    <p className="text-slate-400">Design a quiz to test knowledge for this unit.</p>
                </div>
            </div>

            {user ? (
                <QuizBuilder
                    unitId={params.unitId as string}
                    userId={user.id}
                    onCancel={() => router.back()}
                />
            ) : (
                <div className="text-center py-20">
                    <p className="text-slate-400">You must be signed in to create quizzes.</p>
                </div>
            )}
        </div>
    );
}
