import React from 'react';
import { 
  Type, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  Quote, 
  Code 
} from 'lucide-react';
import { Block } from '../types';

interface BlockTypeSelectorProps {
  onSelect: (type: Block['type']) => void;
  onClose: () => void;
  position: { top: number; left: number };
}

const blockTypes = [
  { type: 'paragraph' as const, icon: Type, label: 'Text', description: 'Just start writing with plain text.' },
  { type: 'heading1' as const, icon: Heading1, label: 'Heading 1', description: 'Big section heading.' },
  { type: 'heading2' as const, icon: Heading2, label: 'Heading 2', description: 'Medium section heading.' },
  { type: 'heading3' as const, icon: Heading3, label: 'Heading 3', description: 'Small section heading.' },
  { type: 'bulletList' as const, icon: List, label: 'Bulleted list', description: 'Create a simple bulleted list.' },
  { type: 'numberedList' as const, icon: ListOrdered, label: 'Numbered list', description: 'Create a list with numbering.' },
  { type: 'quote' as const, icon: Quote, label: 'Quote', description: 'Capture a quote.' },
  { type: 'code' as const, icon: Code, label: 'Code', description: 'Capture a code snippet.' },
];

export function BlockTypeSelector({ onSelect, onClose, position }: BlockTypeSelectorProps) {
  return (
    <>
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      <div
        className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 w-80"
        style={{
          top: position.top,
          left: position.left,
        }}
      >
        <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
          Basic blocks
        </div>
        {blockTypes.map((blockType) => {
          const Icon = blockType.icon;
          return (
            <button
              key={blockType.type}
              onClick={() => {
                onSelect(blockType.type);
                onClose();
              }}
              className="w-full flex items-start px-3 py-2 hover:bg-gray-100 transition-colors text-left"
            >
              <Icon className="w-5 h-5 text-gray-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-gray-900">{blockType.label}</div>
                <div className="text-xs text-gray-500">{blockType.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}