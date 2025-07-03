export interface Block {
  id: string;
  type: 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'bulletList' | 'numberedList' | 'quote' | 'code';
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Page {
  id: string;
  title: string;
  blocks: Block[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NotionState {
  pages: Page[];
  currentPageId: string | null;
  selectedBlockId: string | null;
  sidebarCollapsed: boolean;
}