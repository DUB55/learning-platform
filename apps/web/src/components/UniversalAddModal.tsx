import React, { useState } from 'react';
import { X, Plus, FileText, Layers, Image, File, Video, Code, BookOpen } from 'lucide-react';

type Tab = 'new' | 'manage' | 'settings';

interface UniversalAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddChapter: () => void;
  onAddParagraph: () => void;
  onAddContent: (type: 'html' | 'video' | 'image' | 'pdf' | 'ppt') => void;
}

export default function UniversalAddModal({ 
  isOpen, 
  onClose,
  onAddChapter,
  onAddParagraph,
  onAddContent
}: UniversalAddModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('new');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#0f1117] w-full max-w-4xl h-[600px] rounded-2xl border border-white/10 flex overflow-hidden shadow-2xl">
        {/* Left Sidebar - Tabs */}
        <div className="w-64 border-r border-white/10 bg-white/5 p-6 flex flex-col gap-2">
          <h2 className="text-xl font-bold text-white mb-6 px-4">Create New</h2>
          
          <button 
            onClick={() => setActiveTab('new')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'new' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Add New</span>
          </button>

          <button 
            onClick={() => setActiveTab('manage')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'manage' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Layers className="w-5 h-5" />
            <span className="font-medium">Manage Structure</span>
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'settings' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </button>
        </div>

        {/* Right Content - Grid */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-bold text-white">
              {activeTab === 'new' && 'What would you like to add?'}
              {activeTab === 'manage' && 'Manage Structure'}
              {activeTab === 'settings' && 'Settings'}
            </h3>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {activeTab === 'new' && (
            <div className="grid grid-cols-3 gap-4">
              {/* Structure */}
              <div className="col-span-3 mb-2">
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Structure</h4>
              </div>
              
              <button 
                onClick={() => { onAddChapter(); onClose(); }}
                className="flex flex-col items-center justify-center p-6 bg-white/5 hover:bg-blue-600/20 border border-white/10 hover:border-blue-500/50 rounded-2xl transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform mb-3">
                  <Layers className="w-6 h-6" />
                </div>
                <span className="text-white font-medium">New Chapter</span>
                <span className="text-xs text-slate-400 mt-1">Add a new unit</span>
              </button>

              <button 
                onClick={() => { onAddParagraph(); onClose(); }}
                className="flex flex-col items-center justify-center p-6 bg-white/5 hover:bg-purple-600/20 border border-white/10 hover:border-purple-500/50 rounded-2xl transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform mb-3">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="text-white font-medium">New Paragraph</span>
                <span className="text-xs text-slate-400 mt-1">Add a subsection</span>
              </button>

              {/* Content Types */}
              <div className="col-span-3 mt-6 mb-2">
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Content</h4>
              </div>

              <button 
                onClick={() => { onAddContent('html'); onClose(); }}
                className="flex flex-col items-center justify-center p-6 bg-white/5 hover:bg-emerald-600/20 border border-white/10 hover:border-emerald-500/50 rounded-2xl transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform mb-3">
                  <Code className="w-6 h-6" />
                </div>
                <span className="text-white font-medium">HTML / Text</span>
              </button>

              <button 
                onClick={() => { onAddContent('video'); onClose(); }}
                className="flex flex-col items-center justify-center p-6 bg-white/5 hover:bg-red-600/20 border border-white/10 hover:border-red-500/50 rounded-2xl transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform mb-3">
                  <Video className="w-6 h-6" />
                </div>
                <span className="text-white font-medium">Video</span>
              </button>

              <button 
                onClick={() => { onAddContent('image'); onClose(); }}
                className="flex flex-col items-center justify-center p-6 bg-white/5 hover:bg-pink-600/20 border border-white/10 hover:border-pink-500/50 rounded-2xl transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform mb-3">
                  <Image className="w-6 h-6" />
                </div>
                <span className="text-white font-medium">Image</span>
              </button>

              <button 
                onClick={() => { onAddContent('pdf'); onClose(); }}
                className="flex flex-col items-center justify-center p-6 bg-white/5 hover:bg-orange-600/20 border border-white/10 hover:border-orange-500/50 rounded-2xl transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform mb-3">
                  <File className="w-6 h-6" />
                </div>
                <span className="text-white font-medium">PDF Document</span>
              </button>

            </div>
          )}

          {activeTab === 'manage' && (
            <div className="text-center text-slate-400 py-12">
              <Layers className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>Structure management coming soon...</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="text-center text-slate-400 py-12">
              <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>Settings coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}