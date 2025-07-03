import { useState, useEffect } from 'react';
import { Edit3, Plus } from 'lucide-react';
import { useNotion } from '../context/useNotion';
import { BlockEditor } from './BlockEditor';

export function Editor() {
  const { currentPage, state, updatePage, addBlock, dispatch } = useNotion();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState('');
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);

  useEffect(() => {
    if (focusedBlockId) {
      const el = document.querySelector(`[data-block-id="${focusedBlockId}"] textarea`);
      if (el) {
        const textarea = el as HTMLTextAreaElement;
        textarea.focus();
        const len = textarea.value.length;
        textarea.setSelectionRange(len, len);
      }
    }
  }, [focusedBlockId]);

  if (!currentPage) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <Edit3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-600 mb-2">No page selected</h2>
          <p className="text-gray-500">Select a page from the sidebar or create a new one to start editing.</p>
        </div>
      </div>
    );
  }

  const handleTitleSubmit = () => {
    if (title.trim()) {
      updatePage(currentPage.id, { title: title.trim() });
    }
    setIsEditingTitle(false);
  };

  const startEditingTitle = () => {
    setTitle(currentPage.title);
    setIsEditingTitle(true);
  };

  console.log('Editor 渲染 blocks', currentPage.blocks.map(b => b.id));

  return (
    <div className="flex-1 bg-white overflow-y-auto">
      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Page Title */}
        <div className="mb-8">
          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleTitleSubmit();
                }
                if (e.key === 'Escape') {
                  setIsEditingTitle(false);
                }
              }}
              className="text-4xl font-bold w-full bg-transparent border-none outline-none placeholder-gray-400"
              placeholder="Untitled"
              autoFocus
            />
          ) : (
            <h1
              onClick={startEditingTitle}
              className="text-4xl font-bold text-gray-900 cursor-pointer hover:bg-gray-50 rounded px-2 py-1 -mx-2 transition-colors"
            >
              {currentPage.title}
            </h1>
          )}
        </div>

        {/* Blocks */}
        <div className="space-y-1">
          {currentPage.blocks.map((block, index) => (
            <BlockEditor
              key={block.id}
              block={block}
              pageId={currentPage.id}
              index={index}
              isSelected={state.selectedBlockId === block.id}
              onSelect={() => dispatch({ type: 'SET_SELECTED_BLOCK', payload: block.id })}
              focusedBlockId={focusedBlockId}
              setFocusedBlockId={setFocusedBlockId}
            />
          ))}
        </div>

        {/* Add Block Button */}
        {currentPage.blocks.length === 0 && (
          <div className="mt-8">
            <button
              onClick={() => {
                addBlock(currentPage.id, 'paragraph').then(blockId => setFocusedBlockId(blockId));
              }}
              className="flex items-center space-x-2 px-4 py-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Click to add your first block</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}