export interface Summary {
  id: string;
  bookId: string;
  authorId: string;
  structure: {
    tldr: string;
    keyPoints: string[];
    sections: {
      title: string;
      content: string
    }[];
  };
  wordCount: number;
  status: 'draft' | 'pending' | 'published' | 'rejected';
  qualityScore?: number;
  helpfulScore?: number;
  reportsCount?: number;
  createdAt: string;
  updatedAt: string;
}
