'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

import { useTasks } from '@/hooks/useTasks';
import { 
    ChevronLeft, ChevronRight, Plus, Clock, CheckCircle2, X, Globe, Lock,
    Check, Trash2, Tag, Edit2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ContextMenu from '@/components/ContextMenu';
import { xpService } from '@/lib/xpService';
import TaskView from '@/components/tasks/TaskView';

type CalendarEvent = {
    id: string;
    title: string;
    description: string | null;
    start_date: string;
    end_date: string;
    color: string;
    is_global?: boolean;
};

export default function CalendarPage() {
    const { user, profile, updateXP } = useAuth();
    const { tasks, isLoading: loading, mutate } = useTasks(user);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [showEventModal, setShowEventModal] = useState(false);
    const [view, setView] = useState<'month' | 'week' | 'work-week' | 'day' | 'tasks'>('month');

    // Calendar Form State
    const [eventTitle, setEventTitle] = useState('');
    const [eventDescription, setEventDescription] = useState('');
    const [eventColor, setEventColor] = useState('blue');
    const [startDateInput, setStartDateInput] = useState('');
    const [startTimeInput, setStartTimeInput] = useState('09:00');
    const [endDateInput, setEndDateInput] = useState('');
    const [endTimeInput, setEndTimeInput] = useState('10:00');
    const [isGlobal, setIsGlobal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const createControllerRef = useRef<AbortController | null>(null);

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    useEffect(() => {
        const controller = new AbortController();
        if (user) {
            fetchEvents(controller.signal);
        }
        return () => controller.abort();
    }, [user, currentDate]);

    const fetchEvents = async (signal?: AbortSignal) => {
        try {
            const { data, error } = await (supabase.from('calendar_events') as any)
                .select('*')
                .gte('start_date', new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString())
                .lte('start_date', new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString())
                .abortSignal(signal);

            if (error) {
                if (error.name === 'AbortError') return;
                console.error('Error fetching events:', error);
                return;
            }
            setEvents(data || []);
        } catch (error: any) {
            if (error.name === 'AbortError') return;
            console.error('Error in fetchEvents:', error);
        }
    };

    const openCreateModal = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        setStartDateInput(dateStr);
        setEndDateInput(dateStr);
        setStartTimeInput('09:00');
        setEndTimeInput('10:00');
        setEventTitle('');
        setEventDescription('');
        setEventColor('blue');
        setIsGlobal(false);
        setShowEventModal(true);
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!eventTitle.trim() || !startDateInput || !endDateInput) {
            alert('Please fill in title, start date and end date');
            return;
        }

        // Combine date and time
        const startDateTime = new Date(`${startDateInput}T${startTimeInput}`);
        const endDateTime = new Date(`${endDateInput}T${endTimeInput}`);

        if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
            alert('Invalid date or time');
            return;
        }

        if (endDateTime < startDateTime) {
            alert('End time cannot be before start time');
            return;
        }

        try {
            createControllerRef.current?.abort();
            createControllerRef.current = new AbortController();
            setIsCreating(true);

            const { error } = await (supabase.from('calendar_events') as any)
                .insert({
                    user_id: user?.id,
                    title: eventTitle,
                    description: eventDescription,
                    start_date: startDateTime.toISOString(),
                    end_date: endDateTime.toISOString(),
                    color: eventColor,
                    is_global: isGlobal
                })
                .abortSignal(createControllerRef.current.signal as any);

            if (error) {
                if (error.name === 'AbortError') return;
                throw error;
            }

            setShowEventModal(false);
            fetchEvents();
        } catch (error) {
            console.error('Error creating event:', error);
            alert('Failed to create event');
        } finally {
            setIsCreating(false);
            createControllerRef.current = null;
        }
    };

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
        <div className="flex-1 flex flex-col p-4 md:p-8 relative">
            <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-serif font-bold text-white mb-2">Calendar</h1>
                        <p className="text-slate-400 text-sm md:text-base">Track your deadlines and study schedule</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
                        <button
                            onClick={() => openCreateModal(new Date())}
                            className="glass-button px-4 py-2 rounded-xl flex items-center justify-center gap-2 text-sm font-bold"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add Event</span>
                        </button>
                        <div className="flex items-center justify-between bg-slate-800/50 rounded-xl p-1 border border-white/10">
                            <button onClick={prevMonth} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="px-2 md:px-4 font-medium text-white min-w-[120px] md:min-w-[140px] text-center text-sm md:text-base">
                                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </span>
                            <button onClick={nextMonth} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex items-center bg-slate-800/50 rounded-xl p-1 border border-white/10 overflow-x-auto no-scrollbar">
                            {(['month', 'week', 'work-week', 'day', 'tasks'] as const).map(v => (
                                <button
                                    key={v}
                                    onClick={() => setView(v)}
                                    className={`px-3 py-2 rounded-lg text-xs md:text-sm font-medium capitalize transition-colors whitespace-nowrap ${view === v ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    {v.replace('-', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="glass-card flex-1 p-3 md:p-6 flex flex-col overflow-x-auto no-scrollbar">
                    <div className="min-w-[700px] lg:min-w-0 flex-1 flex flex-col">
                        {view === 'month' && (
                            <div className="flex-1 flex flex-col">
                                <div className="grid grid-cols-7 mb-2 md:mb-4">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                        <div key={day} className="text-center text-slate-500 text-[10px] md:text-sm font-bold uppercase tracking-wider py-2">
                                            {day}
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 flex-1 auto-rows-fr gap-px bg-slate-800/50 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                                    {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                                        <div key={`empty-${i}`} className="bg-[#0f172a]/50 p-2 md:p-4 min-h-[100px] md:min-h-[140px]" />
                                    ))}
                                    {Array.from({ length: daysInMonth }).map((_, i) => {
                                        const day = i + 1;
                                        const dayTasks = getTasksForDate(day);
                                        const isToday = day === new Date().getDate() &&
                                            currentDate.getMonth() === new Date().getMonth() &&
                                            currentDate.getFullYear() === new Date().getFullYear();
                                        return (
                                            <div
                                                key={day}
                                                className={`bg-[#0f172a]/30 p-1.5 md:p-3 min-h-[100px] md:min-h-[140px] border-t border-l border-white/10 hover:bg-white/5 transition-all group relative cursor-pointer ${isToday ? 'bg-blue-500/5' : ''}`}
                                                onClick={() => openCreateModal(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                                            >
                                                <span className={`text-[10px] md:text-sm font-bold ${isToday ? 'text-blue-400' : 'text-slate-400'} group-hover:text-white transition-colors`}>
                                                    {day}
                                                </span>
                                                <div className="mt-1 md:mt-2 space-y-1 overflow-y-auto max-h-[80px] md:max-h-[120px] no-scrollbar">
                                                    {events.filter(e => new Date(e.start_date).getDate() === day).map(event => (
                                                        <div key={event.id} className={`text-[9px] md:text-xs p-1 md:p-1.5 rounded-lg border truncate flex items-center gap-1 shadow-sm ${event.is_global
                                                            ? 'bg-purple-500/10 border-purple-500/20 text-purple-300'
                                                            : 'bg-blue-500/10 border-blue-500/20 text-blue-300'
                                                            }`}>
                                                            {event.is_global && <Globe className="w-2 h-2 md:w-3 md:h-3 flex-shrink-0" />}
                                                            {event.title}
                                                        </div>
                                                    ))}
                                                    {dayTasks.map(task => (
                                                        <div key={task.id} className="text-[9px] md:text-xs p-1 md:p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 truncate flex items-center gap-1 shadow-sm">
                                                            <CheckCircle2 className="w-2 h-2 md:w-3 md:h-3 flex-shrink-0" />
                                                            {task.title}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {view === 'week' && (
                            <div className="grid grid-cols-7 flex-1 gap-px bg-slate-800/50 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                                {Array.from({ length: 7 }).map((_, i) => {
                                    const startOfWeek = new Date(currentDate);
                                    const dayIndex = (startOfWeek.getDay() + i) % 7;
                                    const diff = i - startOfWeek.getDay();
                                    const date = new Date(currentDate);
                                    date.setDate(currentDate.getDate() + diff);
                                    const day = date.getDate();
                                    const dayTasks = getTasksForDate(day);
                                    return (
                                        <div key={`week-${i}`} className="bg-[#0f172a]/30 p-2 md:p-4 min-h-[400px] border-t border-l border-white/10 hover:bg-white/5 transition-all">
                                            <span className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-wider">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dayIndex]} {day}</span>
                                            <div className="mt-3 space-y-2">
                                                {events.filter(e => new Date(e.start_date).toDateString() === date.toDateString()).map(event => (
                                                    <div key={event.id} className={`text-[9px] md:text-xs p-2 rounded-xl border truncate flex items-center gap-2 shadow-sm ${event.is_global ? 'bg-purple-500/10 border-purple-500/20 text-purple-300' : 'bg-blue-500/10 border-blue-500/20 text-blue-300'}`}>
                                                        {event.is_global && <Globe className="w-3 h-3 flex-shrink-0" />}
                                                        {event.title}
                                                    </div>
                                                ))}
                                                {dayTasks.map(task => (
                                                    <div key={task.id} className="text-[9px] md:text-xs p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 truncate flex items-center gap-2 shadow-sm">
                                                        <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                                                        {task.title}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {view === 'work-week' && (
                            <div className="grid grid-cols-5 flex-1 gap-px bg-slate-800/50 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                                {Array.from({ length: 5 }).map((_, i) => {
                                    const date = new Date(currentDate);
                                    const currentDay = currentDate.getDay();
                                    const mondayOffset = (currentDay === 0 ? -6 : 1 - currentDay);
                                    date.setDate(currentDate.getDate() + mondayOffset + i);
                                    const day = date.getDate();
                                    const dayTasks = getTasksForDate(day);
                                    return (
                                        <div key={`work-${i}`} className="bg-[#0f172a]/30 p-2 md:p-4 min-h-[400px] border-t border-l border-white/10 hover:bg-white/5 transition-all">
                                            <span className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-wider">{['Mon','Tue','Wed','Thu','Fri'][i]} {day}</span>
                                            <div className="mt-3 space-y-2">
                                                {events.filter(e => new Date(e.start_date).toDateString() === date.toDateString()).map(event => (
                                                    <div key={event.id} className={`text-[9px] md:text-xs p-2 rounded-xl border truncate flex items-center gap-2 shadow-sm ${event.is_global ? 'bg-purple-500/10 border-purple-500/20 text-purple-300' : 'bg-blue-500/10 border-blue-500/20 text-blue-300'}`}>
                                                        {event.is_global && <Globe className="w-3 h-3 flex-shrink-0" />}
                                                        {event.title}
                                                    </div>
                                                ))}
                                                {dayTasks.map(task => (
                                                    <div key={task.id} className="text-[9px] md:text-xs p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 truncate flex items-center gap-2 shadow-sm">
                                                        <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                                                        {task.title}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {view === 'day' && (
                            <div className="grid grid-rows-24 flex-1 gap-px bg-slate-800/50 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                                {Array.from({ length: 24 }).map((_, hour) => (
                                    <div key={`hour-${hour}`} className="bg-[#0f172a]/30 p-2 md:p-3 min-h-[60px] md:min-h-[80px] border-t border-white/10 hover:bg-white/5 transition-all group">
                                        <span className="text-[10px] md:text-xs font-bold text-slate-500 group-hover:text-slate-300 transition-colors">{hour.toString().padStart(2, '0')}:00</span>
                                        <div className="mt-1 flex flex-wrap gap-2">
                                            {events.filter(e => {
                                                const d = new Date(e.start_date);
                                                return d.getFullYear() === currentDate.getFullYear() &&
                                                    d.getMonth() === currentDate.getMonth() &&
                                                    d.getDate() === currentDate.getDate() &&
                                                    d.getHours() === hour;
                                            }).map(event => (
                                                <div key={event.id} className={`text-[9px] md:text-xs px-2 md:px-3 py-1 md:py-1.5 rounded-xl border truncate flex items-center gap-2 shadow-sm ${event.is_global ? 'bg-purple-500/10 border-purple-500/20 text-purple-300' : 'bg-blue-500/10 border-blue-500/20 text-blue-300'}`}>
                                                    {event.is_global && <Globe className="w-2.5 h-2.5 md:w-3 md:h-3 flex-shrink-0" />}
                                                    {event.title}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                    {view === 'tasks' && (
                        <div className="flex-1 h-full overflow-y-auto no-scrollbar">
                            <TaskView />
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Event Creation Modal */}
        {showEventModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4" onClick={() => setShowEventModal(false)}>
                    <div className="glass-card p-4 md:p-6 w-full max-w-md animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg md:text-xl font-bold text-white">
                                Create Event
                            </h3>
                            <button onClick={() => setShowEventModal(false)} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateEvent} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Event Title</label>
                                <input
                                    type="text"
                                    value={eventTitle}
                                    onChange={(e) => setEventTitle(e.target.value)}
                                    placeholder="Enter title..."
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Description</label>
                                <textarea
                                    value={eventDescription}
                                    onChange={(e) => setEventDescription(e.target.value)}
                                    placeholder="Add details (optional)..."
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 text-white text-sm h-20 resize-none focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={startDateInput}
                                        onChange={(e) => setStartDateInput(e.target.value)}
                                        className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Start Time</label>
                                    <input
                                        type="time"
                                        value={startTimeInput}
                                        onChange={(e) => setStartTimeInput(e.target.value)}
                                        className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            {/* End Date & Time */}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        value={endDateInput}
                                        onChange={(e) => setEndDateInput(e.target.value)}
                                        className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">End Time</label>
                                    <input
                                        type="time"
                                        value={endTimeInput}
                                        onChange={(e) => setEndTimeInput(e.target.value)}
                                        className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Admin Options */}
                            {profile?.is_admin && (
                                <div className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-xl border border-white/5">
                                    <button
                                        type="button"
                                        onClick={() => setIsGlobal(!isGlobal)}
                                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isGlobal ? 'bg-purple-500 border-purple-500' : 'border-slate-500'}`}
                                    >
                                        {isGlobal && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                    </button>
                                    <span className="text-sm text-slate-300">Make Global Event</span>
                                    <Globe className="w-3 h-3 text-purple-400 ml-auto" />
                                </div>
                            )}

                            <div className="flex gap-2 pt-2">
                                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-colors font-medium">
                                    Create Event
                                </button>
                                <button type="button" onClick={() => setShowEventModal(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl transition-colors font-medium">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
