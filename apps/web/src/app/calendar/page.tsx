'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

import { useTasks } from '@/hooks/useTasks';
import { ChevronLeft, ChevronRight, Plus, Clock, CheckCircle2, X, Globe, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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
    const { user, profile } = useAuth();
    const { tasks } = useTasks(user);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [showEventModal, setShowEventModal] = useState(false);

    // Form State
    const [eventTitle, setEventTitle] = useState('');
    const [eventDescription, setEventDescription] = useState('');
    const [eventColor, setEventColor] = useState('blue');
    const [startDateInput, setStartDateInput] = useState('');
    const [startTimeInput, setStartTimeInput] = useState('09:00');
    const [endDateInput, setEndDateInput] = useState('');
    const [endTimeInput, setEndTimeInput] = useState('10:00');
    const [isGlobal, setIsGlobal] = useState(false);

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    useEffect(() => {
        if (user) {
            fetchEvents();
        }
    }, [user, currentDate]);

    const fetchEvents = async () => {
        const { data } = await (supabase.from('calendar_events') as any)
            .select('*')
            .gte('start_date', new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString())
            .lte('start_date', new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString());
        setEvents(data || []);
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
        if (!eventTitle.trim() || !startDateInput || !endDateInput) return;

        // Combine date and time
        const startDateTime = new Date(`${startDateInput}T${startTimeInput}`);
        const endDateTime = new Date(`${endDateInput}T${endTimeInput}`);

        if (endDateTime < startDateTime) {
            alert('End time cannot be before start time');
            return;
        }

        const { error } = await (supabase.from('calendar_events') as any).insert({
            user_id: user?.id,
            title: eventTitle,
            description: eventDescription,
            start_date: startDateTime.toISOString(),
            end_date: endDateTime.toISOString(),
            color: eventColor,
            is_global: isGlobal
        });

        if (!error) {
            setShowEventModal(false);
            fetchEvents();
        } else {
            console.error('Error creating event:', error);
            alert(`Failed to create event: ${error.message}`);
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
        <div className="p-8 pb-32 relative h-full">
            <div className="max-w-7xl mx-auto h-full flex flex-col">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-white mb-2">Calendar</h1>
                        <p className="text-slate-400">Track your deadlines and study schedule</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => openCreateModal(new Date())}
                            className="glass-button px-4 py-2 rounded-xl flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add Event</span>
                        </button>
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
                                <div
                                    key={day}
                                    className={`bg-[#0f172a]/30 p-3 min-h-[100px] border-t border-l border-white/5 hover:bg-white/5 transition-colors group relative cursor-pointer ${isToday ? 'bg-blue-500/5' : ''}`}
                                    onClick={() => openCreateModal(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                                >
                                    <span className={`text-sm font-medium ${isToday ? 'text-blue-400' : 'text-slate-400'} group-hover:text-white`}>
                                        {day}
                                    </span>

                                    <div className="mt-2 space-y-1">
                                        {/* Calendar Events */}
                                        {events.filter(e => new Date(e.start_date).getDate() === day).map(event => (
                                            <div key={event.id} className={`text-xs p-1.5 rounded border truncate flex items-center gap-1 ${event.is_global
                                                ? 'bg-purple-500/10 border-purple-500/20 text-purple-300'
                                                : 'bg-blue-500/10 border-blue-500/20 text-blue-300'
                                                }`}>
                                                {event.is_global && <Globe className="w-3 h-3 flex-shrink-0" />}
                                                {event.title}
                                            </div>
                                        ))}

                                        {/* Todo Tasks */}
                                        {dayTasks.map(task => (
                                            <div key={task.id} className="text-xs p-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 truncate flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
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

            {/* Event Creation Modal */}
            {showEventModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowEventModal(false)}>
                    <div className="glass-card p-6 w-96" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">
                                Create Event
                            </h3>
                            <button onClick={() => setShowEventModal(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateEvent} className="space-y-4">
                            <input
                                type="text"
                                value={eventTitle}
                                onChange={(e) => setEventTitle(e.target.value)}
                                placeholder="Event title"
                                className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                required
                                autoFocus
                            />
                            <textarea
                                value={eventDescription}
                                onChange={(e) => setEventDescription(e.target.value)}
                                placeholder="Description (optional)"
                                className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 text-white h-20 resize-none focus:outline-none focus:border-blue-500"
                            />

                            {/* Start Date & Time */}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={startDateInput}
                                        onChange={(e) => setStartDateInput(e.target.value)}
                                        className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Start Time</label>
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
