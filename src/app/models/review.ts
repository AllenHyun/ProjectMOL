export interface Review {
  id: string;
  bookId: string;
  userId: string;
  rating: number;
  pros?: string[];
  cons?: string[];
  text?: string;
  createdAt: string;
}
