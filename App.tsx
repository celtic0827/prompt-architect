
import React, { useState, useEffect, useMemo } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  DragStartEvent, 
  DragEndEvent, 
  DragOverEvent,
  useSensor, 
  useSensors, 
  MouseSensor,
  TouchSensor,
  closestCenter,
  defaultDropAnimationSideEffects,
  DropAnimation,
  useDroppable
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Undo2, Library, Layers } from 'lucide-react';
import { LibraryPanel } from './components/LibraryPanel';
import { BuilderPanel } from './components/BuilderPanel';
import { PromptBlock, BuilderBlock } from './types';
import { DEFAULT_PROMPTS } from './constants';
import { TRANSLATIONS, Language } from './translations';

const STORAGE_KEYS = {
  BLOCKS: 'prompt-architect-blocks',
  TAGS: 'prompt-architect-tags'
};

// Define Undo Snapshot Types
type UndoSnapshot = 
  | { type: 'library'; data: PromptBlock[] }
  | { type: 'builder'; data: BuilderBlock[] };

const App: React.FC = () => {
  // Initialize from LocalStorage or use defaults
  const [libraryBlocks, setLibraryBlocks] = useState<PromptBlock[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BLOCKS);
      return saved ? JSON.parse(saved) : DEFAULT_PROMPTS;
    } catch (e) {
      console.error("Failed to load blocks from storage", e);
      return DEFAULT_PROMPTS;
    }
  });

  // Initialize Tag Order from LocalStorage or use defaults
  const [tagOrder, setTagOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TAGS);
      const defaultTags = ['Subject', 'Style', 'View', 'Lighting', 'Quality'];
      return saved ? JSON.parse(saved) : defaultTags;
    } catch (e) {
      return ['Subject', 'Style', 'View', 'Lighting', 'Quality'];
    }
  });

  const [builderBlocks, setBuilderBlocks] = useState<BuilderBlock[]>([]);
  const [activeDragItem, setActiveDragItem] = useState<PromptBlock | null>(null);
  
  // Library Navigation State
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [highlightedLibraryId, setHighlightedLibraryId] = useState<string | null>(null);

  // Mobile Tab State ('library' or 'builder')
  const [activeMobileTab, setActiveMobileTab] = useState<'library' | 'builder'>('library');

  // Language State
  const [language, setLanguage] = useState<Language>('en');
  const t = TRANSLATIONS[language];

  // Undo / Toast State
  const [undoSnapshot, setUndoSnapshot] = useState<UndoSnapshot | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Persistence Effects
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BLOCKS, JSON.stringify(libraryBlocks));
    } catch (e) {
      console.error("Failed to save blocks", e);
    }
  }, [libraryBlocks]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(tagOrder));
    } catch (e) {
      console.error("Failed to save tag order", e);
    }
  }, [tagOrder]);

  // Sync tagOrder with blocks
  useEffect(() => {
    setTagOrder(prevOrder => {
      const currentUniqueTags = Array.from(new Set(libraryBlocks.map(b => b.tag))).sort();
      const preservedOrder = prevOrder.filter(t => currentUniqueTags.includes(t));
      const newTags = currentUniqueTags.filter(t => !prevOrder.includes(t));
      const finalOrder = [...preservedOrder, ...newTags];
      
      if (JSON.stringify(finalOrder) === JSON.stringify(prevOrder)) return prevOrder;
      return finalOrder;
    });
  }, [libraryBlocks]);

  const usedBlockIds = useMemo(() => {
    return new Set(builderBlocks.map(b => b.id));
  }, [builderBlocks]);

  // Sensors config: Separating Mouse and Touch to enable better mobile scrolling vs dragging
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10, // Require slight movement to start drag
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // Press and hold for 250ms to drag on mobile
        tolerance: 5, // Allow slight movement during hold
      },
    })
  );

  // --- Undo / Toast Logic ---
  const triggerToast = (msg: string, snapshot: UndoSnapshot) => {
    setUndoSnapshot(snapshot);
    setToastMessage(msg);
    setShowToast(true);
    // Auto hide after 5 seconds
    const timer = setTimeout(() => setShowToast(false), 5000);
    return () => clearTimeout(timer);
  };

  const handleUndo = () => {
    if (!undoSnapshot) return;
    
    if (undoSnapshot.type === 'library') {
      setLibraryBlocks(undoSnapshot.data);
    } else if (undoSnapshot.type === 'builder') {
      setBuilderBlocks(undoSnapshot.data);
    }
    
    setShowToast(false);
    setUndoSnapshot(null);
  };

  // --- Deletion Handlers (Passed to children) ---
  
  const handleDeleteLibraryBlock = (id: string) => {
    triggerToast(t.deleted, { type: 'library', data: [...libraryBlocks] });
    setLibraryBlocks(prev => prev.filter(b => b.id !== id));
  };

  const handleBulkDeleteLibraryBlocks = (ids: Set<string>) => {
    triggerToast(t.deleted, { type: 'library', data: [...libraryBlocks] });
    setLibraryBlocks(prev => prev.filter(b => !ids.has(b.id)));
  };

  const handleRemoveBuilderBlock = (instanceId: string) => {
    triggerToast(t.deleted, { type: 'builder', data: [...builderBlocks] });
    setBuilderBlocks(prev => prev.filter(b => b.instanceId !== instanceId));
  };

  const handleClearBuilder = () => {
    if (builderBlocks.length === 0) return;
    triggerToast(t.deleted, { type: 'builder', data: [...builderBlocks] });
    setBuilderBlocks([]);
  };

  // --- Direct Add Handler (For Mobile Tap or "+" Button) ---
  const handleDirectAddToBuilder = (block: PromptBlock) => {
     const newBlock: BuilderBlock = {
       ...block,
       instanceId: `${block.id}-${Date.now()}`
     };
     setBuilderBlocks(prev => [...prev, newBlock]);
  };

  // --- Drag Handlers ---

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeData = active.data.current;
    if (activeData?.type === 'library-item') {
      setActiveDragItem(activeData.block as PromptBlock);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {};

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    const activeType = active.data.current?.type;

    if (activeType === 'tag' && activeId !== overId) {
      setTagOrder((items) => {
        const oldIndex = items.indexOf(activeId as string);
        const newIndex = items.indexOf(overId as string);
        return arrayMove(items, oldIndex, newIndex);
      });
      return;
    }

    const isLibraryItem = activeType === 'library-item';
    const isOverBuilderContext = typeof overId === 'string' && (builderBlocks.some(b => b.instanceId === overId) || overId === 'builder-area');

    if (isLibraryItem && isOverBuilderContext) {
       const block = active.data.current?.block as PromptBlock;
       const newBlock: BuilderBlock = {
         ...block,
         instanceId: `${block.id}-${Date.now()}`
       };
       
       setBuilderBlocks((prev) => {
         const overIndex = prev.findIndex(b => b.instanceId === overId);
         if (overIndex >= 0) {
           const newItems = [...prev];
           newItems.splice(overIndex, 0, newBlock);
           return newItems;
         }
         return [...prev, newBlock];
       });
       return;
    }

    if (!isLibraryItem && activeId !== overId && activeType !== 'tag') {
      setBuilderBlocks((items) => {
        const oldIndex = items.findIndex((item) => item.instanceId === activeId);
        const newIndex = items.findIndex((item) => item.instanceId === overId);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAutoGenerate = () => {
    triggerToast(t.auto, { type: 'builder', data: [...builderBlocks] });
    
    const newBlocks: BuilderBlock[] = [];
    tagOrder.forEach(tag => {
      const candidates = libraryBlocks.filter(b => b.tag === tag);
      if (candidates.length > 0) {
        const randomBlock = candidates[Math.floor(Math.random() * candidates.length)];
        newBlocks.push({
          ...randomBlock,
          instanceId: `${randomBlock.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        });
      }
    });
    setBuilderBlocks(newBlocks);
  };

  const handleBuilderBlockClick = (originalId: string, tag: string) => {
    setActiveTag(tag);
    setHighlightedLibraryId(originalId);
    
    // On Mobile, switch to Library tab to show the highlight
    if (window.innerWidth < 768) {
        setActiveMobileTab('library');
    }

    setTimeout(() => {
        setHighlightedLibraryId(null);
    }, 1000);
  };

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: { opacity: '0.5' },
      },
    }),
  };

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {/* Main Layout: Flex Col on Mobile, Flex Row on Desktop, fixed height for mobile browsers */}
      <div className="flex flex-col md:flex-row h-[100dvh] bg-black text-zinc-100 overflow-hidden font-sans relative">
        
        {/* Left Panel: Library */}
        <div className={`
            w-full md:w-[400px] lg:w-[450px] flex-shrink-0 relative z-20 shadow-2xl bg-zinc-900 border-r border-zinc-800
            ${activeMobileTab === 'library' ? 'flex-1 flex overflow-hidden' : 'hidden md:flex'}
        `}>
          <LibraryPanel 
            blocks={libraryBlocks} 
            setBlocks={setLibraryBlocks} 
            tags={tagOrder}
            usedBlockIds={usedBlockIds}
            language={language}
            setLanguage={setLanguage}
            t={t}
            activeTag={activeTag}
            setActiveTag={setActiveTag}
            highlightedBlockId={highlightedLibraryId}
            onDeleteBlock={handleDeleteLibraryBlock}
            onBulkDeleteBlocks={handleBulkDeleteLibraryBlocks}
            onAddToBuilder={handleDirectAddToBuilder}
          />
        </div>

        {/* Right Panel: Builder Area */}
        <div className={`
            flex-1 relative z-10 min-w-0
            ${activeMobileTab === 'builder' ? 'flex-1 flex overflow-hidden' : 'hidden md:flex'}
        `}>
          <BuilderDropArea 
            blocks={builderBlocks} 
            setBlocks={setBuilderBlocks} 
            tagOrder={tagOrder}
            onAutoGenerate={handleAutoGenerate}
            onBlockClick={handleBuilderBlockClick}
            onRemoveBlock={handleRemoveBuilderBlock}
            onClearBlocks={handleClearBuilder}
            t={t}
          />
        </div>

        {/* Mobile Bottom Navigation Bar - Fixed */}
        <div className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-zinc-950 border-t border-zinc-800 flex items-center justify-around z-50 safe-area-bottom shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
           <button 
             onClick={() => setActiveMobileTab('library')}
             className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeMobileTab === 'library' ? 'text-indigo-400' : 'text-zinc-500'}`}
           >
             <Library className="w-5 h-5" />
             <span className="text-[10px] font-medium">{t.library}</span>
           </button>
           
           <button 
             onClick={() => setActiveMobileTab('builder')}
             className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative ${activeMobileTab === 'builder' ? 'text-indigo-400' : 'text-zinc-500'}`}
           >
             <div className="relative">
                <Layers className="w-5 h-5" />
                {builderBlocks.length > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-indigo-600 text-white text-[9px] font-bold px-1 rounded-full min-w-[14px] h-[14px] flex items-center justify-center">
                        {builderBlocks.length}
                    </span>
                )}
             </div>
             <span className="text-[10px] font-medium">{t.promptBuilder}</span>
           </button>
        </div>

        {/* Toast Notification */}
        <div className={`fixed bottom-20 md:bottom-6 left-1/2 transform -translate-x-1/2 z-[100] transition-all duration-300 ${showToast ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
          <div className="bg-zinc-900 border border-zinc-700 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-4 min-w-[300px] justify-between">
            <span className="text-sm font-medium">{toastMessage}</span>
            <button 
              onClick={handleUndo}
              className="text-indigo-400 hover:text-indigo-300 text-sm font-bold uppercase tracking-wide flex items-center gap-1.5 transition-colors"
            >
              <Undo2 className="w-4 h-4" />
              {t.undo}
            </button>
          </div>
        </div>

      </div>

      {/* Drag Overlay */}
      <DragOverlay dropAnimation={dropAnimation}>
        {activeDragItem ? (
          <div className="bg-zinc-800 border border-indigo-500 p-4 rounded-lg shadow-2xl w-[300px] opacity-90 cursor-grabbing">
            <h3 className="font-bold text-white text-sm">{activeDragItem.name}</h3>
            <p className="text-xs text-zinc-400 mt-1 font-mono truncate">{activeDragItem.content}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

const BuilderDropArea = (props: { 
  blocks: BuilderBlock[], 
  setBlocks: React.Dispatch<React.SetStateAction<BuilderBlock[]>>, 
  tagOrder: string[],
  onAutoGenerate: () => void,
  onBlockClick: (id: string, tag: string) => void,
  onRemoveBlock: (id: string) => void,
  onClearBlocks: () => void,
  t: typeof TRANSLATIONS.en
}) => {
  const { setNodeRef: setDropRef } = useDroppable({
    id: 'builder-area',
  });

  return (
    <div ref={setDropRef} className="h-full flex flex-col">
      <BuilderPanel {...props} />
    </div>
  )
}

export default App;
