
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Copy, GripVertical, Layers, Sparkles, X, ListFilter, Wand2, PencilLine, Languages, ArrowDown, RefreshCw } from 'lucide-react';
import { BuilderBlock } from '../types';
import { TRANSLATIONS } from '../translations';
import { translateText } from '../services/translateService';

interface BuilderPanelProps {
  blocks: BuilderBlock[];
  setBlocks: React.Dispatch<React.SetStateAction<BuilderBlock[]>>;
  tagOrder: string[];
  onAutoGenerate: () => void;
  onBlockClick: (originalId: string, tag: string) => void;
  // New Delete Handlers
  onRemoveBlock: (instanceId: string) => void;
  onClearBlocks: () => void;
  t: typeof TRANSLATIONS.en;
}

export const BuilderPanel: React.FC<BuilderPanelProps> = ({ 
  blocks, 
  setBlocks, 
  tagOrder, 
  onAutoGenerate, 
  onBlockClick, 
  onRemoveBlock, 
  onClearBlocks,
  t 
}) => {
  
  const finalPrompt = blocks.map(b => b.content).filter(Boolean).join(', ');
  
  // Translation Modal State
  const [isTranslateModalOpen, setIsTranslateModalOpen] = useState(false);
  const [currentTranslation, setCurrentTranslation] = useState(''); // En -> Zh result
  const [isTranslating, setIsTranslating] = useState(false);

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
    onClearBlocks();
  };

  const removeBlock = (instanceId: string) => {
    onRemoveBlock(instanceId);
  };

  const updateBlockContent = (instanceId: string, newContent: string) => {
    setBlocks(prev => prev.map(b => 
      b.instanceId === instanceId ? { ...b, content: newContent } : b
    ));
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

  // Translation Handlers
  const openTranslationModal = async () => {
    setIsTranslateModalOpen(true);
    // Auto translate current prompt to Chinese for verification
    if (finalPrompt) {
        setIsTranslating(true);
        const result = await translateText(finalPrompt, 'en', 'zh');
        setCurrentTranslation(result);
        setIsTranslating(false);
    } else {
        setCurrentTranslation('');
    }
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
            <div className="space-y-3 max-w-6xl mx-auto pb-20">
              {blocks.map(block => (
                <SortableItem 
                  key={block.instanceId} 
                  block={block} 
                  onRemove={() => removeBlock(block.instanceId)}
                  onUpdate={(content) => updateBlockContent(block.instanceId, content)}
                  onClick={() => onBlockClick(block.id, block.tag)}
                />
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
                onClick={openTranslationModal}
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs font-bold transition-colors border border-zinc-700"
                title={t.translate}
             >
                <Languages className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.translate}</span>
             </button>

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

      {/* Translation Modal - Using Portal to fix Z-Index issues */}
      {isTranslateModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] overflow-y-auto font-sans">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setIsTranslateModalOpen(false)} />

            {/* Modal Wrapper for Centering and Scrolling */}
            <div className="flex min-h-full items-center justify-center p-4 text-center pointer-events-none">
                {/* Modal Content */}
                <div className="relative w-full max-w-2xl transform overflow-hidden rounded-xl bg-zinc-900 border border-zinc-700 text-left shadow-2xl transition-all flex flex-col max-h-[85vh] pointer-events-auto">
                    {/* Header */}
                    <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950 shrink-0">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Languages className="w-5 h-5 text-indigo-400" />
                            {t.translateModalTitle}
                        </h3>
                        <button onClick={() => setIsTranslateModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body - Scrollable */}
                    <div className="p-6 overflow-y-auto">
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-l-2 border-indigo-500 pl-2">
                                {t.verifyMeaning}
                            </h4>
                            <div className="space-y-3">
                                <div className="bg-black/40 p-3 rounded border border-zinc-800 text-xs text-zinc-500 font-mono break-words whitespace-pre-wrap">
                                    {finalPrompt || "(Empty Prompt)"}
                                </div>
                                <div className="flex justify-center">
                                    <ArrowDown className="w-4 h-4 text-zinc-600" />
                                </div>
                                <div className="bg-indigo-900/20 p-3 rounded border border-indigo-500/30 text-sm text-indigo-200 min-h-[60px] break-words whitespace-pre-wrap">
                                    {isTranslating && !currentTranslation ? (
                                        <span className="flex items-center gap-2 animate-pulse">
                                            <RefreshCw className="w-3 h-3 animate-spin" /> {t.translating}
                                        </span>
                                    ) : (
                                        currentTranslation || "..."
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer - Sticky */}
                    <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex justify-end shrink-0">
                        <button 
                            onClick={() => setIsTranslateModalOpen(false)}
                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-sm transition-colors"
                        >
                            {t.close}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
      )}
    </div>
  );
};

interface SortableItemProps {
  block: BuilderBlock;
  onRemove: () => void;
  onUpdate: (newContent: string) => void;
  onClick: () => void;
}

const SortableItem: React.FC<SortableItemProps> = ({ block, onRemove, onUpdate, onClick }) => {
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

  // Auto-resize textarea
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };
  
  useEffect(() => {
    // Small delay to ensure DOM is fully rendered before calculating scrollHeight
    // This fixes issue where new blocks are added with collapsed height
    const timer = setTimeout(() => {
        adjustHeight();
    }, 0);
    return () => clearTimeout(timer);
  }, [block.content]);

  const handleContainerClick = (e: React.MouseEvent) => {
      // Don't trigger if user is interacting with the textarea or buttons
      const target = e.target as HTMLElement;
      if (target.tagName === 'TEXTAREA' || target.closest('button')) {
          return;
      }
      onClick();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleContainerClick}
      className={`relative group flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${isDragging ? 'bg-indigo-900/20 border-indigo-500 shadow-xl scale-[1.02]' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900'}`}
    >
      <div 
        {...attributes} 
        {...listeners} 
        className="mt-1 text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing shrink-0"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
                 <span className="shrink-0 text-[10px] bg-zinc-900 text-zinc-500 border border-zinc-800 px-1.5 rounded select-none">{block.tag}</span>
                 <span className="font-semibold text-zinc-200 text-sm select-none">{block.name}</span>
            </div>
            <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className="text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
        
        {/* Editable Content Area */}
        <div className="relative group/edit">
            <textarea
                ref={textareaRef}
                value={block.content}
                onChange={(e) => onUpdate(e.target.value)}
                className="w-full bg-transparent border border-transparent hover:border-zinc-800 focus:border-indigo-500 rounded p-1.5 -ml-1.5 text-zinc-300 text-sm font-mono leading-relaxed resize-none focus:outline-none focus:bg-zinc-900 transition-colors overflow-hidden pr-8"
                spellCheck={false}
                rows={1}
            />
            <PencilLine className="w-3 h-3 text-zinc-600 absolute right-2 bottom-2 opacity-0 group-hover/edit:opacity-100 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};
