                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] opacity-50"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] opacity-50"></div>
                </div >

    <div className="relative z-10 p-8 max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
            <div>
                <h1 className="text-3xl font-serif font-bold text-white mb-1">
                    Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">{user.user_metadata.full_name?.split(' ')[0] || 'Student'}!</span>
                </h1>
                <p className="text-slate-400">Let's continue your learning journey</p>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="bg-slate-800/50 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors w-64"
                    />
                </div>
                <button className="w-10 h-10 rounded-full bg-slate-800/50 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-900"></span>
                </button>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-[2px]">
                    {user.user_metadata.avatar_url ? (
                        <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
                    ) : (
                        <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-white font-medium text-sm">
                            {user.email?.[0].toUpperCase()}
                        </div>
                    )}
                </div>
            </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <StatCard
                title="Study Streak"
                value={`${stats.streak} days`}
                icon={<Zap className="w-5 h-5 text-emerald-400" />}
                progress={Math.min(stats.streak * 10, 100)}
                color="emerald"
            />
            <StatCard
                title="Total Study Time"
                value={`${stats.totalStudyTime} hours`}
                icon={<Clock className="w-5 h-5 text-blue-400" />}
                progress={Math.min(stats.totalStudyTime * 2, 100)}
                color="blue"
            />
            <StatCard
                title="Tasks Completed"
                value="0 completed"
                icon={<Target className="w-5 h-5 text-purple-400" />}
                progress={0}
                color="purple"
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Subjects */}
            <div className="lg:col-span-2 space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Your Subjects</h2>
                    <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">View All</button>
                </div>

                {subjects.length === 0 ? (
                    <div className="glass-card p-8 text-center">
                        <p className="text-slate-400 mb-4">You haven't added any subjects yet.</p>
                        <button className="glass-button px-6 py-2 rounded-lg">
                            Add Subject
                        </button>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                        {subjects.map((subject) => (
                            <SubjectCard
                                key={subject.id}
                                title={subject.title}
                                chapters={`${subject.chapters[0]?.count || 0} chapters`}
                                progress={0}
                                time="0h studied"
                                streak="0 days"
                                color={subject.color || 'blue'}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Upcoming */}
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-white">Upcoming</h2>
                <div className="space-y-4">
                    {tasks.length === 0 ? (
                        <p className="text-slate-400 text-sm">No upcoming tasks.</p>
                    ) : (
                        tasks.map((task) => (
                            <UpcomingCard
                                key={task.id}
                                title={task.title}
                                subject="Unknown"
                                date={new Date(task.due_date).toLocaleDateString()}
                                time={new Date(task.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                type={task.type || 'assignment'}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    };

        return (
        <div className="glass-card p-6 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-slate-400 font-medium text-sm mb-1">{title}</h3>
                    <p className="text-white font-medium">{value}</p>
                </div>
                <div className="p-2 bg-white/5 rounded-lg border border-white/10 group-hover:scale-110 transition-transform duration-300">
                    {icon}
                </div>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full ${colors[color as keyof typeof colors]} transition-all duration-1000 ease-out`}
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <div className="mt-2 text-right text-xs text-slate-500">{progress}%</div>
        </div>
        );
}

        function SubjectCard({title, chapters, progress, time, streak, color}: any) {
    const colors = {
            cyan: 'border-cyan-500/50',
        orange: 'border-orange-500/50',
        emerald: 'border-emerald-500/50',
        purple: 'border-purple-500/50',
    };

        const barColors = {
            cyan: 'bg-cyan-500',
        orange: 'bg-orange-500',
        emerald: 'bg-emerald-500',
        purple: 'bg-purple-500',
    };

        return (
        <div className={`glass-card p-6 border-l-4 ${colors[color]} hover:bg-white/5 transition-all duration-300 group`}>
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
                    <p className="text-slate-400 text-sm">{chapters}</p>
                </div>
                <button className="text-slate-500 hover:text-white transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                </button>
            </div>

            <div className="mb-4">
                <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-500">Progress</span>
                    <span className="text-white font-medium">{progress}% complete</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full ${barColors[color]} transition-all duration-1000 ease-out group-hover:brightness-110`}
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-400 pt-4 border-t border-white/5">
                <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{time}</span>
                </div>
                <div className="flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" />
                    <span>{streak}</span>
                </div>
            </div>
        </div>
        );
}

        function UpcomingCard({title, subject, date, time, type}: any) {
    const types = {
            test: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        review: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        deadline: 'bg-red-500/10 text-red-400 border-red-500/20',
    };

        return (
        <div className="glass-card p-4 flex items-center gap-4 hover:bg-white/5 transition-colors cursor-pointer">
            <div className="flex-1">
                <h4 className="text-white font-medium mb-1">{title}</h4>
                <p className="text-slate-400 text-sm">{subject}</p>
            </div>
            <div className="text-right">
                <div className={`text-xs px-2 py-1 rounded-full border ${types[type]} inline-block mb-1`}>
                    {type}
                </div>
                <div className="text-slate-500 text-xs flex items-center justify-end gap-1">
                    <CalendarIcon className="w-3 h-3" />
                    {date}
                </div>
            </div>
        </div>
        );
}
