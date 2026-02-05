 'use client';
 
 import { useState } from 'react';
 import { useRouter } from 'next/navigation';
 import { useAuth } from '@/contexts/AuthContext';
 import { supabase } from '@/lib/supabase';
 import { Shield, KeyRound, LogIn } from 'lucide-react';
 
 export default function AdminLoginPage() {
     const { user } = useAuth();
     const router = useRouter();
     const [passcode, setPasscode] = useState('');
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState('');
 
     const handleLogin = async () => {
         setError('');
         setLoading(true);
         try {
             const expected = process.env.NEXT_PUBLIC_ADMIN_PASSCODE || '';
             if (!expected || passcode !== expected) {
                 setError('Invalid admin passcode');
                 setLoading(false);
                 return;
             }
 
             const email = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
             const password = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '';
             if (!email || !password) {
                 setError('Admin credentials not configured');
                 setLoading(false);
                 return;
             }
 
             const { error: signInError } = await supabase.auth.signInWithPassword({
                 email,
                 password
             });
             if (signInError) {
                 setError('Failed to sign in as admin');
                 setLoading(false);
                 return;
             }
             router.push('/admin');
         } catch (e: any) {
             setError(e.message || 'Unexpected error');
         } finally {
             setLoading(false);
         }
     };
 
     return (
         <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6">
             <div className="glass-card max-w-md w-full p-8">
                 <div className="flex items-center gap-3 mb-6">
                     <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                         <Shield className="w-5 h-5 text-red-400" />
                     </div>
                     <h1 className="text-2xl font-bold text-white">Admin Login</h1>
                 </div>
                 <p className="text-slate-400 mb-4">Enter the admin passcode to continue.</p>
 
                 <div className="space-y-3 mb-6">
                     <label className="text-slate-400 text-sm">Passcode</label>
                     <div className="flex items-center gap-2">
                         <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                             <KeyRound className="w-4 h-4 text-slate-400" />
                         </div>
                         <input
                             type="password"
                             className="flex-1 bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500/50"
                             placeholder="Enter admin passcode"
                             value={passcode}
                             onChange={(e) => setPasscode(e.target.value)}
                         />
                     </div>
                 </div>
 
                 {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
 
                 <button
                     onClick={handleLogin}
                     disabled={loading || !passcode.trim()}
                     className="w-full bg-red-600 hover:bg-red-500 text-white px-4 py-3 rounded-xl transition-all shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                 >
                     <LogIn className="w-5 h-5" />
                     <span>{loading ? 'Signing in...' : 'Login as Admin'}</span>
                 </button>
             </div>
         </div>
     );
 }
