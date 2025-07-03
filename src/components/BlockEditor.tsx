import React, { useState, useRef, useEffect } from 'react';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { Block } from '../types';
import { useNotion } from '../context/useNotion';
import { BlockTypeSelector } from './BlockTypeSelector';

interface BlockEditorProps {
  block: Block;
  pageId: string;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}

export function BlockEditor({ block, pageId, index, isSelected, onSelect }: BlockEditorProps) {
  const { updateBlock, deleteBlock, addBlock, currentPage, reorderBlocks } = useNotion();
  const [content, setContent] = useState(block.content);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [typeSelectorPosition, setTypeSelectorPosition] = useState({ top: 0, left: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setContent(block.content);
  }, [block.content]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    updateBlock(pageId, block.id, { content: newContent });

    // Handle "/" command for block type selector
    if (newContent === '/') {
      if (blockRef.current) {
        const rect = blockRef.current.getBoundingClientRect();
        setTypeSelectorPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
        });
        setShowTypeSelector(true);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const newBlockId = addBlock(pageId, 'paragraph', index + 1);
      // Focus the new block after a short delay
      setTimeout(() => {
        const newBlockElement = document.querySelector(`[data-block-id="${newBlockId}"] textarea`);
        if (newBlockElement) {
          (newBlockElement as HTMLTextAreaElement).focus();
        }
      }, 50);
    } else if (e.key === 'Backspace' && content === '' && currentPage && currentPage.blocks.length > 1) {
      e.preventDefault();
      deleteBlock(pageId, block.id);
      // Focus the previous block
      const prevIndex = Math.max(0, index - 1);
      setTimeout(() => {
        const blocks = document.querySelectorAll('[data-block-id] textarea');
        if (blocks[prevIndex]) {
          (blocks[prevIndex] as HTMLTextAreaElement).focus();
        }
      }, 50);
    }
  };

  const handleTypeChange = (newType: Block['type']) => {
    updateBlock(pageId, block.id, { type: newType });
    if (content === '/') {
      updateBlock(pageId, block.id, { content: '' });
      setContent('');
    }
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
    
    // Create a custom drag image
    if (blockRef.current) {
      const dragImage = blockRef.current.cloneNode(true) as HTMLElement;
      dragImage.style.opacity = '0.8';
      dragImage.style.transform = 'rotate(2deg)';
      dragImage.style.position = 'absolute';
      dragImage.style.top = '-1000px';
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 0, 0);
      setTimeout(() => document.body.removeChild(dragImage), 0);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (blockRef.current) {
      const rect = blockRef.current.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      const dropIndex = e.clientY < midpoint ? index : index + 1;
      setDragOverIndex(dropIndex);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear drag over index if we're leaving the block entirely
    if (blockRef.current && !blockRef.current.contains(e.relatedTarget as Node)) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (blockRef.current) {
      const rect = blockRef.current.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      const toIndex = e.clientY < midpoint ? index : index + 1;
      
      if (fromIndex !== toIndex && fromIndex !== toIndex - 1) {
        reorderBlocks(pageId, fromIndex, toIndex > fromIndex ? toIndex - 1 : toIndex);
      }
    }
    
    setDragOverIndex(null);
  };

  const getPlaceholder = () => {
    switch (block.type) {
      case 'heading1':
        return 'Heading 1';
      case 'heading2':
        return 'Heading 2';
      case 'heading3':
        return 'Heading 3';
      case 'bulletList':
        return '• List item';
      case 'numberedList':
        return '1. List item';
      case 'quote':
        return 'Quote';
      case 'code':
        return 'Code snippet';
      default:
        return "Type '/' for commands";
    }
  };

  const getTextareaClassName = () => {
    const baseClasses = 'w-full bg-transparent border-none outline-none resize-none placeholder-gray-400 py-1';
    
    switch (block.type) {
      case 'heading1':
        return `${baseClasses} text-3xl font-bold leading-tight py-2`;
      case 'heading2':
        return `${baseClasses} text-2xl font-semibold leading-tight py-1.5`;
      case 'heading3':
        return `${baseClasses} text-xl font-medium leading-tight py-1`;
      case 'quote':
        return `${baseClasses} text-lg italic border-l-4 border-gray-300 pl-4 py-2`;
      case 'code':
        return `${baseClasses} font-mono text-sm bg-gray-100 rounded p-3`;
      case 'bulletList':
        return `${baseClasses} pl-6`;
      case 'numberedList':
        return `${baseClasses} pl-6`;
      default:
        return `${baseClasses} text-base leading-relaxed`;
    }
  };

  const renderListPrefix = () => {
    if (block.type === 'bulletList') {
      return <span className="absolute left-2 text-gray-600 top-1">•</span>;
    }
    if (block.type === 'numberedList') {
      return <span className="absolute left-2 text-gray-600 top-1">{index + 1}.</span>;
    }
    return null;
  };

  return (
    <>
      {/* Drop indicator above */}
      {dragOverIndex === index && (
        <div className="h-0.5 bg-blue-500 mx-4 rounded-full opacity-80" />
      )}
      
      <div
        ref={blockRef}
        data-block-id={block.id}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`group relative flex items-center transition-all duration-200 ${
          isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
        } ${isDragging ? 'opacity-50 scale-95' : ''} py-1`}
        onClick={onSelect}
      >
        {/* Drag Handle */}
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity mr-2">
          <button 
            className="p-1 hover:bg-gray-200 rounded cursor-grab active:cursor-grabbing"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              const newBlockId = addBlock(pageId, 'paragraph', index + 1);
              setTimeout(() => {
                const newBlockElement = document.querySelector(`[data-block-id="${newBlockId}"] textarea`);
                if (newBlockElement) {
                  (newBlockElement as HTMLTextAreaElement).focus();
                }
              }, 50);
            }}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <Plus className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 relative min-h-[2.5rem] flex items-center">
          {renderListPrefix()}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            className={getTextareaClassName()}
            rows={1}
          />
        </div>

        {/* Delete Button */}
        {currentPage && currentPage.blocks.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteBlock(pageId, block.id);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded ml-2"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        )}

        {/* Block Type Selector */}
        {showTypeSelector && (
          <BlockTypeSelector
            onSelect={handleTypeChange}
            onClose={() => setShowTypeSelector(false)}
            position={typeSelectorPosition}
          />
        )}
      </div>
      
      {/* Drop indicator below */}
      {dragOverIndex === index + 1 && (
        <div className="h-0.5 bg-blue-500 mx-4 rounded-full opacity-80" />
      )}
    </>
  );
}