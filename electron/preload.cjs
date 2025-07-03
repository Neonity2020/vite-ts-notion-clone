const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 页面相关操作
  getAllPages: () => ipcRenderer.invoke('db-get-all-pages'),
  getPageWithBlocks: (pageId) => ipcRenderer.invoke('db-get-page-with-blocks', pageId),
  createPage: (page) => ipcRenderer.invoke('db-create-page', page),
  updatePage: (id, updates) => ipcRenderer.invoke('db-update-page', id, updates),
  deletePage: (id) => ipcRenderer.invoke('db-delete-page', id),
  
  // 块相关操作
  createBlock: (block, pageId, position) => ipcRenderer.invoke('db-create-block', block, pageId, position),
  updateBlock: (blockId, updates) => ipcRenderer.invoke('db-update-block', blockId, updates),
  deleteBlock: (blockId) => ipcRenderer.invoke('db-delete-block', blockId),
  reorderBlocks: (pageId, fromIndex, toIndex) => ipcRenderer.invoke('db-reorder-blocks', pageId, fromIndex, toIndex),
  insertBlockAtPosition: (block, pageId, position) => ipcRenderer.invoke('db-insert-block-at-position', block, pageId, position),
}); 