'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { ChevronLeft, ChevronRight, Plus, Clock, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function CalendarPage() {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchTasks();
        }
    }, [user]);

    const fetchTasks = async () => {
        try {
            const { data } = await supabase
                .from('tasks')
                .select('*')
                .order('due_date', { ascending: true });

            if (data) setTasks(data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const getTasksForDate = (day: number) => {
        return tasks.filter(task => {
            if (!task.due_date) return false;
            const taskDate = new Date(task.due_date);
            return taskDate.getDate() === day &&
                taskDate.getMonth() === currentDate.getMonth() &&
                taskDate.getFullYear() === currentDate.getFullYear();
        });
    };

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <div className="min-h-screen bg-[#0f172a] flex overflow-hidden">
            <Sidebar />

            <main className="flex-1 overflow-y-auto relative p-8">
                <div className="max-w-7xl mx-auto h-full flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-white mb-2">Calendar</h1>
                            <p className="text-slate-400">Track your deadlines and study schedule</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center bg-slate-800/50 rounded-xl p-1 border border-white/10">
                                <button onClick={prevMonth} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="px-4 font-medium text-white min-w-[140px] text-center">
                                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                                </span>
                                <button onClick={nextMonth} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors">
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                            <button className="glass-button px-4 py-2 rounded-xl flex items-center gap-2">
                                <Plus className="w-5 h-5" />
                                <span>Add Event</span>
                            </button>
                        </div>
                    </div>

                    <div className="glass-card flex-1 p-6 overflow-hidden flex flex-col">
                        {/* Days Header */}
                        <div className="grid grid-cols-7 mb-4">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="text-center text-slate-500 text-sm font-medium py-2">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 flex-1 auto-rows-fr gap-px bg-slate-800/50 border border-white/5 rounded-xl overflow-hidden">
                            {/* Empty cells for previous month */}
                            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                                <div key={`empty-${i}`} className="bg-[#0f172a]/50 p-4 min-h-[100px]" />
                            ))}

                            {/* Days of current month */}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1;
                                const dayTasks = getTasksForDate(day);
                                const isToday = day === new Date().getDate() &&
                                    currentDate.getMonth() === new Date().getMonth() &&
                                    currentDate.getFullYear() === new Date().getFullYear();

                                return (
                                    <div key={day} className={`bg-[#0f172a]/30 p-3 min-h-[100px] border-t border-l border-white/5 hover:bg-white/5 transition-colors group relative ${isToday ? 'bg-blue-500/5' : ''}`}>
                                        <span className={`text-sm font-medium ${isToday ? 'text-blue-400' : 'text-slate-400'} group-hover:text-white`}>
                                            {day}
                                        </span>

                                        <div className="mt-2 space-y-1">
                                            {dayTasks.map(task => (
                                                <div key={task.id} className="text-xs p-1.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300 truncate">
                                                    {task.title}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
