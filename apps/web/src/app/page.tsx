'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import SocialProof from '@/components/landing/SocialProof';
import ProductShowcase from '@/components/landing/ProductShowcase';
import Benefits from '@/components/landing/Benefits';
import Footer from '@/components/landing/Footer';
import { supabase } from '@/lib/supabase';

export default function Home() {
    const router = useRouter();
    const [gradientStyle, setGradientStyle] = useState({});
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // Check if user is already logged in
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                // User is logged in, redirect to dashboard
                router.replace('/dashboard');
                return;
            }
            setIsChecking(false);
        };
        checkAuth();

        // Also listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                router.replace('/dashboard');
            }
        });

        return () => subscription.unsubscribe();
    }, [router]);

    useEffect(() => {
        if (isChecking) return;

        const fetchGradient = async () => {
            const { data } = await supabase
                .from('admin_permission_settings')
                .select('default_value')
                .eq('setting_key', 'ui.landing_gradient')
                .single();

            if (data?.default_value) {
                try {
                    const config = JSON.parse(data.default_value);
                    if (config.enabled) {
                        const colors = config.colors.join(', ');
                        let backgroundImage = '';
                        if (config.type === 'linear') backgroundImage = `linear-gradient(${config.angle}deg, ${colors})`;
                        else if (config.type === 'radial') backgroundImage = `radial-gradient(circle, ${colors})`;
                        else backgroundImage = `conic-gradient(from ${config.angle}deg, ${colors})`;

                        setGradientStyle({
                            backgroundImage,
                            backgroundSize: `${config.backgroundSize}% auto`,
                            animation: `gradient-move ${config.speed}s linear infinite`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            color: 'transparent'
                        });
                    }
                } catch (e) {
                    console.error('Error parsing gradient config', e);
                }
            }
        };
        fetchGradient();
    }, [isChecking]);

    // Show loading while checking auth
    if (isChecking) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-[#0f172a] relative overflow-hidden selection:bg-blue-500/30">
            {/* Global Styles */}
            <style jsx global>{`
                @keyframes gradient-move {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-20px); }
                }
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
            `}</style>

            {/* Background Texture */}
            <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] pointer-events-none opacity-20" />

            {/* Aurora Background Effect */}
            <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
            <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />

            <div className="relative z-10">
                <Navbar />
                <Hero />
                <SocialProof />
                <ProductShowcase />
                <Benefits />
                <Footer />
            </div>
        </div>
    );
}

