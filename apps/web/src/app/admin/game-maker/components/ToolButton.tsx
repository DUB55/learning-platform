import React from 'react';

export function ToolButton({ active, onClick, icon, label, tooltip }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, tooltip?: string }) {
    return (
        <div className="relative group">
            <button 
                onClick={onClick}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 translate-x-1' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
                <div className={`p-1.5 rounded-lg ${active ? 'bg-white/20' : 'bg-white/5'}`}>
                    {icon}
                </div>
                <span className="text-xs font-bold tracking-tight">{label}</span>
            </button>
            
            {tooltip && (
                <div className="absolute left-full ml-3 px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-[10px] text-slate-300 w-48 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300 z-50 translate-x-2 group-hover:translate-x-0 shadow-2xl">
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-slate-900" />
                    {tooltip}
                </div>
            )}
        </div>
    );
}
