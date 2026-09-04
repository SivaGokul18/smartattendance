import React, { useState } from 'react';
import { X, Copy, Check, Sparkles, Search, Filter } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { promptKitItems, PromptKitItem } from '../../lib/prompt-kit-data';

export const PromptKitDrawer: React.FC = () => {
  const { isPromptKitOpen, setPromptKitOpen } = useAppStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!isPromptKitOpen) return null;

  const categories = ['All', 'System', 'Admin', 'Faculty', 'Student', 'Shared'];

  const filteredItems = promptKitItems.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopy = (item: PromptKitItem) => {
    navigator.clipboard.writeText(item.prompt);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl h-full bg-white border-l border-slate-200 shadow-2xl flex flex-col p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/20">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Prompt Kit & Specs</h3>
              <p className="text-xs text-slate-500">Copy-paste ready UI generator prompts</p>
            </div>
          </div>
          <button
            onClick={() => setPromptKitOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search & Filter */}
        <div className="py-4 space-y-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search screens, components, prompts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 transition"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <Filter size={13} className="text-slate-400 mr-1 shrink-0" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-md transition group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                    {item.code}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                </div>
                <button
                  onClick={() => handleCopy(item)}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    copiedId === item.id
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-200'
                  }`}
                >
                  {copiedId === item.id ? (
                    <>
                      <Check size={12} /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={12} /> Copy Prompt
                    </>
                  )}
                </button>
              </div>

              <pre className="text-xs text-slate-700 font-sans whitespace-pre-wrap bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed selection:bg-indigo-100">
                {item.prompt}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
