export interface Recommendation {
  userId: string;
  items: {
    bookId: string;
    reason: string;
    score: number;
  }[];
  updatedAt: string;
}
