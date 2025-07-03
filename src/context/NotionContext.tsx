import React, { createContext, useReducer, useEffect, useRef } from 'react';
import { Block, Page, NotionState } from '../types';
import { initDatabase, pageService, blockService } from '../services/database';

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
  addPage: (title: string) => Promise<string>;
  updatePage: (id: string, updates: Partial<Page>) => Promise<void>;
  deletePage: (id: string) => Promise<void>;
  setCurrentPage: (id: string) => Promise<void>;
  addBlock: (pageId: string, type: Block['type'], index?: number) => Promise<string>;
  updateBlock: (pageId: string, blockId: string, updates: Partial<Block>) => Promise<void>;
  deleteBlock: (pageId: string, blockId: string) => Promise<void>;
  reorderBlocks: (pageId: string, fromIndex: number, toIndex: number) => Promise<void>;
}

const NotionContext = createContext<NotionContextType | undefined>(undefined);

export { NotionContext };

export function NotionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(notionReducer, initialState);
  const isInitialized = useRef(false);

  // 初始化数据库并加载数据
  useEffect(() => {
    if (isInitialized.current) return;
    
    const loadData = async () => {
      try {
        // 初始化数据库
        initDatabase();
        
        // 从数据库加载所有页面
        const pages = await pageService.getAllPages();
        
        if (pages.length > 0) {
          // 加载第一个页面的完整数据（包括块）
          const firstPage = await pageService.getPageWithBlocks(pages[0].id);
          if (firstPage) {
            const pagesWithBlocks = pages.map(page => 
              page.id === firstPage.id ? firstPage : page
            );
            
            dispatch({ type: 'INITIALIZE_STATE', payload: { pages: pagesWithBlocks, currentPageId: firstPage.id } });
          }
        } else {
          // 创建默认页面
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
          
          // 保存到数据库
          await pageService.createPage(defaultPage);
          for (let i = 0; i < defaultPage.blocks.length; i++) {
            await blockService.createBlock(defaultPage.blocks[i], defaultPage.id, i);
          }
          
          dispatch({ type: 'INITIALIZE_STATE', payload: { pages: [defaultPage], currentPageId: defaultPage.id } });
        }
        
        isInitialized.current = true;
      } catch (error) {
        console.error('Error initializing database:', error);
        isInitialized.current = true;
      }
    };
    
    loadData();
  }, []);

  const currentPage = state.pages.find(page => page.id === state.currentPageId) || null;

  const addPage = async (title: string): Promise<string> => {
    const newPage: Page = {
      id: `page-${Date.now()}`,
      title,
      blocks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // 保存到数据库
    await pageService.createPage(newPage);
    
    dispatch({ type: 'ADD_PAGE', payload: newPage });
    return newPage.id;
  };

  const updatePage = async (id: string, updates: Partial<Page>) => {
    // 更新数据库
    await pageService.updatePage(id, updates);
    
    dispatch({ type: 'UPDATE_PAGE', payload: { id, updates } });
  };

  const deletePage = async (id: string) => {
    // 从数据库删除
    await pageService.deletePage(id);
    
    dispatch({ type: 'DELETE_PAGE', payload: id });
  };

  const setCurrentPage = async (id: string) => {
    // 如果页面还没有加载块，则从数据库加载
    const page = state.pages.find(p => p.id === id);
    if (page && page.blocks.length === 0) {
      const pageWithBlocks = await pageService.getPageWithBlocks(id);
      if (pageWithBlocks) {
        dispatch({ type: 'UPDATE_PAGE', payload: { id, updates: { blocks: pageWithBlocks.blocks } } });
      }
    }
    
    dispatch({ type: 'SET_CURRENT_PAGE', payload: id });
  };

  const addBlock = async (pageId: string, type: Block['type'], index?: number): Promise<string> => {
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      type,
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const actualIndex = index ?? state.pages.find(p => p.id === pageId)?.blocks.length ?? 0;
    
    // 保存到数据库
    await blockService.insertBlockAtPosition(newBlock, pageId, actualIndex);
    
    dispatch({ type: 'ADD_BLOCK', payload: { pageId, block: newBlock, index } });
    return newBlock.id;
  };

  const updateBlock = async (pageId: string, blockId: string, updates: Partial<Block>) => {
    // 更新数据库
    await blockService.updateBlock(blockId, updates);
    
    dispatch({ type: 'UPDATE_BLOCK', payload: { pageId, blockId, updates } });
  };

  const deleteBlock = async (pageId: string, blockId: string) => {
    // 从数据库删除
    await blockService.deleteBlock(blockId);
    
    dispatch({ type: 'DELETE_BLOCK', payload: { pageId, blockId } });
  };

  const reorderBlocks = async (pageId: string, fromIndex: number, toIndex: number) => {
    // 更新数据库
    await blockService.reorderBlocks(pageId, fromIndex, toIndex);
    
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