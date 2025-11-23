import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Copy, Trash, GripVertical, Layers, Sparkles, X, ListFilter, Wand2 } from 'lucide-react';
import { BuilderBlock } from '../types';
import { TRANSLATIONS } from '../translations';

interface BuilderPanelProps {
  blocks: BuilderBlock[];
  setBlocks: React.Dispatch<React.SetStateAction<BuilderBlock[]>>;
  tagOrder: string[];
  onAutoGenerate: () => void;
  t: typeof TRANSLATIONS.en;
}

export const BuilderPanel: React.FC<BuilderPanelProps> = ({ blocks, setBlocks, tagOrder, onAutoGenerate, t }) => {
  
  const finalPrompt = blocks.map(b => b.content).filter(Boolean).join(', ');

  const handleCopy = () => {
    navigator.clipboard.writeText(finalPrompt);
    // Simple visual feedback
    const btn = document.getElementById('copy-btn');
    if(btn) {
       const originalText = btn.innerHTML;
       btn.innerHTML = `<span class="flex items-center gap-2">${t.copied}</span>`;
       setTimeout(() => btn.innerHTML = originalText, 1500);
    }
  };

  const handleClear = () => {
    // Removed confirm dialog to fix potential sandbox blocking issues
    setBlocks([]);
  };

  const removeBlock = (instanceId: string) => {
    setBlocks(prev => prev.filter(b => b.instanceId !== instanceId));
  };

  const handleSortByTags = () => {
    setBlocks(prev => {
        const sorted = [...prev].sort((a, b) => {
            // If tag is missing from order, put it at the end
            const indexA = tagOrder.indexOf(a.tag);
            const indexB = tagOrder.indexOf(b.tag);
            const safeIndexA = indexA === -1 ? 9999 : indexA;
            const safeIndexB = indexB === -1 ? 9999 : indexB;
            return safeIndexA - safeIndexB;
        });
        return sorted;
    });
  };

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950 z-10">
        <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-500" />
          {t.promptBuilder}
        </h2>
        <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 mr-2">{blocks.length} {t.blocksCount}</span>
            
            <button
                type="button"
                onClick={onAutoGenerate}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-900/50 rounded text-xs transition-all hover:shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                title={t.autoTooltip}
            >
                <Wand2 className="w-3.5 h-3.5" />
                {t.auto}
            </button>

            <button 
                type="button"
                onClick={handleSortByTags}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs transition-colors border border-zinc-700"
                title={t.sortTooltip}
            >
                <ListFilter className="w-3.5 h-3.5" />
                {t.sortByTags}
            </button>
            
            <button 
                type="button"
                onClick={handleClear}
                className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded hover:bg-red-900/20 transition-colors border border-transparent hover:border-red-900/30"
                title={t.clearBtnTitle}
            >
                {t.clear}
            </button>
        </div>
      </div>

      {/* Sortable Drop Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 to-black scrollbar-thin">
        {blocks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-700 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
            <Sparkles className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm font-medium">{t.dragHere}</p>
            <p className="text-xs mt-2 opacity-50">{t.dragHint}</p>
          </div>
        ) : (
          <SortableContext items={blocks.map(b => b.instanceId)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3 max-w-3xl mx-auto pb-20">
              {blocks.map(block => (
                <SortableItem key={block.instanceId} block={block} onRemove={() => removeBlock(block.instanceId)} />
              ))}
            </div>
          </SortableContext>
        )}
      </div>

      {/* Final Output Footer (Sticky) */}
      <div className="h-1/3 min-h-[200px] bg-zinc-900 border-t border-zinc-800 p-4 shadow-2xl z-10 flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{t.finalOutput}</span>
          <div className="flex gap-2">
            <button 
                type="button"
                id="copy-btn"
                onClick={handleCopy}
                disabled={!finalPrompt}
                className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Copy className="w-3 h-3" />
                {t.copyPrompt}
            </button>
          </div>
        </div>
        <textarea 
          readOnly
          value={finalPrompt}
          className="flex-1 w-full bg-black border border-zinc-800 rounded-lg p-4 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500 font-mono resize-none leading-relaxed"
        />
      </div>
    </div>
  );
};

interface SortableItemProps {
  block: BuilderBlock;
  onRemove: () => void;
}

const SortableItem: React.FC<SortableItemProps> = ({ block, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: block.instanceId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group flex items-start gap-3 p-4 rounded-xl border transition-all ${isDragging ? 'bg-indigo-900/20 border-indigo-500 shadow-xl scale-[1.02]' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'}`}
    >
      <div 
        {...attributes} 
        {...listeners} 
        className="mt-1 text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-2">
                 <span className="shrink-0 text-[10px] bg-zinc-900 text-zinc-500 border border-zinc-800 px-1.5 rounded">{block.tag}</span>
                 <span className="font-semibold text-zinc-200 text-sm">{block.name}</span>
            </div>
            <button 
                type="button"
                onClick={onRemove}
                className="text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
        <p className="text-zinc-400 text-sm font-mono leading-tight break-words pr-4">
            {block.content}
        </p>
      </div>
    </div>
  );
};