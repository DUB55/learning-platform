'use client';

import Sidebar from '@/components/Sidebar';
import { FileText } from 'lucide-react';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#0f172a] flex overflow-hidden">
            <Sidebar />

            <main className="flex-1 overflow-y-auto relative p-8">
                <div className="max-w-4xl mx-auto">
                    <header className="mb-10">
                        <div className="flex items-center gap-3 mb-2">
                            <FileText className="w-8 h-8 text-blue-500" />
                            <h1 className="text-3xl font-serif font-bold text-white">Terms of Service</h1>
                        </div>
                        <p className="text-slate-400">Last updated: {new Date().toLocaleDateString()}</p>
                    </header>

                    <div className="glass-card p-8 space-y-6 prose prose-invert max-w-none">
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-3">Agreement to Terms</h2>
                            <p className="text-slate-300 leading-relaxed">
                                By accessing and using LearnHub, you agree to be bound by these Terms of Service and all applicable laws and regulations.
                                If you do not agree with any of these terms, you are prohibited from using this platform.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-3">Use License</h2>
                            <p className="text-slate-300 leading-relaxed mb-2">
                                Permission is granted to temporarily access LearnHub for personal, non-commercial use only. This license shall automatically terminate if you violate any of these restrictions.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-3">User Responsibilities</h2>
                            <p className="text-slate-300 leading-relaxed mb-2">As a user, you agree to:</p>
                            <ul className="list-disc list-inside text-slate-300 space-y-1">
                                <li>Provide accurate and complete information</li>
                                <li>Maintain the security of your account</li>
                                <li>Not share your account credentials</li>
                                <li>Use the platform for lawful purposes only</li>
                                <li>Respect other users and their content</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-3">Content Ownership</h2>
                            <p className="text-slate-300 leading-relaxed">
                                You retain ownership of any content you create on LearnHub. However, by using our platform,
                                you grant us a license to store, display, and share your content as necessary to provide our services.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-3">Prohibited Activities</h2>
                            <p className="text-slate-300 leading-relaxed mb-2">You may not:</p>
                            <ul className="list-disc list-inside text-slate-300 space-y-1">
                                <li>Attempt to gain unauthorized access to the platform</li>
                                <li>Interfere with other users' access to the platform</li>
                                <li>Upload malicious code or viruses</li>
                                <li>Violate any applicable laws or regulations</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-3">Disclaimer</h2>
                            <p className="text-slate-300 leading-relaxed">
                                LearnHub is provided "as is" without any warranties, expressed or implied. We do not guarantee
                                that the platform will be uninterrupted, secure, or error-free.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-3">Termination</h2>
                            <p className="text-slate-300 leading-relaxed">
                                We reserve the right to terminate or suspend your account at any time for violations of these terms or for any other reason.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-3">Changes to Terms</h2>
                            <p className="text-slate-300 leading-relaxed">
                                We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance of the new terms.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-3">Contact Information</h2>
                            <p className="text-slate-300 leading-relaxed">
                                If you have any questions about these Terms of Service, please contact us through the settings page.
                            </p>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
