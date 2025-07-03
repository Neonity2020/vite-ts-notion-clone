const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');

let mainWindow;
let db;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // 在开发环境中加载 Vite 开发服务器
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

function initDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'notion-clone.db');
  db = new Database(dbPath);
  
  // 创建表
  db.exec(`
    CREATE TABLE IF NOT EXISTS pages (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS blocks (
      id TEXT PRIMARY KEY,
      page_id TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT,
      position INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (page_id) REFERENCES pages (id) ON DELETE CASCADE
    )
  `);

  db.exec('CREATE INDEX IF NOT EXISTS idx_blocks_page_id ON blocks (page_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_blocks_position ON blocks (page_id, position)');
}

// IPC 处理器
ipcMain.handle('db-get-all-pages', () => {
  const pages = db.prepare('SELECT * FROM pages ORDER BY updated_at DESC').all();
  return pages.map(page => ({
    id: page.id,
    title: page.title,
    blocks: [],
    createdAt: new Date(page.created_at),
    updatedAt: new Date(page.updated_at),
  }));
});

ipcMain.handle('db-get-page-with-blocks', (event, pageId) => {
  const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(pageId);
  if (!page) return null;

  const blocks = db.prepare('SELECT * FROM blocks WHERE page_id = ? ORDER BY position').all(pageId);
  
  return {
    id: page.id,
    title: page.title,
    blocks: blocks.map(block => ({
      id: block.id,
      type: block.type,
      content: block.content,
      createdAt: new Date(block.created_at),
      updatedAt: new Date(block.updated_at),
    })),
    createdAt: new Date(page.created_at),
    updatedAt: new Date(page.updated_at),
  };
});

ipcMain.handle('db-create-page', (event, page) => {
  db.prepare(`
    INSERT INTO pages (id, title, created_at, updated_at)
    VALUES (?, ?, ?, ?)
  `).run(page.id, page.title, page.createdAt.toISOString(), page.updatedAt.toISOString());
});

ipcMain.handle('db-update-page', (event, id, updates) => {
  const updatesList = [];
  const values = [];
  
  if (updates.title !== undefined) {
    updatesList.push('title = ?');
    values.push(updates.title);
  }
  
  if (updatesList.length > 0) {
    updatesList.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);
    
    db.prepare(`UPDATE pages SET ${updatesList.join(', ')} WHERE id = ?`).run(...values);
  }
});

ipcMain.handle('db-delete-page', (event, id) => {
  db.prepare('DELETE FROM pages WHERE id = ?').run(id);
});

ipcMain.handle('db-create-block', (event, block, pageId, position) => {
  db.prepare(`
    INSERT INTO blocks (id, page_id, type, content, position, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    block.id,
    pageId,
    block.type,
    block.content,
    position,
    block.createdAt.toISOString(),
    block.updatedAt.toISOString()
  );
});

ipcMain.handle('db-update-block', (event, blockId, updates) => {
  const updatesList = [];
  const values = [];
  
  if (updates.type !== undefined) {
    updatesList.push('type = ?');
    values.push(updates.type);
  }
  
  if (updates.content !== undefined) {
    updatesList.push('content = ?');
    values.push(updates.content);
  }
  
  if (updatesList.length > 0) {
    updatesList.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(blockId);
    
    db.prepare(`UPDATE blocks SET ${updatesList.join(', ')} WHERE id = ?`).run(...values);
  }
});

ipcMain.handle('db-delete-block', (event, blockId) => {
  db.prepare('DELETE FROM blocks WHERE id = ?').run(blockId);
});

ipcMain.handle('db-reorder-blocks', (event, pageId, fromIndex, toIndex) => {
  const blocks = db.prepare('SELECT * FROM blocks WHERE page_id = ? ORDER BY position').all(pageId);
  
  if (fromIndex < 0 || fromIndex >= blocks.length || toIndex < 0 || toIndex >= blocks.length) {
    return;
  }
  
  const [movedBlock] = blocks.splice(fromIndex, 1);
  blocks.splice(toIndex, 0, movedBlock);
  
  const updateStmt = db.prepare('UPDATE blocks SET position = ?, updated_at = ? WHERE id = ?');
  
  blocks.forEach((block, index) => {
    updateStmt.run(index, new Date().toISOString(), block.id);
  });
});

ipcMain.handle('db-insert-block-at-position', (event, block, pageId, position) => {
  db.prepare('UPDATE blocks SET position = position + 1 WHERE page_id = ? AND position >= ?')
    .run(pageId, position);
  
  db.prepare(`
    INSERT INTO blocks (id, page_id, type, content, position, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    block.id,
    pageId,
    block.type,
    block.content,
    position,
    block.createdAt.toISOString(),
    block.updatedAt.toISOString()
  );
});

app.whenReady().then(() => {
  initDatabase();
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (db) {
    db.close();
  }
}); 