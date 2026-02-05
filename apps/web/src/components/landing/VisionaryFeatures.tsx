'use client';

import { motion } from 'framer-motion';
import { 
    Brain, Zap, Activity, Shield, Users, Globe, 
    Cpu, Layers, BarChart3, Box, Clock, Milestone
} from 'lucide-react';

const PILLARS = [
    {
        title: 'Hyper-Personalization',
        description: 'AI-driven adaptation to your unique learning style and pace.',
        icon: Brain,
        color: 'from-blue-500 to-cyan-500'
    },
    {
        title: 'Immersive Integration',
        description: 'Learning embedded directly into your daily tools and workflows.',
        icon: Box,
        color: 'from-purple-500 to-pink-500'
    },
    {
        title: 'Skill-Based Analytics',
        description: 'Advanced measurement of engagement and ROI on skill acquisition.',
        icon: BarChart3,
        color: 'from-emerald-500 to-teal-500'
    }
];

const FEATURES = [
    {
        title: 'Hyper-Personalized AI Engine',
        description: 'Advanced AI identifies individual skill gaps and continuously adapts, creating unique learning journeys that shift based on goals.',
        icon: Cpu
    },
    {
        title: 'Integrated Workflow Learning',
        description: 'Rather than separate training, education is embedded within daily tools, allowing for "microlearning" during work hours.',
        icon: Layers
    },
    {
        title: 'Immersive & Multi-format Content',
        description: 'Features include generative AI-created scenarios, simulations, and interactive 3D environments rather than static video.',
        icon: Box
    },
    {
        title: 'Comprehensive Analytics',
        description: 'Moves beyond completion rates to measure engagement and ROI on skill acquisition.',
        icon: BarChart3
    },
    {
        title: 'Absolute Accessibility & Flexibility',
        description: 'Mobile-first, offline capabilities, and seamless cross-device synchronization.',
        icon: Globe
    },
    {
        title: 'Social & Collaborative',
        description: 'Built-in community-driven spaces that facilitate peer-to-peer knowledge sharing.',
        icon: Users
    }
];

const FUNCTIONAL_FEATURES = [
    {
        feature: 'Invisible AI',
        description: 'AI is no longer a "tool" but the backend that automates content creation, tagging, and administrative tasks like grading.'
    },
    {
        feature: 'Social Mentorship',
        description: 'Automated "smart matching" pairs learners with peer mentors or coaches to build strategic and critical thinking.'
    },
    {
        feature: 'Global Accessibility',
        description: 'Real-time multilingual AI and built-in accessibility (live captions, sign language avatars) ensure inclusion across all borders.'
    },
    {
        feature: 'Adaptive Assessments',
        description: 'Exams take place in simulated environments, testing application skills rather than rote memorization.'
    }
];

const VISION_POINTS = [
    {
        title: 'Hyper-Personalized AI Tutors',
        description: 'AI agents act as 24/7 digital mentors, analyzing student strengths, weaknesses, and even emotional states to adjust content in real-time.',
        icon: Brain
    },
    {
        title: 'Interactive 3D Game Worlds',
        description: 'Learning moves beyond text to 3D experiences. Explore virtual cities and solve real-world problems in an immersive environment.',
        icon: Milestone
    },
    {
        title: 'Microlearning as Default',
        description: 'Prioritizing "bite-sized" 5–10 minute modules to fit busy lifestyles and combat shorter attention spans.',
        icon: Clock
    },
    {
        title: 'Blockchain Credentials',
        description: 'Secure, instantly verifiable, and "stackable" digital badges or certificates that users own and control.',
        icon: Shield
    }
];

export default function VisionaryFeatures() {
    return (
        <section className="py-24 relative overflow-hidden bg-[#0A0A0F]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Section Header */}
                <div className="text-center mb-20">
                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-bold text-white mb-6"
                    >
                        The Future of Learning
                    </motion.h2>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-slate-400 max-w-3xl mx-auto"
                    >
                        We're not just building a platform; we're creating a hyper-personalized ecosystem designed for the world of 2026 and beyond.
                    </motion.p>
                </div>

                {/* Three Pillars */}
                <div className="grid md:grid-cols-3 gap-8 mb-24">
                    {PILLARS.map((pillar, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="relative group"
                        >
                            <div className="absolute -inset-px bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative bg-slate-900 rounded-2xl p-8 h-full border border-white/5">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${pillar.color} flex items-center justify-center mb-6`}>
                                    <pillar.icon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">{pillar.title}</h3>
                                <p className="text-slate-400 leading-relaxed">
                                    {pillar.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Feature Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
                    {FEATURES.map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.05 }}
                            className="p-6 rounded-2xl border border-white/5 hover:bg-white/5 transition-colors"
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-blue-500/10 rounded-lg">
                                    <feature.icon className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-white mb-2">{feature.title}</h4>
                                    <p className="text-sm text-slate-400 leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Vision Points */}
                <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 rounded-3xl p-12 border border-white/10 mb-24">
                    <h3 className="text-3xl font-bold text-white mb-12 text-center">Visionary Core</h3>
                    <div className="grid md:grid-cols-2 gap-12">
                        {VISION_POINTS.map((point, i) => (
                            <div key={i} className="flex gap-6">
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                    <point.icon className="w-6 h-6 text-purple-400" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-white mb-3">{point.title}</h4>
                                    <p className="text-slate-400 leading-relaxed">
                                        {point.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Functional Features Table-style */}
                <div className="max-w-4xl mx-auto">
                    <h3 className="text-3xl font-bold text-white mb-12 text-center">2026 Functional Standards</h3>
                    <div className="space-y-4">
                        {FUNCTIONAL_FEATURES.map((item, i) => (
                            <div key={i} className="flex flex-col md:flex-row gap-4 p-6 rounded-2xl bg-white/5 border border-white/5 items-center">
                                <div className="md:w-1/3 font-bold text-blue-400 text-lg">
                                    {item.feature}
                                </div>
                                <div className="md:w-2/3 text-slate-400">
                                    {item.description}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
