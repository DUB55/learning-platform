'use client';


import { Shield } from 'lucide-react';

export default function PrivacyPage() {
    return (
        <div className="p-8 pb-32 relative">
            <div className="max-w-4xl mx-auto">
                <header className="mb-10">
                    <div className="flex items-center gap-3 mb-2">
                        <Shield className="w-8 h-8 text-blue-500" />
                        <h1 className="text-3xl font-serif font-bold text-white">Privacy Policy</h1>
                    </div>
                    <p className="text-slate-400">Last updated: {new Date().toLocaleDateString()}</p>
                </header>

                <div className="glass-card p-8 space-y-6 prose prose-invert max-w-none">
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-3">Introduction</h2>
                        <p className="text-slate-300 leading-relaxed">
                            Welcome to LearnHub. We respect your privacy and are committed to protecting your personal data.
                            This privacy policy will inform you about how we look after your personal data when you visit our platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-3">Data We Collect</h2>
                        <p className="text-slate-300 leading-relaxed mb-2">We collect the following information:</p>
                        <ul className="list-disc list-inside text-slate-300 space-y-1">
                            <li>Account information (name, email address)</li>
                            <li>Study progress and activity</li>
                            <li>Subjects and tasks you create</li>
                            <li>Usage data and analytics</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-3">How We Use Your Data</h2>
                        <p className="text-slate-300 leading-relaxed mb-2">We use your data to:</p>
                        <ul className="list-disc list-inside text-slate-300 space-y-1">
                            <li>Provide and improve our services</li>
                            <li>Personalize your learning experience</li>
                            <li>Send you important updates</li>
                            <li>Analyze platform usage</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-3">Data Security</h2>
                        <p className="text-slate-300 leading-relaxed">
                            We implement appropriate security measures to protect your personal information.
                            All data is encrypted and stored securely using industry-standard practices.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-3">Your Rights</h2>
                        <p className="text-slate-300 leading-relaxed mb-2">You have the right to:</p>
                        <ul className="list-disc list-inside text-slate-300 space-y-1">
                            <li>Access your personal data</li>
                            <li>Correct inaccurate data</li>
                            <li>Request deletion of your data</li>
                            <li>Export your data</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-3">Contact Us</h2>
                        <p className="text-slate-300 leading-relaxed">
                            If you have any questions about this privacy policy, please contact us through the settings page.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
