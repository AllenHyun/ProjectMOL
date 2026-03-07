export interface ListItem {
  id: string;
  userId: string;
  bookId: string;
  status: 'to-read' | 'reading' | 'read';
  progress?: number;
  lastReadAt?: string;
}
