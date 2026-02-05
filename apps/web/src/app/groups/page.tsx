'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  Users, Plus, Search, MessageSquare, 
  Share2, ArrowRight, Shield, Globe,
  MoreVertical, UserPlus, LogOut, Settings
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import ErrorLogger from '@/lib/ErrorLogger';

export default function GroupsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');

  useEffect(() => {
    if (user) {
      fetchGroups();
    }
  }, [user]);

  const fetchGroups = async () => {
    if (!user) return;
    try {
      // Fetch groups where user is a member
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          group_id,
          study_groups (
            id,
            name,
            description,
            image_url,
            created_at,
            created_by
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setGroups(
        data?.map(d => d.study_groups).filter(Boolean) || []
      );
    } catch (error) {
      ErrorLogger.error('Error fetching groups', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !user) return;

    try {
      // 1. Create group
      const { data: group, error: groupError } = await supabase
        .from('study_groups')
        .insert({
          name: newGroupName,
          description: newGroupDesc,
          created_by: user.id
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // 2. Add creator as admin member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'admin'
        });

      if (memberError) throw memberError;

      setShowCreateModal(false);
      setNewGroupName('');
      setNewGroupDesc('');
      fetchGroups();
      router.push(`/groups/${group.id}`);
    } catch (error) {
      ErrorLogger.error('Error creating group', error);
    }
  };

  return (
    <div className="min-h-screen p-8 lg:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">Study Groups</h1>
            <p className="text-slate-400">Collaborate, share, and learn together with your peers.</p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-5 h-5" />
            Create New Group
          </button>
        </div>

        {/* Search & Filter */}
        <div className="glass-card p-4 mb-8 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              type="text"
              placeholder="Search your groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
        </div>

        {/* Groups Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card h-64 animate-pulse bg-white/5" />
            ))}
          </div>
        ) : groups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups
              .filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((group) => (
              <div 
                key={group.id}
                onClick={() => router.push(`/groups/${group.id}`)}
                className="glass-card p-6 group cursor-pointer hover:border-indigo-500/50 transition-all relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4">
                  {group.created_by === user?.id ? (
                    <Shield className="w-5 h-5 text-indigo-400 opacity-50" />
                  ) : (
                    <Globe className="w-5 h-5 text-slate-500 opacity-30" />
                  )}
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                    {group.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
                      {group.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-widest font-bold">
                      <Users className="w-3 h-3" />
                      Community Group
                    </div>
                  </div>
                </div>

                <p className="text-slate-400 text-sm line-clamp-2 mb-6">
                  {group.description || 'No description provided.'}
                </p>

                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white">
                        U{i}
                      </div>
                    ))}
                    <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
                      +5
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-indigo-400 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-12 text-center">
            <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-indigo-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No Groups Yet</h3>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              You haven't joined any study groups yet. Create your own group or ask a friend for an invite.
            </p>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="px-8 py-4 bg-white text-indigo-900 font-bold rounded-2xl hover:bg-indigo-50 transition-all"
            >
              Start a Group
            </button>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
            <div className="relative glass-card p-8 w-full max-w-md border-indigo-500/30">
              <h2 className="text-2xl font-bold text-white mb-6">Create Study Group</h2>
              <form onSubmit={handleCreateGroup} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Group Name</label>
                  <input 
                    type="text"
                    required
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    placeholder="e.g., AP Physics Study Squad"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Description</label>
                  <textarea 
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 h-32"
                    placeholder="What's this group about?"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-6 py-4 rounded-xl font-bold text-slate-400 hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-6 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
                  >
                    Create Group
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
