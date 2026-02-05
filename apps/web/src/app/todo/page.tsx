'use client';

import TaskView from '@/components/tasks/TaskView';

export default function TodoPage() {

    return (
        <div className="flex-1 flex flex-col p-8 relative">
            <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
                <header className="mb-10">
                    <h1 className="text-3xl font-serif font-bold text-white mb-2">To-do List</h1>
                    <p className="text-slate-400">Stay organized and track your progress</p>
                </header>

                <TaskView />
            </div>
        </div>
    );
}
