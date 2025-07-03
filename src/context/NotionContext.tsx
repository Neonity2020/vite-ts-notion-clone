import React, { createContext, useReducer, useEffect, useRef } from 'react';
import { Block, Page, NotionState } from '../types';

type NotionAction =
  | { type: 'INITIALIZE_STATE'; payload: { pages: Page[]; currentPageId: string | null } }
  | { type: 'SET_PAGES'; payload: Page[] }
  | { type: 'ADD_PAGE'; payload: Page }
  | { type: 'UPDATE_PAGE'; payload: { id: string; updates: Partial<Page> } }
  | { type: 'DELETE_PAGE'; payload: string }
  | { type: 'SET_CURRENT_PAGE'; payload: string }
  | { type: 'ADD_BLOCK'; payload: { pageId: string; block: Block; index?: number } }
  | { type: 'UPDATE_BLOCK'; payload: { pageId: string; blockId: string; updates: Partial<Block> } }
  | { type: 'DELETE_BLOCK'; payload: { pageId: string; blockId: string } }
  | { type: 'REORDER_BLOCKS'; payload: { pageId: string; fromIndex: number; toIndex: number } }
  | { type: 'SET_SELECTED_BLOCK'; payload: string | null }
  | { type: 'TOGGLE_SIDEBAR' };

const initialState: NotionState = {
  pages: [],
  currentPageId: null,
  selectedBlockId: null,
  sidebarCollapsed: false,
};

function notionReducer(state: NotionState, action: NotionAction): NotionState {
  switch (action.type) {
    case 'INITIALIZE_STATE':
      return { 
        ...state, 
        pages: action.payload.pages, 
        currentPageId: action.payload.currentPageId 
      };
    
    case 'SET_PAGES':
      return { ...state, pages: action.payload };
    
    case 'ADD_PAGE':
      return { ...state, pages: [...state.pages, action.payload] };
    
    case 'UPDATE_PAGE':
      return {
        ...state,
        pages: state.pages.map(page =>
          page.id === action.payload.id
            ? { ...page, ...action.payload.updates, updatedAt: new Date() }
            : page
        ),
      };
    
    case 'DELETE_PAGE': {
      const newPages = state.pages.filter(page => page.id !== action.payload);
      return {
        ...state,
        pages: newPages,
        currentPageId: state.currentPageId === action.payload 
          ? (newPages.length > 0 ? newPages[0].id : null)
          : state.currentPageId,
      };
    }
    
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPageId: action.payload };
    
    case 'ADD_BLOCK':
      return {
        ...state,
        pages: state.pages.map(page =>
          page.id === action.payload.pageId
            ? {
                ...page,
                blocks: action.payload.index !== undefined
                  ? [
                      ...page.blocks.slice(0, action.payload.index),
                      action.payload.block,
                      ...page.blocks.slice(action.payload.index),
                    ]
                  : [...page.blocks, action.payload.block],
                updatedAt: new Date(),
              }
            : page
        ),
      };
    
    case 'UPDATE_BLOCK':
      return {
        ...state,
        pages: state.pages.map(page =>
          page.id === action.payload.pageId
            ? {
                ...page,
                blocks: page.blocks.map(block =>
                  block.id === action.payload.blockId
                    ? { ...block, ...action.payload.updates, updatedAt: new Date() }
                    : block
                ),
                updatedAt: new Date(),
              }
            : page
        ),
      };
    
    case 'DELETE_BLOCK':
      return {
        ...state,
        pages: state.pages.map(page =>
          page.id === action.payload.pageId
            ? {
                ...page,
                blocks: page.blocks.filter(block => block.id !== action.payload.blockId),
                updatedAt: new Date(),
              }
            : page
        ),
      };
    
    case 'REORDER_BLOCKS':
      return {
        ...state,
        pages: state.pages.map(page =>
          page.id === action.payload.pageId
            ? {
                ...page,
                blocks: (() => {
                  const blocks = [...page.blocks];
                  const [removed] = blocks.splice(action.payload.fromIndex, 1);
                  blocks.splice(action.payload.toIndex, 0, removed);
                  return blocks;
                })(),
                updatedAt: new Date(),
              }
            : page
        ),
      };
    
    case 'SET_SELECTED_BLOCK':
      return { ...state, selectedBlockId: action.payload };
    
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
    
    default:
      return state;
  }
}

interface NotionContextType {
  state: NotionState;
  dispatch: React.Dispatch<NotionAction>;
  currentPage: Page | null;
  addPage: (title: string) => string;
  updatePage: (id: string, updates: Partial<Page>) => void;
  deletePage: (id: string) => void;
  setCurrentPage: (id: string) => void;
  addBlock: (pageId: string, type: Block['type'], index?: number) => string;
  updateBlock: (pageId: string, blockId: string, updates: Partial<Block>) => void;
  deleteBlock: (pageId: string, blockId: string) => void;
  reorderBlocks: (pageId: string, fromIndex: number, toIndex: number) => void;
}

const NotionContext = createContext<NotionContextType | undefined>(undefined);

export { NotionContext };

export function NotionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(notionReducer, initialState);
  const isInitialized = useRef(false);

  // Load data from localStorage on mount
  useEffect(() => {
    if (isInitialized.current) return;
    
    const savedData = localStorage.getItem('notion-clone-data');
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        
        const pages = parsedData.pages.map((page: { id: string; title: string; blocks: Array<{ id: string; type: string; content: string; createdAt: string; updatedAt: string }>; createdAt: string; updatedAt: string }) => ({
          ...page,
          createdAt: new Date(page.createdAt),
          updatedAt: new Date(page.updatedAt),
          blocks: page.blocks.map((block: { id: string; type: string; content: string; createdAt: string; updatedAt: string }) => ({
            ...block,
            createdAt: new Date(block.createdAt),
            updatedAt: new Date(block.updatedAt),
          })),
        }));
        
        // 批量更新，避免中间状态被保存
        const currentPageId = parsedData.currentPageId && pages.some((p: Page) => p.id === parsedData.currentPageId) 
          ? parsedData.currentPageId 
          : (pages.length > 0 ? pages[0].id : null);
        
        // 一次性设置所有状态
        dispatch({ type: 'INITIALIZE_STATE', payload: { pages, currentPageId } });
        isInitialized.current = true;
      } catch (error) {
        console.error('Error loading saved data:', error);
        isInitialized.current = true;
      }
    } else {
      // Create default page if no data exists
      const defaultPage: Page = {
        id: 'default-page',
        title: 'Welcome to Notion Clone',
        blocks: [
          {
            id: 'welcome-block',
            type: 'heading1',
            content: 'Welcome to your Notion Clone',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'intro-block',
            type: 'paragraph',
            content: 'Start typing to create your first block. Use "/" to see all available block types.',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      dispatch({ type: 'ADD_PAGE', payload: defaultPage });
      dispatch({ type: 'SET_CURRENT_PAGE', payload: defaultPage.id });
      isInitialized.current = true;
    }
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    if (!isInitialized.current) return;
    
    console.log('State changed - pages count:', state.pages.length, 'currentPageId:', state.currentPageId);
    
    localStorage.setItem('notion-clone-data', JSON.stringify({
      pages: state.pages,
      currentPageId: state.currentPageId,
    }));
  }, [state.pages, state.currentPageId]);

  const currentPage = state.pages.find(page => page.id === state.currentPageId) || null;

  const addPage = (title: string): string => {
    const newPage: Page = {
      id: `page-${Date.now()}`,
      title,
      blocks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    dispatch({ type: 'ADD_PAGE', payload: newPage });
    return newPage.id;
  };

  const updatePage = (id: string, updates: Partial<Page>) => {
    dispatch({ type: 'UPDATE_PAGE', payload: { id, updates } });
  };

  const deletePage = (id: string) => {
    dispatch({ type: 'DELETE_PAGE', payload: id });
  };

  const setCurrentPage = (id: string) => {
    dispatch({ type: 'SET_CURRENT_PAGE', payload: id });
  };

  const addBlock = (pageId: string, type: Block['type'], index?: number): string => {
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      type,
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    dispatch({ type: 'ADD_BLOCK', payload: { pageId, block: newBlock, index } });
    return newBlock.id;
  };

  const updateBlock = (pageId: string, blockId: string, updates: Partial<Block>) => {
    dispatch({ type: 'UPDATE_BLOCK', payload: { pageId, blockId, updates } });
  };

  const deleteBlock = (pageId: string, blockId: string) => {
    dispatch({ type: 'DELETE_BLOCK', payload: { pageId, blockId } });
  };

  const reorderBlocks = (pageId: string, fromIndex: number, toIndex: number) => {
    dispatch({ type: 'REORDER_BLOCKS', payload: { pageId, fromIndex, toIndex } });
  };

  const value: NotionContextType = {
    state,
    dispatch,
    currentPage,
    addPage,
    updatePage,
    deletePage,
    setCurrentPage,
    addBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks,
  };

  return (
    <NotionContext.Provider value={value}>
      {children}
    </NotionContext.Provider>
  );
}