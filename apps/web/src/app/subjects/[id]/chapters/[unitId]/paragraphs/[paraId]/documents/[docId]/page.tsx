'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { dub5ai, AIMessage } from '@/lib/dub5ai';
import { ArrowLeft, FileText, FileCode, Video, Image as ImageIcon, File, MonitorPlay, ExternalLink, MessageSquare, Send, Bot, User, Sparkles, Loader2, X } from 'lucide-react';

type DocumentItem = {
  id: string;
  title: string;
  document_type: 'smart_note' | 'html' | 'video' | 'image' | 'pdf' | 'powerpoint' | 'txt';
  content: any;
  created_at: string;
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const subjectId = params.id as string;
  const unitId = params.unitId as string;
  const paraId = params.paraId as string;
  const docId = params.docId as string;

  const [document, setDocument] = useState<DocumentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAIChat, setShowAIChat] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (showAIChat) {
      scrollToBottom();
    }
  }, [messages, showAIChat]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userContent = input.trim();
    setInput('');
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: userContent }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const contextMessages: AIMessage[] = [
        { 
          role: 'system', 
          content: `You are an AI Study Assistant. You are helping the user with a specific document titled "${document?.title}". 
          The document type is ${document?.document_type}.
          
          Document Content:
          ${document?.document_type === 'txt' ? document.content.text : 
            document?.document_type === 'html' ? document.content.html : 
            'This is a visual/media document. Answer questions based on the title and general knowledge of the topic.'}
          
          Provide helpful, educational answers based on this context.`
        },
        ...newMessages.map(m => ({ role: m.role, content: m.content }))
      ];

      let fullContent = '';
      const tempId = Date.now().toString();
      
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      await dub5ai.chat(contextMessages, (chunk) => {
        fullContent += chunk;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: fullContent };
          return updated;
        });
      });

    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const { data, error } = await (supabase.from('documents') as any)
          .select('*')
          .eq('id', docId)
          .single();

        if (error) throw error;
        setDocument(data);
      } catch (error) {
        console.error('Error fetching document:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [docId]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        Document not found
      </div>
    );
  }

  const renderContent = () => {
    const { document_type, content } = document;
    
    // Safety check for content
    if (!content) return <div className="text-slate-400">No content available</div>;

    switch (document_type) {
      case 'html':
        return (
          <div 
            className="prose prose-invert max-w-none bg-white/5 p-6 rounded-xl"
            dangerouslySetInnerHTML={{ __html: content.html || '' }} 
          />
        );
      
      case 'txt':
        return (
          <div className="bg-white/5 p-6 rounded-xl font-mono text-sm text-slate-300 whitespace-pre-wrap">
            {content.text || ''}
          </div>
        );

      case 'image':
        return (
          <div className="flex justify-center bg-black/20 rounded-xl overflow-hidden">
            <img 
              src={content.url} 
              alt={document.title} 
              className="max-w-full max-h-[70vh] object-contain"
            />
          </div>
        );

      case 'video':
        // Simple check for YouTube/Vimeo
        // This is a basic implementation. Robust parsing would be better.
        const isYoutube = content.url?.includes('youtube.com') || content.url?.includes('youtu.be');
        const isVimeo = content.url?.includes('vimeo.com');

        if (isYoutube) {
            let embedUrl = content.url;
            if (content.url.includes('watch?v=')) {
                embedUrl = content.url.replace('watch?v=', 'embed/');
            } else if (content.url.includes('youtu.be/')) {
                embedUrl = content.url.replace('youtu.be/', 'www.youtube.com/embed/');
            }
            return (
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                    <iframe 
                        src={embedUrl} 
                        className="w-full h-full" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                    />
                </div>
            );
        }
        
        if (isVimeo) {
            // Need to handle vimeo ID extraction properly for embed
            // For now, simple fallback or try to construct embed
            const vimeoId = content.url.split('/').pop();
            return (
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                    <iframe 
                        src={`https://player.vimeo.com/video/${vimeoId}`} 
                        className="w-full h-full" 
                        allow="autoplay; fullscreen; picture-in-picture" 
                        allowFullScreen
                    />
                </div>
            );
        }

        // Default video tag for direct links
        return (
          <div className="flex justify-center bg-black/20 rounded-xl overflow-hidden">
            <video 
              src={content.url} 
              controls 
              className="max-w-full max-h-[70vh]"
            />
          </div>
        );

      case 'pdf':
      case 'powerpoint':
        // Use Google Docs Viewer
        const encodedUrl = encodeURIComponent(content.url);
        return (
          <div className="w-full h-[80vh] bg-white rounded-xl overflow-hidden">
             <iframe 
               src={`https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`}
               className="w-full h-full border-0"
             />
          </div>
        );

      case 'smart_note':
      default:
        // Fallback for smart notes or unknown types
        return (
          <div className="bg-white/5 p-6 rounded-xl text-slate-300">
             {/* If smart note has specific structure, render it here. For now JSON dump or text */}
             <pre className="whitespace-pre-wrap font-mono text-xs">
               {JSON.stringify(content, null, 2)}
             </pre>
          </div>
        );
    }
  };

  const getIcon = () => {
    switch (document.document_type) {
      case 'html': return <FileCode className="w-6 h-6 text-orange-400" />;
      case 'video': return <Video className="w-6 h-6 text-red-400" />;
      case 'image': return <ImageIcon className="w-6 h-6 text-purple-400" />;
      case 'pdf': return <File className="w-6 h-6 text-red-400" />;
      case 'powerpoint': return <MonitorPlay className="w-6 h-6 text-orange-400" />;
      case 'txt': return <FileText className="w-6 h-6 text-slate-400" />;
      default: return <FileText className="w-6 h-6 text-blue-400" />;
    }
  };

  return (
    <div className="h-full p-8 relative overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => router.push(`/subjects/${subjectId}/chapters/${unitId}/paragraphs/${paraId}/documents`)}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Documents</span>
        </button>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
              {getIcon()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">{document.title}</h1>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                 <span className="capitalize">{document.document_type.replace('_', ' ')}</span>
                 <span>•</span>
                 <span>{new Date(document.created_at).toLocaleDateString()}</span>
                 {document.content?.url && (
                   <>
                     <span>•</span>
                     <a 
                       href={document.content.url} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="flex items-center gap-1 hover:text-blue-400 transition-colors"
                     >
                       <span>Open Original</span>
                       <ExternalLink className="w-3 h-3" />
                     </a>
                   </>
                 )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowAIChat(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm font-bold">Chat with AI</span>
          </button>
        </div>

        <div className="glass-card p-1 border border-white/10">
           {renderContent()}
        </div>

        {/* AI Chat Overlay/Drawer */}
        {showAIChat && (
          <div className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-slate-900 border-l border-white/10 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-800/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">AI Study Assistant</h3>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Document Chat</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAIChat(false)}
                className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-blue-400" />
                  </div>
                  <h4 className="text-white font-bold mb-2">Ask about this document</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    I can help you summarize this document, explain complex concepts, or answer specific questions based on the content.
                  </p>
                </div>
              ) : (
                messages.map((m, idx) => (
                  <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                      m.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-white/5 text-slate-200 border border-white/5 rounded-tl-none'
                    }`}>
                      {m.content || (
                        <div className="flex gap-1 py-1">
                          <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" />
                          <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-white/5 bg-slate-800/30">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="p-2 bg-blue-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500 transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
