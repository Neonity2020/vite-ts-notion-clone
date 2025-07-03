import React from 'react';
import { NotionProvider } from './context/NotionContext';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';

function App() {
  return (
    <NotionProvider>
      <div className="h-screen flex bg-white">
        <Sidebar />
        <Editor />
      </div>
    </NotionProvider>
  );
}

export default App;