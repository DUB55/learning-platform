import React from 'react';
import { X, Book, Check, Search } from 'lucide-react';

export type Book = {
  id: string;
  title: string;
  author: string;
  coverColor: string;
};

interface BookManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  selectedBookIds: string[];
  onToggleBook: (bookId: string) => void;
}

export default function BookManagerModal({
  isOpen,
  onClose,
  books,
  selectedBookIds,
  onToggleBook
}: BookManagerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#0f1117] w-full max-w-2xl rounded-2xl border border-white/10 flex flex-col shadow-2xl max-h-[80vh]">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Book className="w-5 h-5 text-blue-400" />
              Manage Books
            </h2>
            <p className="text-sm text-slate-400 mt-1">Select books to include in this subject</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search available books..." 
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {books.map(book => {
              const isSelected = selectedBookIds.includes(book.id);
              return (
                <button
                  key={book.id}
                  onClick={() => onToggleBook(book.id)}
                  className={`relative group flex items-start gap-4 p-4 rounded-xl border transition-all text-left ${
                    isSelected 
                      ? 'bg-blue-600/10 border-blue-500/50' 
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className={`w-16 h-20 rounded-lg shadow-lg shrink-0 ${book.coverColor} flex items-center justify-center`}>
                    <Book className="w-6 h-6 text-white/50" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium truncate ${isSelected ? 'text-blue-400' : 'text-white'}`}>
                      {book.title}
                    </h3>
                    <p className="text-sm text-slate-500 truncate">{book.author}</p>
                    
                    <div className="mt-3 flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected 
                          ? 'bg-blue-500 border-blue-500' 
                          : 'border-slate-600 group-hover:border-slate-500'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-xs ${isSelected ? 'text-blue-400' : 'text-slate-500'}`}>
                        {isSelected ? 'Selected' : 'Select'}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6 border-t border-white/10 bg-white/5 rounded-b-2xl flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}