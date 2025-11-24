
import React, { useState, useEffect, useMemo } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  DragStartEvent, 
  DragEndEvent, 
  DragOverEvent,
  useSensor, 
  useSensors, 
  PointerSensor,
  closestCenter,
  defaultDropAnimationSideEffects,
  DropAnimation,
  useDroppable
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Undo2 } from 'lucide-react';
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
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
       if (builderBlocks.some(b => b.id === block.id)) return;

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
    // Snapshot current builder state before auto-gen? 
    // Usually 'Auto' is destructive, let's treat it like a Clear+Add, so we save state.
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
      <div className="flex h-screen bg-black text-zinc-100 overflow-hidden font-sans relative">
        {/* Left Panel: Library */}
        <div className="w-full md:w-[400px] lg:w-[450px] flex-shrink-0 relative z-20 shadow-2xl">
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
          />
        </div>

        {/* Right Panel: Builder Area */}
        <div className="flex-1 relative z-10 min-w-0">
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

        {/* Toast Notification */}
        <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[100] transition-all duration-300 ${showToast ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
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
    <div ref={setDropRef} className="h-full">
      <BuilderPanel {...props} />
    </div>
  )
}

export default App;
