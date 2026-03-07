export interface Favorite {
  id: string;
  userId: string;
  type: 'book' | 'summary';
  refId: string;
  createdAt: string;
}
