
export interface PaperMetadata {
  title: string;
  type: string;
  year: number;
  venue: string;
  authors: string[];
  affiliations: string[]; // Authors' institutions
  url?: string; // Link to paper or DOI
  keywords: string[];
  citation_count?: number;
  abstract: string;
  problem_solved: string; // Layman terms in Chinese
  method_used: string; // Layman terms in Chinese
  implementation: string;
  results: string;
  impact: string;
  comparison: string;
  takeaway: string;
}

export interface Paper {
  id: string;
  metadata: PaperMetadata;
  rawText: string;
  uploadDate: string; // ISO String
  readStatus: 'unread' | 'reading' | 'read';
  rating: number; // 1-5
  notes: Note[];
}

export interface Note {
  id: string;
  text: string;
  highlightedText?: string;
  createdAt: string;
}

export interface KnowledgeNode {
  id: string;
  group: number; // For coloring
  val: number; // Size/Importance
  desc: string; // Layman explanation in Chinese
}

export interface KnowledgeLink {
  source: string;
  target: string;
  value: number; // Strength
}

export interface GraphData {
  nodes: KnowledgeNode[];
  links: KnowledgeLink[];
}

export enum ExplanationLevel {
  BEGINNER = "入门 (小学生易懂)",
  STANDARD = "标准 (大学生水平)",
  EXPERT = "专家 (同行研究者)"
}

export type ViewMode = 'dashboard' | 'library' | 'reader' | 'graph';