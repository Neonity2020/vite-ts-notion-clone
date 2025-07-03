import { Block, Page } from '../types';

// 声明全局 Electron API 类型
declare global {
  interface Window {
    electronAPI: {
      getAllPages: () => Promise<Page[]>;
      getPageWithBlocks: (pageId: string) => Promise<Page | null>;
      createPage: (page: Omit<Page, 'blocks'>) => Promise<void>;
      updatePage: (id: string, updates: Partial<Pick<Page, 'title'>>) => Promise<void>;
      deletePage: (id: string) => Promise<void>;
      createBlock: (block: Block, pageId: string, position: number) => Promise<void>;
      updateBlock: (blockId: string, updates: Partial<Pick<Block, 'type' | 'content'>>) => Promise<void>;
      deleteBlock: (blockId: string) => Promise<void>;
      reorderBlocks: (pageId: string, fromIndex: number, toIndex: number) => Promise<void>;
      insertBlockAtPosition: (block: Block, pageId: string, position: number) => Promise<void>;
    };
  }
}

// 检查是否在 Electron 环境中
const isElectron = typeof window !== 'undefined' && window.electronAPI;

// 页面相关操作
export const pageService = {
  // 获取所有页面
  async getAllPages(): Promise<Page[]> {
    if (isElectron) {
      return await window.electronAPI.getAllPages();
    } else {
      // 回退到 localStorage
      const savedData = localStorage.getItem('notion-clone-data');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        return parsedData.pages || [];
      }
      return [];
    }
  },

  // 获取页面及其所有块
  async getPageWithBlocks(pageId: string): Promise<Page | null> {
    if (isElectron) {
      return await window.electronAPI.getPageWithBlocks(pageId);
    } else {
      // 回退到 localStorage
      const savedData = localStorage.getItem('notion-clone-data');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        const page = parsedData.pages?.find((p: Page) => p.id === pageId);
        return page || null;
      }
      return null;
    }
  },

  // 创建页面
  async createPage(page: Omit<Page, 'blocks'>): Promise<void> {
    if (isElectron) {
      await window.electronAPI.createPage(page);
    } else {
      // 回退到 localStorage
      const savedData = localStorage.getItem('notion-clone-data');
      const parsedData = savedData ? JSON.parse(savedData) : { pages: [], currentPageId: null };
      parsedData.pages.push({ ...page, blocks: [] });
      localStorage.setItem('notion-clone-data', JSON.stringify(parsedData));
    }
  },

  // 更新页面
  async updatePage(id: string, updates: Partial<Pick<Page, 'title'>>): Promise<void> {
    if (isElectron) {
      await window.electronAPI.updatePage(id, updates);
    } else {
      // 回退到 localStorage
      const savedData = localStorage.getItem('notion-clone-data');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        const pageIndex = parsedData.pages.findIndex((p: Page) => p.id === id);
        if (pageIndex !== -1) {
          parsedData.pages[pageIndex] = { ...parsedData.pages[pageIndex], ...updates, updatedAt: new Date() };
          localStorage.setItem('notion-clone-data', JSON.stringify(parsedData));
        }
      }
    }
  },

  // 删除页面
  async deletePage(id: string): Promise<void> {
    if (isElectron) {
      await window.electronAPI.deletePage(id);
    } else {
      // 回退到 localStorage
      const savedData = localStorage.getItem('notion-clone-data');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        parsedData.pages = parsedData.pages.filter((p: Page) => p.id !== id);
        if (parsedData.currentPageId === id) {
          parsedData.currentPageId = parsedData.pages.length > 0 ? parsedData.pages[0].id : null;
        }
        localStorage.setItem('notion-clone-data', JSON.stringify(parsedData));
      }
    }
  },
};

// 块相关操作
export const blockService = {
  // 获取页面的所有块
  async getBlocksByPageId(pageId: string): Promise<Block[]> {
    if (isElectron) {
      const page = await window.electronAPI.getPageWithBlocks(pageId);
      return page?.blocks || [];
    } else {
      // 回退到 localStorage
      const savedData = localStorage.getItem('notion-clone-data');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        const page = parsedData.pages?.find((p: Page) => p.id === pageId);
        return page?.blocks || [];
      }
      return [];
    }
  },

  // 创建块
  async createBlock(block: Block, pageId: string, position: number): Promise<void> {
    if (isElectron) {
      await window.electronAPI.createBlock(block, pageId, position);
    } else {
      // 回退到 localStorage
      const savedData = localStorage.getItem('notion-clone-data');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        const pageIndex = parsedData.pages.findIndex((p: Page) => p.id === pageId);
        if (pageIndex !== -1) {
          parsedData.pages[pageIndex].blocks.splice(position, 0, block);
          localStorage.setItem('notion-clone-data', JSON.stringify(parsedData));
        }
      }
    }
  },

  // 更新块
  async updateBlock(blockId: string, updates: Partial<Pick<Block, 'type' | 'content'>>): Promise<void> {
    if (isElectron) {
      await window.electronAPI.updateBlock(blockId, updates);
    } else {
      // 回退到 localStorage
      const savedData = localStorage.getItem('notion-clone-data');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        for (const page of parsedData.pages) {
          const blockIndex = page.blocks.findIndex((b: Block) => b.id === blockId);
          if (blockIndex !== -1) {
            page.blocks[blockIndex] = { ...page.blocks[blockIndex], ...updates, updatedAt: new Date() };
            localStorage.setItem('notion-clone-data', JSON.stringify(parsedData));
            break;
          }
        }
      }
    }
  },

  // 删除块
  async deleteBlock(blockId: string): Promise<void> {
    if (isElectron) {
      await window.electronAPI.deleteBlock(blockId);
    } else {
      // 回退到 localStorage
      const savedData = localStorage.getItem('notion-clone-data');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        for (const page of parsedData.pages) {
          const blockIndex = page.blocks.findIndex((b: Block) => b.id === blockId);
          if (blockIndex !== -1) {
            page.blocks.splice(blockIndex, 1);
            localStorage.setItem('notion-clone-data', JSON.stringify(parsedData));
            break;
          }
        }
      }
    }
  },

  // 重新排序块
  async reorderBlocks(pageId: string, fromIndex: number, toIndex: number): Promise<void> {
    if (isElectron) {
      await window.electronAPI.reorderBlocks(pageId, fromIndex, toIndex);
    } else {
      // 回退到 localStorage
      const savedData = localStorage.getItem('notion-clone-data');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        const pageIndex = parsedData.pages.findIndex((p: Page) => p.id === pageId);
        if (pageIndex !== -1) {
          const blocks = parsedData.pages[pageIndex].blocks;
          const [movedBlock] = blocks.splice(fromIndex, 1);
          blocks.splice(toIndex, 0, movedBlock);
          localStorage.setItem('notion-clone-data', JSON.stringify(parsedData));
        }
      }
    }
  },

  // 插入块到指定位置
  async insertBlockAtPosition(block: Block, pageId: string, position: number): Promise<void> {
    if (isElectron) {
      await window.electronAPI.insertBlockAtPosition(block, pageId, position);
    } else {
      // 回退到 localStorage
      const savedData = localStorage.getItem('notion-clone-data');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        const pageIndex = parsedData.pages.findIndex((p: Page) => p.id === pageId);
        if (pageIndex !== -1) {
          parsedData.pages[pageIndex].blocks.splice(position, 0, block);
          localStorage.setItem('notion-clone-data', JSON.stringify(parsedData));
        }
      }
    }
  },
};

// 初始化数据库（在 Electron 环境中不需要）
export function initDatabase(): void {
  if (!isElectron) {
    console.log('Running in browser mode - using localStorage fallback');
  }
}

// 获取数据库实例（在 Electron 环境中不需要）
export function getDatabase(): null {
  return null;
}

// 关闭数据库连接（在 Electron 环境中不需要）
export function closeDatabase(): void {
  // 在浏览器环境中不需要关闭连接
} 