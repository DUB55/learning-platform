import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import SocialProof from '@/components/landing/SocialProof';
import ProductShowcase from '@/components/landing/ProductShowcase';
import Benefits from '@/components/landing/Benefits';
import VisionaryFeatures from '@/components/landing/VisionaryFeatures';
import Footer from '@/components/landing/Footer';

export default function LandingPageModern() {
    return (
        <div className="min-h-screen bg-[#0f172a] relative overflow-hidden selection:bg-blue-500/30">
            {/* Global Styles (preserved from original page.tsx) */}
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
                <VisionaryFeatures />
                <Benefits />
                <Footer />
            </div>
        </div>
    );
}
