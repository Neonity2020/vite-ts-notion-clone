import { useContext } from 'react';
import { NotionContext } from './NotionContext';

export function useNotion() {
  const context = useContext(NotionContext);
  if (context === undefined) {
    throw new Error('useNotion must be used within a NotionProvider');
  }
  return context;
} 