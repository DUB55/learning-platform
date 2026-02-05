import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

export function ModeCard({ title, description, icon, onClick, color }: { title: string, description: string, icon: React.ReactNode, onClick: () => void, color: 'emerald' | 'blue' }) {
    return (
        <motion.button
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`flex flex-col items-start p-8 rounded-3xl border border-white/10 bg-[#0f172a]/50 hover:bg-[#0f172a]/80 transition-all text-left group relative overflow-hidden`}
        >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-500/10 blur-3xl -mr-16 -mt-16 group-hover:bg-${color}-500/20 transition-colors`} />
            <div className={`p-4 bg-${color}-500/20 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-500`}>
                {icon}
            </div>
            <h3 className="text-2xl font-black mb-3 group-hover:text-white transition-colors">{title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-8 flex-1">{description}</p>
            <div className={`flex items-center gap-2 text-${color}-400 font-bold text-sm group-hover:gap-4 transition-all`}>
                Start Building <ChevronRight className="w-4 h-4" />
            </div>
        </motion.button>
    );
}
