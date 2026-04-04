export interface Book {
  id: string;
  title: string;
  authors: string[];
  isbn?: string;
  language: string;
  categories: string[];
  tags: string[];
  level: string;
  year?: number;
  coverUrl?: string;
  ratingAvg?: number;
  ratingCount?: number;
  sumaryCount?: number;
  createdAt: string;
}
