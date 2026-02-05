'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  Send, Users, BookOpen, Calendar, 
  MessageCircle, Settings, UserPlus, 
  ChevronLeft, MoreHorizontal, Paperclip,
  Share2, Shield, Info, LogOut
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import ErrorLogger from '@/lib/ErrorLogger';

export default function GroupDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [group, setGroup] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [sharedResources, setSharedResources] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'resources' | 'members'>('chat');
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && id) {
      fetchGroupData();
      subscribeToMessages();
    }
  }, [user, id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchGroupData = async () => {
    try {
      // 1. Fetch group info
      const { data: groupData, error: groupError } = await (supabase
        .from('study_groups') as any)
        .select('*')
        .eq('id', id)
        .single();

      if (groupError) throw groupError;
      setGroup(groupData);

      // 2. Fetch members
      const { data: membersData, error: membersError } = await (supabase
        .from('group_members') as any)
        .select(`
          user_id,
          role,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('group_id', id);

      if (membersError) throw membersError;
      setMembers(membersData);

      // 3. Fetch messages
      const { data: messagesData, error: messagesError } = await (supabase
        .from('group_messages') as any)
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .eq('group_id', id)
        .order('created_at', { ascending: true })
        .limit(50);

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);

      // 4. Fetch shared resources
      const { data: resourcesData, error: resourcesError } = await (supabase
        .from('group_shared_resources') as any)
        .select('*')
        .eq('group_id', id)
        .order('shared_at', { ascending: false });

      if (resourcesError) throw resourcesError;
      setSharedResources(resourcesData || []);

    } catch (error) {
      ErrorLogger.error('Error fetching group data', error);
      router.push('/groups');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`group-${id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'group_messages',
        filter: `group_id=eq.${id}`
      }, async (payload) => {
        // Fetch the profile for the new message
        const { data: profile } = await (supabase
          .from('profiles') as any)
          .select('full_name, avatar_url')
          .eq('id', payload.new.user_id)
          .single();

        const newMessageWithProfile = {
          ...payload.new,
          profiles: profile
        };
        
        setMessages(prev => [...prev, newMessageWithProfile]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !id) return;

    const messageContent = newMessage;
    setNewMessage('');

    try {
      const { error } = await (supabase
        .from('group_messages') as any)
        .insert([{
          group_id: id as string,
          user_id: user.id,
          content: messageContent
        }]);

      if (error) throw error;
    } catch (error) {
      ErrorLogger.error('Error sending message', error);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Sidebar - Mobile/Desktop Navigation */}
      <div className="w-80 hidden lg:flex flex-col border-r border-white/5 bg-slate-900/50">
        <div className="p-6 border-b border-white/5">
          <button 
            onClick={() => router.push('/groups')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Groups
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
              {group?.name?.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{group?.name}</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{members.length} Members</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'chat' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-white/5'}`}
          >
            <MessageCircle className="w-5 h-5" />
            Group Chat
          </button>
          <button 
            onClick={() => setActiveTab('resources')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'resources' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-white/5'}`}
          >
            <BookOpen className="w-5 h-5" />
            Shared Resources
          </button>
          <button 
            onClick={() => setActiveTab('members')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'members' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-white/5'}`}
          >
            <Users className="w-5 h-5" />
            Member List
          </button>
        </div>

        <div className="p-4 border-t border-white/5">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all">
            <LogOut className="w-5 h-5" />
            Leave Group
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Header (Mobile + Actions) */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-10">
          <div className="flex items-center gap-4 lg:hidden">
             <button onClick={() => router.push('/groups')}><ChevronLeft className="w-6 h-6 text-white" /></button>
             <h2 className="text-lg font-bold text-white truncate max-w-[150px]">{group?.name}</h2>
          </div>
          
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{activeTab}</span>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-colors">
              <UserPlus className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'chat' && (
            <div className="flex flex-col h-full">
              {/* Messages Area */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6"
              >
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full opacity-30 text-center px-12">
                    <MessageCircle className="w-16 h-16 mb-4" />
                    <p className="text-xl font-bold text-white">No messages yet</p>
                    <p className="text-sm text-slate-400">Be the first one to say hi to the group!</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isOwn = msg.user_id === user?.id;
                    return (
                      <div key={msg.id || idx} className={`flex gap-4 ${isOwn ? 'flex-row-reverse' : ''}`}>
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {msg.profiles?.avatar_url ? (
                            <img src={msg.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-bold text-white">
                              {msg.profiles?.full_name?.substring(0, 1) || '?'}
                            </span>
                          )}
                        </div>
                        <div className={`max-w-[70%] space-y-1 ${isOwn ? 'items-end' : ''}`}>
                          <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                            <span className="text-xs font-bold text-white">{msg.profiles?.full_name || 'User'}</span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className={`p-4 rounded-2xl text-sm ${isOwn ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white/5 text-slate-200 rounded-tl-none border border-white/5'}`}>
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input Area */}
              <div className="p-6 bg-slate-900/80 border-t border-white/5">
                <form onSubmit={handleSendMessage} className="flex gap-4 items-center max-w-5xl mx-auto w-full">
                  <button type="button" className="p-3 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-colors">
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <div className="flex-1 relative">
                    <input 
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="p-8 h-full overflow-y-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">Shared Resources</h3>
                  <p className="text-slate-400">Notes, study plans, and external links shared by members.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all border border-white/10">
                  <Share2 className="w-4 h-4" />
                  Share Resource
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sharedResources.length === 0 ? (
                  <div className="col-span-full py-20 text-center glass-card border-dashed">
                    <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold">No resources shared yet</p>
                    <p className="text-xs text-slate-500 mt-1">Start sharing your notes or plans to help the group!</p>
                  </div>
                ) : (
                  sharedResources.map(resource => (
                    <div key={resource.id} className="glass-card p-4 flex items-center gap-4 hover:border-indigo-500/50 transition-all cursor-pointer group">
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                        {resource.resource_type === 'note' ? <BookOpen className="w-6 h-6" /> : <Calendar className="w-6 h-6" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-white group-hover:text-indigo-400 transition-colors">{resource.title}</h4>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">{resource.resource_type}</p>
                      </div>
                      <MoreHorizontal className="w-5 h-5 text-slate-500" />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="p-8 h-full overflow-y-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">Group Members</h3>
                  <p className="text-slate-400">Everyone who has access to this study group.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20">
                  <UserPlus className="w-4 h-4" />
                  Invite Member
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map((member, idx) => (
                  <div key={idx} className="glass-card p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center overflow-hidden">
                      {member.profiles?.avatar_url ? (
                        <img src={member.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-white">
                          {member.profiles?.full_name?.substring(0, 1) || '?'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-white">{member.profiles?.full_name || 'Anonymous'}</h4>
                      <div className="flex items-center gap-2">
                        {member.role === 'admin' && <Shield className="w-3 h-3 text-indigo-400" />}
                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{member.role}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
