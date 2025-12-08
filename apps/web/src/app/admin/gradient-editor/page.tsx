'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

import { ArrowLeft, Save, Plus, Trash2, RefreshCw, Play, Palette, Zap } from 'lucide-react';

interface GradientConfig {
    type: 'linear' | 'radial' | 'conic';
    colors: string[];
    angle: number;
    speed: number; // seconds
    enabled: boolean;
    backgroundSize: number; // percentage
}

const DEFAULT_CONFIG: GradientConfig = {
    type: 'linear',
    colors: ['#60a5fa', '#c084fc', '#f472b6'], // blue-400, purple-400, pink-400
    angle: 90,
    speed: 3,
    enabled: true,
    backgroundSize: 200
};

export default function GradientEditorPage() {
    const { user, profile } = useAuth();
    const router = useRouter();
    const [config, setConfig] = useState<GradientConfig>(DEFAULT_CONFIG);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (profile?.is_admin === false) {
            router.push('/');
            return;
        }
        fetchConfig();
    }, [profile, router]);

    const fetchConfig = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('admin_permission_settings')
            .select('default_value')
            .eq('setting_key', 'ui.landing_gradient')
            .single();

        if (data?.default_value) {
            try {
                setConfig(JSON.parse(data.default_value));
            } catch (e) {
                console.error('Error parsing gradient config:', e);
            }
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('admin_permission_settings')
                .upsert({
                    setting_key: 'ui.landing_gradient',
                    default_value: JSON.stringify(config),
                    description: 'Configuration for Landing Page Gradient Animation'
                }, { onConflict: 'setting_key' }); // Ensure onConflict is used

            if (error) throw error;
            alert('Gradient saved successfully!');
        } catch (error) {
            console.error('Error saving gradient:', error);
            alert('Failed to save gradient');
        } finally {
            setSaving(false);
        }
    };

    const addColor = () => {
        setConfig(prev => ({ ...prev, colors: [...prev.colors, '#ffffff'] }));
    };

    const removeColor = (index: number) => {
        if (config.colors.length <= 2) return;
        setConfig(prev => ({
            ...prev,
            colors: prev.colors.filter((_, i) => i !== index)
        }));
    };

    const updateColor = (index: number, value: string) => {
        const newColors = [...config.colors];
        newColors[index] = value;
        setConfig(prev => ({ ...prev, colors: newColors }));
    };

    // Generate CSS for Preview
    const getGradientCSS = () => {
        const { type, colors, angle } = config;
        const colorString = colors.join(', ');

        if (type === 'linear') {
            return `linear-gradient(${angle}deg, ${colorString})`;
        } else if (type === 'radial') {
            return `radial-gradient(circle, ${colorString})`;
        } else {
            return `conic-gradient(from ${angle}deg, ${colorString})`;
        }
    };

    const getPreviewStyle = () => ({
        backgroundImage: getGradientCSS(),
        backgroundSize: `${config.backgroundSize}% auto`,
        animation: config.enabled ? `gradient-move ${config.speed}s linear infinite` : 'none',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
    });

    if (loading) {
        return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white">Loading...</div>;
    }

    return (
        <div className="h-full overflow-y-auto p-8 relative">
            

            <div className="flex-1 relative">
                {/* Global Style for Animation Keyframes */}
                <style jsx global>{`
                    @keyframes gradient-move {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }
                `}</style>

                <div className="max-w-5xl mx-auto">
                    <header className="flex items-center gap-4 mb-10">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-white mb-2">Gradient Animator</h1>
                            <p className="text-slate-400">Design the perfect gradient for the landing page</p>
                        </div>
                        <div className="ml-auto flex gap-3">
                            <button
                                onClick={fetchConfig}
                                className="px-4 py-2 text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Reset
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Changes
                            </button>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Controls */}
                        <div className="space-y-6">
                            <div className="glass-card p-6">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Palette className="w-5 h-5 text-blue-400" />
                                    Colors
                                </h3>
                                <div className="space-y-3 mb-4">
                                    {config.colors.map((color, index) => (
                                        <div key={index} className="flex gap-3">
                                            <input
                                                type="color"
                                                value={color}
                                                onChange={(e) => updateColor(index, e.target.value)}
                                                className="w-12 h-10 rounded cursor-pointer bg-transparent"
                                            />
                                            <input
                                                type="text"
                                                value={color}
                                                onChange={(e) => updateColor(index, e.target.value)}
                                                className="flex-1 bg-slate-800/50 border border-white/10 rounded-lg px-3 text-white font-mono uppercase"
                                            />
                                            <button
                                                onClick={() => removeColor(index)}
                                                disabled={config.colors.length <= 2}
                                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-30"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={addColor}
                                    className="w-full py-2 border border-dashed border-white/20 rounded-lg text-slate-400 hover:text-white hover:border-white/40 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Color
                                </button>
                            </div>

                            <div className="glass-card p-6">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-purple-400" />
                                    Animation Settings
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-2">Type</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {(['linear', 'radial', 'conic'] as const).map(type => (
                                                <button
                                                    key={type}
                                                    onClick={() => setConfig(prev => ({ ...prev, type }))}
                                                    className={`py-2 rounded-lg text-sm capitalize transition-colors ${config.type === type
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                                                >
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-slate-400 mb-2">
                                            Angle ({config.angle}°)
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="360"
                                            value={config.angle}
                                            onChange={(e) => setConfig(prev => ({ ...prev, angle: parseInt(e.target.value) }))}
                                            className="w-full accent-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-slate-400 mb-2">
                                            Speed ({config.speed}s)
                                        </label>
                                        <input
                                            type="range"
                                            min="0.5"
                                            max="10"
                                            step="0.5"
                                            value={config.speed}
                                            onChange={(e) => setConfig(prev => ({ ...prev, speed: parseFloat(e.target.value) }))}
                                            className="w-full accent-purple-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-slate-400 mb-2">
                                            Size ({config.backgroundSize}%)
                                        </label>
                                        <input
                                            type="range"
                                            min="100"
                                            max="500"
                                            value={config.backgroundSize}
                                            onChange={(e) => setConfig(prev => ({ ...prev, backgroundSize: parseInt(e.target.value) }))}
                                            className="w-full accent-pink-500"
                                        />
                                    </div>

                                    <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                                        <div className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${config.enabled ? 'bg-green-500' : 'bg-slate-700'}`}
                                            onClick={() => setConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                                        >
                                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${config.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                        </div>
                                        <span className="text-white font-medium">Enable Animation</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="space-y-6">
                            <div className="glass-card p-8 min-h-[400px] flex flex-col justify-center items-center">
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-10">Live Preview</h3>

                                <h1 className="text-6xl font-serif font-bold text-center tracking-tight leading-tight">
                                    Leer beter met <br />
                                    <span style={getPreviewStyle()}>
                                        Het DUB5 Leerplatform
                                    </span>
                                </h1>

                                <div className="mt-12 p-4 bg-black/30 rounded-lg text-xs font-mono text-slate-400 w-full overflow-x-auto">
                                    <code>
                                        background: {getGradientCSS()};<br />
                                        animation: {config.enabled ? `gradient-move ${config.speed}s linear infinite` : 'none'};
                                    </code>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
