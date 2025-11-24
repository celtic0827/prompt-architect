
import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDraggable } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Search, Tag, GripVertical, Trash2, FileDown, FileUp, GripHorizontal, Check, Settings2, CheckSquare, Languages, Pencil, X, AlertTriangle, FileInput, CopyPlus, Replace, ChevronRight } from 'lucide-react';
import { PromptBlock } from '../types';
import { exportToCSV, parseCSV } from '../utils/csvHelper';
import { Language, TRANSLATIONS } from '../translations';

interface LibraryPanelProps {
  blocks: PromptBlock[];
  setBlocks: React.Dispatch<React.SetStateAction<PromptBlock[]>>;
  tags: string[];
  usedBlockIds: Set<string>;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof TRANSLATIONS.en;
  activeTag: string | null;
  setActiveTag: (tag: string | null) => void;
  highlightedBlockId: string | null;
  onDeleteBlock: (id: string) => void;
  onBulkDeleteBlocks: (ids: Set<string>) => void;
  onAddToBuilder: (block: PromptBlock) => void;
}

export const LibraryPanel: React.FC<LibraryPanelProps> = ({ 
  blocks, 
  setBlocks, 
  tags, 
  usedBlockIds,
  language,
  setLanguage,
  t,
  activeTag,
  setActiveTag,
  highlightedBlockId,
  onDeleteBlock,
  onBulkDeleteBlocks,
  onAddToBuilder
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Management Mode State
  const [isManageMode, setIsManageMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // New Block State
  const [newName, setNewName] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newContent, setNewContent] = useState('');

  // Editing State
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '', tag: '', content: '' });

  // Import Modal State
  const [pendingImport, setPendingImport] = useState<PromptBlock[] | null>(null);

  useEffect(() => {
    if (highlightedBlockId) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`lib-item-${highlightedBlockId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [highlightedBlockId, activeTag]);

  const filteredBlocks = useMemo(() => {
    return blocks.filter(block => {
      const matchesSearch = block.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            block.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTag = activeTag ? block.tag === activeTag : true;
      return matchesSearch && matchesTag;
    });
  }, [blocks, searchTerm, activeTag]);

  // Duplicate count calculation
  const duplicateCount = useMemo(() => {
    if (!pendingImport) return 0;
    const existingNames = new Set(blocks.map(b => b.name));
    return pendingImport.filter(b => existingNames.has(b.name)).length;
  }, [pendingImport, blocks]);

  const handleAddBlock = () => {
    if (!newName || !newContent) return;
    const newBlock: PromptBlock = {
      id: crypto.randomUUID(),
      name: newName,
      tag: newTag || 'Misc',
      content: newContent
    };
    setBlocks(prev => [...prev, newBlock]);
    setNewName('');
    setNewTag('');
    setNewContent('');
    setShowAddForm(false);
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteBlock(id);
  };

  const handleStartEdit = (block: PromptBlock, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBlockId(block.id);
    setEditFormData({ name: block.name, tag: block.tag, content: block.content });
  };

  const handleCancelEdit = () => {
    setEditingBlockId(null);
    setEditFormData({ name: '', tag: '', content: '' });
  };

  const handleSaveEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingBlockId) {
      setBlocks(prev => prev.map(b => 
        b.id === editingBlockId 
          ? { ...b, name: editFormData.name, tag: editFormData.tag, content: editFormData.content } 
          : b
      ));
      setEditingBlockId(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const parsed = parseCSV(text);
      const newBlocks = parsed.map(p => ({ ...p, id: crypto.randomUUID() }));
      setPendingImport(newBlocks);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImportAppend = () => {
    if (pendingImport) {
        setBlocks(prev => [...prev, ...pendingImport]);
        setPendingImport(null);
    }
  };

  const handleImportOverwrite = () => {
    if (pendingImport) {
        setBlocks(pendingImport);
        setPendingImport(null);
    }
  };

  const toggleManageMode = () => {
    setIsManageMode(!isManageMode);
    setSelectedIds(new Set());
    setShowAddForm(false);
    setEditingBlockId(null);
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    onBulkDeleteBlocks(selectedIds);
    setSelectedIds(new Set());
    setIsManageMode(false);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 md:border-r border-zinc-800 w-full">
      {/* Header & Tools */}
      <div className="p-4 border-b border-zinc-800 space-y-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-500" />
            {t.library}
          </h2>
          <div className="flex gap-2">
            {!isManageMode ? (
              <>
                 <button 
                  onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400 font-mono text-xs flex items-center gap-1"
                  title="Switch Language / 切換語言"
                >
                  <Languages className="w-4 h-4" />
                  {language === 'en' ? 'EN' : '中'}
                </button>

                <label className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg cursor-pointer transition-colors" title={t.importCSV}>
                  <FileDown className="w-4 h-4 text-zinc-400" />
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                </label>
                <button 
                  onClick={() => exportToCSV(blocks)}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                  title={t.exportCSV}
                >
                  <FileUp className="w-4 h-4 text-zinc-400" />
                </button>
                <button 
                  onClick={() => setShowAddForm(!showAddForm)}
                  className={`p-2 rounded-lg transition-colors ${showAddForm ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-indigo-400 hover:bg-zinc-700'}`}
                  title={t.addBlock}
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button 
                  onClick={toggleManageMode}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400"
                  title={t.manageBlocks}
                >
                  <Settings2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                 {selectedIds.size > 0 && (
                    <button 
                      onClick={handleBulkDelete}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-900/50 hover:bg-red-900 text-red-300 rounded-lg transition-colors text-xs font-medium border border-red-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {t.delete} ({selectedIds.size})
                    </button>
                 )}
                 <button 
                    onClick={toggleManageMode}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors text-xs font-medium"
                 >
                    <CheckSquare className="w-3.5 h-3.5" />
                    {t.done}
                 </button>
              </>
            )}
          </div>
        </div>

        {/* Add Form */}
        {showAddForm && !isManageMode && (
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3 animate-in fade-in slide-in-from-top-2">
            <input 
              placeholder={t.blockName}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
              value={newName} onChange={e => setNewName(e.target.value)}
            />
            <div className="flex gap-2">
               <input 
                placeholder={t.tagPlaceholder} 
                className="w-1/2 bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
                value={newTag} onChange={e => setNewTag(e.target.value)}
                list="tag-suggestions"
              />
              <datalist id="tag-suggestions">
                {tags.map(t => <option key={t} value={t} />)}
              </datalist>
            </div>
            <textarea 
              placeholder={t.contentPlaceholder} 
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 h-20 resize-none"
              value={newContent} onChange={e => setNewContent(e.target.value)}
            />
            <button 
              onClick={handleAddBlock}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded text-sm font-medium transition-colors"
            >
              {t.createBlock}
            </button>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder={t.searchPlaceholder}
            className="w-full bg-black/20 border border-zinc-800 rounded-full pl-9 pr-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Sortable Tag Filters */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t.tagFilterOrder}</span>
            <button 
              onClick={() => setActiveTag(null)}
              className={`text-[10px] px-2 py-0.5 rounded transition-colors ${!activeTag ? 'text-indigo-400' : 'text-zinc-600 hover:text-zinc-400'}`}
            >
              {t.clearFilter}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-1 -mx-1">
            <SortableContext items={tags} strategy={horizontalListSortingStrategy}>
              {tags.map(tag => (
                <SortableTagItem 
                  key={tag} 
                  tag={tag} 
                  activeTag={activeTag} 
                  setActiveTag={setActiveTag} 
                />
              ))}
            </SortableContext>
          </div>
        </div>
      </div>

      {/* Draggable List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin pb-20 md:pb-4">
        {filteredBlocks.map(block => (
          <DraggableLibraryItem 
            key={block.id} 
            block={block} 
            onDelete={handleDeleteClick} 
            isUsed={usedBlockIds.has(block.id)}
            isManageMode={isManageMode}
            isSelected={selectedIds.has(block.id)}
            onToggleSelect={() => toggleSelection(block.id)}
            isHighlighted={highlightedBlockId === block.id}
            isEditing={editingBlockId === block.id}
            onStartEdit={handleStartEdit}
            onCancelEdit={handleCancelEdit}
            onSaveEdit={handleSaveEdit}
            editData={editFormData}
            setEditData={setEditFormData}
            availableTags={tags}
            onAddToBuilder={() => onAddToBuilder(block)}
          />
        ))}
        {filteredBlocks.length === 0 && (
          <div className="text-center text-zinc-600 text-sm mt-10 italic">
            {t.noBlocksFound}
          </div>
        )}
      </div>

      {/* Import Options Modal */}
      {pendingImport && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setPendingImport(null)} />
            <div className="relative bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl max-w-md w-full p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
                    <FileInput className="w-6 h-6 text-indigo-500" />
                    <h3 className="text-lg font-bold text-white">{t.importOptions}</h3>
                </div>
                
                <div className="space-y-3">
                    <p className="text-zinc-300">
                        {t.foundBlocks.replace('{n}', pendingImport.length.toString())}
                    </p>
                    {duplicateCount > 0 && (
                        <div className="flex items-start gap-2 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
                            <p className="text-sm text-yellow-200">
                                {t.duplicatesFound.replace('{n}', duplicateCount.toString())}
                            </p>
                        </div>
                    )}
                </div>

                <div className="space-y-3 pt-2">
                    <button 
                        onClick={handleImportAppend}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors border border-zinc-700 hover:border-indigo-500 group"
                    >
                        <CopyPlus className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300" />
                        <div className="flex flex-col items-start">
                            <span className="text-sm font-bold">{t.append}</span>
                        </div>
                    </button>

                    <button 
                        onClick={handleImportOverwrite}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-950/30 hover:bg-red-900/50 text-red-200 rounded-lg transition-colors border border-red-900/50 hover:border-red-500 group"
                    >
                        <Replace className="w-4 h-4 text-red-400" />
                        <div className="flex flex-col items-start text-left">
                            <span className="text-sm font-bold">{t.overwrite}</span>
                            <span className="text-[10px] opacity-70">{t.overwriteWarning}</span>
                        </div>
                    </button>

                    <button 
                        onClick={() => setPendingImport(null)}
                        className="w-full px-4 py-2 text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
                    >
                        {t.cancel}
                    </button>
                </div>
            </div>
        </div>,
        document.body
      )}

    </div>
  );
};

interface SortableTagItemProps {
  tag: string;
  activeTag: string | null;
  setActiveTag: (tag: string | null) => void;
}

const SortableTagItem: React.FC<SortableTagItemProps> = ({ tag, activeTag, setActiveTag }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: tag,
    data: { type: 'tag', tag } 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  const handleClick = () => {
      setActiveTag(tag === activeTag ? null : tag);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={`group relative text-xs px-3 py-1.5 rounded-md border cursor-grab active:cursor-grabbing select-none transition-all flex items-center gap-1.5
        ${tag === activeTag 
          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/50' 
          : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
        } ${isDragging ? 'opacity-50' : ''}`}
    >
      <span className="truncate max-w-[100px]">{tag}</span>
      <GripHorizontal className={`w-2.5 h-2.5 opacity-0 group-hover:opacity-50 ${tag === activeTag ? 'text-white' : 'text-zinc-500'}`} />
    </div>
  );
};

interface DraggableLibraryItemProps {
  block: PromptBlock;
  onDelete: (id: string, e: React.MouseEvent) => void;
  isUsed: boolean;
  isManageMode: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  isHighlighted: boolean;
  isEditing: boolean;
  onStartEdit: (block: PromptBlock, e: React.MouseEvent) => void;
  onCancelEdit: () => void;
  onSaveEdit: (e: React.MouseEvent) => void;
  editData: { name: string; tag: string; content: string };
  setEditData: React.Dispatch<React.SetStateAction<{ name: string; tag: string; content: string }>>;
  availableTags: string[];
  onAddToBuilder: () => void;
}

const DraggableLibraryItem: React.FC<DraggableLibraryItemProps> = ({ 
  block, 
  onDelete, 
  isUsed,
  isManageMode,
  isSelected,
  onToggleSelect,
  isHighlighted,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  editData,
  setEditData,
  availableTags,
  onAddToBuilder
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `lib-${block.id}`,
    data: { 
      type: 'library-item',
      block 
    },
    disabled: isManageMode || isEditing
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  } : undefined;

  const handleClick = (e: React.MouseEvent) => {
      if (isManageMode) {
          e.preventDefault();
          e.stopPropagation();
          onToggleSelect();
      }
  };

  if (isEditing) {
    return (
      <div 
        ref={setNodeRef}
        style={style}
        className="border p-3 rounded-lg bg-zinc-950 border-indigo-500 ring-1 ring-indigo-500 relative z-20 space-y-2 shadow-lg"
      >
        <div className="flex gap-2">
            <div className="relative w-1/3 min-w-[80px]">
                <input 
                    value={editData.tag}
                    onChange={(e) => setEditData({...editData, tag: e.target.value})}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs text-indigo-300 focus:outline-none focus:border-indigo-500"
                    placeholder="Tag"
                    list="edit-tag-suggestions"
                />
                <datalist id="edit-tag-suggestions">
                    {availableTags.map(t => <option key={t} value={t} />)}
                </datalist>
            </div>
            <input 
                value={editData.name}
                onChange={(e) => setEditData({...editData, name: e.target.value})}
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 font-medium"
                placeholder="Block Name"
            />
        </div>
        <textarea 
            value={editData.content}
            onChange={(e) => setEditData({...editData, content: e.target.value})}
            className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-300 font-mono leading-relaxed focus:outline-none focus:border-indigo-500 resize-none h-24"
            placeholder="Content..."
        />
        <div className="flex justify-end gap-2 pt-1 border-t border-zinc-800/50">
            <button 
                onClick={onCancelEdit}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                title="Cancel"
            >
                <X className="w-4 h-4" />
            </button>
            <button 
                onClick={onSaveEdit}
                className="p-1.5 text-white bg-indigo-600 hover:bg-indigo-500 rounded transition-colors shadow-lg shadow-indigo-900/20"
                title="Save"
            >
                <Check className="w-4 h-4" />
            </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      id={`lib-item-${block.id}`}
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes}
      onClick={handleClick}
      className={`group border p-3 rounded-lg transition-all duration-300 relative select-none 
        ${!isManageMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
        ${isDragging ? 'shadow-2xl ring-2 ring-indigo-500 z-50' : ''}
        ${isHighlighted ? 'ring-2 ring-cyan-400 bg-zinc-800 scale-105 shadow-[0_0_15px_rgba(34,211,238,0.3)] z-10' : ''}
        ${!isHighlighted && isUsed && !isManageMode
            ? 'bg-zinc-800 border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.1)]' 
            : !isHighlighted && 'bg-zinc-950 border-zinc-800 hover:border-indigo-500/50 hover:bg-zinc-900'
        }
        ${isSelected ? 'bg-indigo-900/10 border-indigo-500 ring-1 ring-indigo-500' : ''}
      `}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
          <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded border uppercase tracking-wider ${isUsed && !isManageMode ? 'bg-indigo-900/30 text-indigo-300 border-indigo-800' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>{block.tag}</span>
          <span className={`text-sm font-medium truncate ${isUsed && !isManageMode ? 'text-indigo-200' : 'text-zinc-200'}`}>{block.name}</span>
          {isUsed && !isManageMode && <Check className="w-3.5 h-3.5 text-indigo-400 ml-1 animate-in fade-in zoom-in" />}
        </div>
        
        {isManageMode ? (
             <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ml-2 ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-zinc-600 bg-zinc-900'}`}>
                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
             </div>
        ) : (
            <div className="flex items-center shrink-0">
                {/* Mobile Add Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); onAddToBuilder(); }}
                    className="md:hidden p-1.5 text-emerald-500 hover:bg-emerald-900/20 rounded mr-1"
                >
                    <Plus className="w-4 h-4" />
                </button>

                <div className="hidden md:flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    <button 
                    onClick={(e) => onStartEdit(block, e)}
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="p-1 text-zinc-500 hover:text-indigo-400 transition-colors mr-0.5"
                    title="Edit"
                    >
                    <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button 
                    onClick={(e) => onDelete(block.id, e)}
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                    title="Delete"
                    >
                    <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
                {/* Mobile visible action buttons (always visible since drag is limited) */}
                 <div className="md:hidden flex items-center ml-1">
                    <button 
                    onClick={(e) => onStartEdit(block, e)}
                    className="p-1 text-zinc-500"
                    >
                    <Pencil className="w-3.5 h-3.5" />
                    </button>
                     <button 
                    onClick={(e) => onDelete(block.id, e)}
                    className="p-1 text-zinc-500"
                    >
                    <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        )}
      </div>
      <p className={`text-xs line-clamp-2 font-mono leading-relaxed p-1.5 rounded ${isUsed && !isManageMode ? 'bg-black/40 text-zinc-400' : 'bg-black/20 text-zinc-500'}`}>
        {block.content}
      </p>
      
      {!isManageMode && (
        <div className="hidden md:block absolute top-1/2 -translate-y-1/2 left-0 -ml-2 opacity-0 group-hover:opacity-100 text-zinc-600">
            <GripVertical className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};
