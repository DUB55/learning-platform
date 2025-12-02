'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { useTasks } from '@/hooks/useTasks';
import { ChevronLeft, ChevronRight, Plus, Clock, CheckCircle2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type CalendarEvent = {
    id: string;
    title: string;
    description: string | null;
    start_date: string;
    color: string;
};

export default function CalendarPage() {
    const { user } = useAuth();
    const { tasks } = useTasks(user);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [showEventModal, setShowEventModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [eventTitle, setEventTitle] = useState('');
    const [eventDescription, setEventDescription] = useState('');
    const [eventColor, setEventColor] = useState('blue');
    const [eventStartTime, setEventStartTime] = useState('09:00');
    const [eventEndTime, setEventEndTime] = useState('10:00');

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

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDate || !eventTitle.trim()) return;

        // Combine date with start time
        const [startHours, startMinutes] = eventStartTime.split(':').map(Number);
        const eventDate = new Date(selectedDate);
        eventDate.setHours(startHours, startMinutes, 0, 0);

        const { error } = await (supabase.from('calendar_events') as any).insert({
            user_id: user?.id,
            title: eventTitle,
            description: eventDescription,
            start_date: eventDate.toISOString(),
            color: eventColor
        });

        if (!error) {
            setShowEventModal(false);
            setEventTitle('');
            setEventDescription('');
            setEventStartTime('09:00');
            setEventEndTime('10:00');
            setSelectedDate(null);
            fetchEvents();
        } else {
            console.error('Error creating event:', error);
            alert('Failed to create event');
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
                            <button
                                onClick={() => {
                                    setSelectedDate(new Date());
                                    setShowEventModal(true);
                                }}
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
                                        onClick={() => {
                                            setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
                                            setShowEventModal(true);
                                        }}
                                    >
                                        <span className={`text-sm font-medium ${isToday ? 'text-blue-400' : 'text-slate-400'} group-hover:text-white`}>
                                            {day}
                                        </span>

                                        <div className="mt-2 space-y-1">
                                            {/* Calendar Events */}
                                            {events.filter(e => new Date(e.start_date).getDate() === day).map(event => (
                                                <div key={event.id} className="text-xs p-1.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300 truncate">
                                                    {event.title}
                                                </div>
                                            ))}

                                            {/* Todo Tasks */}
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

                {/* Event Creation Modal */}
                {showEventModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowEventModal(false)}>
                        <div className="glass-card p-6 w-96" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-white">
                                    Create Event - {selectedDate?.toLocaleDateString()}
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
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Start Time</label>
                                        <div className="relative">
                                            <select
                                                value={eventStartTime}
                                                onChange={(e) => setEventStartTime(e.target.value)}
                                                className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 text-white appearance-none focus:outline-none focus:border-blue-500 cursor-pointer"
                                            >
                                                {Array.from({ length: 24 * 4 }).map((_, i) => {
                                                    const h = Math.floor(i / 4);
                                                    const m = (i % 4) * 15;
                                                    const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                                                    return (
                                                        <option key={time} value={time} className="bg-slate-800 text-white">
                                                            {time}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                            <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">End Time</label>
                                        <div className="relative">
                                            <select
                                                value={eventEndTime}
                                                onChange={(e) => setEventEndTime(e.target.value)}
                                                className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 text-white appearance-none focus:outline-none focus:border-blue-500 cursor-pointer"
                                            >
                                                {Array.from({ length: 24 * 4 }).map((_, i) => {
                                                    const h = Math.floor(i / 4);
                                                    const m = (i % 4) * 15;
                                                    const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                                                    return (
                                                        <option key={time} value={time} className="bg-slate-800 text-white">
                                                            {time}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                            <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-colors">
                                        Create Event
                                    </button>
                                    <button type="button" onClick={() => setShowEventModal(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl transition-colors">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
