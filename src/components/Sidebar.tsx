import { useState } from 'react';
import { 
  PanelLeft, 
  Plus, 
  FileText, 
  Search, 
  MoreHorizontal,
  Trash2
} from 'lucide-react';
import { useNotion } from '../context/useNotion';

export function Sidebar() {
  const { state, currentPage, addPage, setCurrentPage, deletePage, dispatch } = useNotion();
  const [searchQuery, setSearchQuery] = useState('');
  const [newPageTitle, setNewPageTitle] = useState('');
  const [showingDeleteConfirm, setShowingDeleteConfirm] = useState<string | null>(null);

  const filteredPages = state.pages.filter(page =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.blocks.some(block => 
      block.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleAddPage = () => {
    if (newPageTitle.trim()) {
      const pageId = addPage(newPageTitle.trim());
      setCurrentPage(pageId);
      setNewPageTitle('');
    }
  };

  const handleDeletePage = (pageId: string) => {
    if (state.pages.length > 1) {
      deletePage(pageId);
      setShowingDeleteConfirm(null);
    }
  };

  if (state.sidebarCollapsed) {
    return (
      <div className="w-12 bg-gray-50 border-r border-gray-200 flex flex-col items-center py-4">
        <button
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          className="p-2 hover:bg-gray-200 rounded-md transition-colors"
        >
          <PanelLeft className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-gray-900">Notion Clone</h1>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <PanelLeft className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Pages List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <div className="flex items-center justify-between px-2 py-1 mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pages</span>
            <button
              onClick={() => {
                const title = `Untitled ${state.pages.length + 1}`;
                const pageId = addPage(title);
                setCurrentPage(pageId);
              }}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              <Plus className="w-3 h-3 text-gray-500" />
            </button>
          </div>
          
          {filteredPages.map((page) => (
            <div
              key={page.id}
              className={`group flex items-center justify-between px-2 py-2 rounded-md cursor-pointer transition-colors ${
                currentPage?.id === page.id
                  ? 'bg-blue-100 text-blue-900'
                  : 'hover:bg-gray-200 text-gray-700'
              }`}
              onClick={() => setCurrentPage(page.id)}
            >
              <div className="flex items-center flex-1 min-w-0">
                <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="text-sm truncate">{page.title}</span>
              </div>
              
              {state.pages.length > 1 && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowingDeleteConfirm(showingDeleteConfirm === page.id ? null : page.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-300 rounded transition-all"
                  >
                    <MoreHorizontal className="w-3 h-3" />
                  </button>
                  
                  {showingDeleteConfirm === page.id && (
                    <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg z-10 py-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePage(page.id);
                        }}
                        className="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add New Page */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="New page title..."
            value={newPageTitle}
            onChange={(e) => setNewPageTitle(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddPage()}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleAddPage}
            disabled={!newPageTitle.trim()}
            className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}