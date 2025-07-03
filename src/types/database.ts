// 数据库中的页面记录类型
export interface PageRecord {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

// 数据库中的块记录类型
export interface BlockRecord {
  id: string;
  page_id: string;
  type: string;
  content: string;
  position: number;
  created_at: string;
  updated_at: string;
} 