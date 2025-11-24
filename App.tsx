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
import { LibraryPanel } from './components/LibraryPanel';
import { BuilderPanel } from './components/BuilderPanel';
import { PromptBlock, BuilderBlock } from './types';
import { DEFAULT_PROMPTS } from './constants';
import { TRANSLATIONS, Language } from './translations';

const STORAGE_KEYS = {
  BLOCKS: 'prompt-architect-blocks',
  TAGS: 'prompt-architect-tags'
};

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
      // Ensure we have a sensible default if storage is empty
      const defaultTags = ['Subject', 'Style', 'View', 'Lighting', 'Quality'];
      return saved ? JSON.parse(saved) : defaultTags;
    } catch (e) {
      return ['Subject', 'Style', 'View', 'Lighting', 'Quality'];
    }
  });

  const [builderBlocks, setBuilderBlocks] = useState<BuilderBlock[]>([]);
  const [activeDragItem, setActiveDragItem] = useState<PromptBlock | null>(null);
  
  // Library Navigation State (Lifted from LibraryPanel)
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [highlightedLibraryId, setHighlightedLibraryId] = useState<string | null>(null);

  // Language State
  const [language, setLanguage] = useState<Language>('en');
  const t = TRANSLATIONS[language];

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

  // Sync tagOrder with blocks whenever libraryBlocks changes (add new tags found in blocks)
  useEffect(() => {
    setTagOrder(prevOrder => {
      const currentUniqueTags = Array.from(new Set(libraryBlocks.map(b => b.tag))).sort();
      
      // 1. Keep existing tags that are still present, preserving their order
      const preservedOrder = prevOrder.filter(t => currentUniqueTags.includes(t));
      
      // 2. Find any new tags that aren't in the previous order
      const newTags = currentUniqueTags.filter(t => !prevOrder.includes(t));
      
      // 3. Combine: Old Order (filtered) + New Tags
      const finalOrder = [...preservedOrder, ...newTags];
      
      // Simple check to prevent unnecessary state updates if identical
      if (JSON.stringify(finalOrder) === JSON.stringify(prevOrder)) {
        return prevOrder;
      }
      
      return finalOrder;
    });
  }, [libraryBlocks]);

  // Memoize the set of IDs currently in the builder for quick lookup
  const usedBlockIds = useMemo(() => {
    return new Set(builderBlocks.map(b => b.id));
  }, [builderBlocks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Prevent accidental drags when clicking
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeData = active.data.current;
    
    if (activeData?.type === 'library-item') {
      setActiveDragItem(activeData.block as PromptBlock);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    // No complex nested sorting logic required here currently
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    const activeType = active.data.current?.type;

    // 1. Tag Reordering in Library Panel
    if (activeType === 'tag' && activeId !== overId) {
      setTagOrder((items) => {
        const oldIndex = items.indexOf(activeId as string);
        const newIndex = items.indexOf(overId as string);
        return arrayMove(items, oldIndex, newIndex);
      });
      return;
    }

    // 2. Dropping from Library to Builder
    const isLibraryItem = activeType === 'library-item';
    const isOverBuilderContext = typeof overId === 'string' && (builderBlocks.some(b => b.instanceId === overId) || overId === 'builder-area');

    if (isLibraryItem && isOverBuilderContext) {
       const block = active.data.current?.block as PromptBlock;

       // Prevent duplicate blocks
       if (builderBlocks.some(b => b.id === block.id)) {
         return;
       }

       const newBlock: BuilderBlock = {
         ...block,
         instanceId: `${block.id}-${Date.now()}`
       };
       
       setBuilderBlocks((prev) => {
         // If dropped over a specific item, insert at that index
         const overIndex = prev.findIndex(b => b.instanceId === overId);
         if (overIndex >= 0) {
           const newItems = [...prev];
           newItems.splice(overIndex, 0, newBlock);
           return newItems;
         }
         // Otherwise append
         return [...prev, newBlock];
       });
       return;
    }

    // 3. Reordering within Builder
    if (!isLibraryItem && activeId !== overId && activeType !== 'tag') {
      setBuilderBlocks((items) => {
        const oldIndex = items.findIndex((item) => item.instanceId === activeId);
        const newIndex = items.findIndex((item) => item.instanceId === overId);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAutoGenerate = () => {
    const newBlocks: BuilderBlock[] = [];
    
    // Iterate through tags in current sort order
    tagOrder.forEach(tag => {
      // Find all library blocks matching this tag
      const candidates = libraryBlocks.filter(b => b.tag === tag);
      
      if (candidates.length > 0) {
        // Pick one random block
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
    // Clear highlight after animation duration (reduced to 1000ms for better feel)
    setTimeout(() => {
        setHighlightedLibraryId(null);
    }, 1000);
  };

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
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
      <div className="flex h-screen bg-black text-zinc-100 overflow-hidden font-sans">
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
            t={t}
          />
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

// Wrapper for the builder panel to make the whole area droppable
const BuilderDropArea = (props: { 
  blocks: BuilderBlock[], 
  setBlocks: React.Dispatch<React.SetStateAction<BuilderBlock[]>>, 
  tagOrder: string[],
  onAutoGenerate: () => void,
  onBlockClick: (id: string, tag: string) => void,
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